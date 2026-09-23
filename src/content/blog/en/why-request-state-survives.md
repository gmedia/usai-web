---
title: Why should request state survive after the request is finished?
description: A request arrives, creates some mutable state, and finishes. In most backends that state is still alive afterwards. Usai starts from the question of why.
translationKey: why-request-state-survives
lang: en
date: 2026-09-24
author: Sakala maintainers
draft: true
tags: [lifetimes, runtime, typescript, backend]
series:
  name: How Usai works
  part: 1
evidence:
  status: Usai v0.0.8, alpha. Production qualification is in progress; contracts may still change.
  setup: 'The correctness probe and the throughput and CPU numbers come from the 2026-09-23 sweep: a Xeon E5-2680 v4, the server pinned to 8 CPUs, PostgreSQL 18, and six workload classes against Node, Node × 8, Bun, Deno, Rust axum and PHP-FPM.'
  supports:
    - Usai gives every unit of work a fresh execution world. A module-level counter answers 1 on every request.
    - On routes that touch PostgreSQL, Usai runs level with a single Node process in throughput and ahead of it on transactions.
    - The fresh world has a measurable CPU cost, 6–14× Node's on a trivial route.
  doesNotSupport:
    - That Usai is generally faster than Node, Bun, Deno, PHP or Rust.
    - That a fresh world is a security boundary. It is semantic isolation, a correctness property.
    - That Usai is ready for every production workload.
  sources:
    - label: 2026-09-23-sweep.md
      url: https://github.com/gmedia/usai/blob/main/docs/measurements/2026-09-23-sweep.md
    - label: LIFECYCLE-CONTRACTS.md
      url: https://github.com/gmedia/usai/blob/main/docs/LIFECYCLE-CONTRACTS.md
    - label: AWS Lambda best practices
      url: https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html
    - label: Cloudflare Workers best practices
      url: https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
---

```text
A request arrives.
It creates some mutable application state.
The request finishes.

Why is that state still alive?
```

The usual answer is simple: because the process is still alive. In most backends the process starts once, and every request after that runs inside the same long-lived application world.

```text
process starts
├─ request A
├─ request B
├─ request C
└─ …and every mutable thing any of them left behind
```

That model is fast, familiar and correct for a great many programs. It also means state gets its lifetime from **where it happens to be stored**, not from **what it is for**. Usai is an attempt to separate those two things.

## The bug nobody writes on purpose

Here is a handler with a variable at the top of the file:

```ts
let counter = 0; // module-level state

export const count = http.get("/count", async () => {
  counter += 1;
  return { count: counter };
});
```

Nobody ships a counter like this. People do ship its cousins: a `currentUser` set by middleware, a tenant id cached "for convenience", a memoised object that someone later mutates. They behave exactly like `counter`: they outlive the request that set them.

We ask every server in our benchmark suite for exactly this counter, ten times in a row. Here is what comes back:

| Server | Ten requests |
|---|---|
| One Node process | `1 2 3 4 5 6 7 8 9 10` |
| Node cluster, 8 workers | `1 1 1 1 1 1 1 1 2 2` |
| Usai | `1 1 1 1 1 1 1 1 1 1` |

The first row is the obvious leak. The second row is worse. Eight processes each remember something different, so **the same request gets a different answer depending on which worker picked it up**. A bug like that passes review, passes tests on a laptop, and then shows up in production as "cannot reproduce".

## This is not a problem we invented

Platforms that reuse execution environments for speed document the same tension, and they leave the fix to you.

AWS Lambda asks you to reuse the environment for expensive things like SDK clients and database connections, and in the same breath warns:

> To avoid potential data leaks across invocations, don't use the execution environment to store user data, events, or other information with security implications.

Cloudflare Workers is blunter:

> Workers reuse isolates across requests. A variable set during one request is still present during the next.

Both platforms reach the same conclusion. **Reusing infrastructure is essential for performance, and reusing mutable application state is dangerous.** Both ask developers to hold that line by discipline.

Usai asks a different question: what if that line were part of the runtime's structure instead?

## Persistent infrastructure is not persistent state

The inference we question is small:

```text
the infrastructure is persistent
therefore
the application state is persistent
```

The first line is good engineering. Listeners, schedulers, connection pools and compiled code are expensive to build and safe to reuse. The second line does not follow from the first. It is simply what happens when both live in the same process.

PHP-FPM has kept these apart for a long time. Its worker processes persist, but application state is rebuilt for every request. That is why PHP-FPM answers `1 1 1 1 1 1 1 1 1 1` to the same probe, for the same reason Usai does.

Usai splits a backend into three layers, each with its own lifetime:

```text
persistent runtime              lives for the process
  listeners · scheduler · pools · metrics

immutable application definition   built once per deploy
  compiled code · routes · schemas · config

execution world                 lives for one unit of work
  request state · auth context · globals · leases
```

Every request, task, cron tick and queue message gets a **fresh execution world**. When the work is done, the world ends. The runtime does not.

## Not everything should be short-lived

A common misreading is that Usai throws everything away. It does not. Some things deserve to live long, and you say so:

| Work | Declared with | The world lives for |
|---|---|---|
| HTTP request | `http.get` / `http.post` / … | one request |
| Task | `task` | one invocation |
| Cron | `cron` | one tick |
| Queue message | `queue.consume` | one message |
| WebSocket | `socket` | the connection |
| Service | `service` | while the revision is active |

A PostgreSQL pool is a **resource**. It outlives worlds on purpose, and each world borrows a connection through a lease. A WebSocket world lives exactly as long as its connection. A `service` is persistent because you declared it persistent. The default is ephemeral, and persistence is always a deliberate choice.

## Death is not cleanup

Throwing a world away does not make everything safe. A query can still be running on a database connection after the world that started it has ended. A timer can still be scheduled. So Usai adds a second rule: **asynchronous work always has an owner.**

```ts
export const order = http.post("/orders", async () => {
  setTimeout(sendEmail, 1000); // nobody owns this
  return { ok: true };
});
```

In a long-lived Node process this usually works, until the process restarts at the wrong moment. In Usai the runtime cancels the timer and tells you why:

```text
WARN http work `POST /orders` ended with live asynchronous work (1 timer).

The http lifetime ended when its result was produced. Work that is
still pending cannot remain owned by this world, so it was cancelled.

Use:
  task()    for independent finite work
  cron()    for scheduled work
  service() for intentional long-running work
or await the work before returning.
```

The fix says what you mean: `await ctx.tasks.dispatch(sendEmail, …)` hands the work to a task that runs in its own world.

The same rule decides when a database connection can be reused. A connection goes back to the pool only when Usai knows how its last operation ended: it finished normally, it failed with a known SQL error, or its cancellation was confirmed. If the outcome is ambiguous, the connection is quarantined and replaced, never reused.

## What it costs

A fresh world is not free, and we would rather tell you than let you find out.

- On a route that does nothing, Usai spends **6–14× Node's CPU per request**. That is the price of entering a fresh world, validating the boundary, and settling ownership.
- On routes that touch PostgreSQL, which is what real applications are mostly made of, the difference mostly disappears. Usai runs **level with a single Node process**, ahead of it on transactions, and **1.8–7× ahead of Laravel**. As the sweep puts it: *the query is the bill; the runtime is rounding.*
- Memory grows with **concurrency**, not with request count. 64 concurrent requests cost about 0.5 GiB.

So Usai is not the choice for a hot, CPU-bound endpoint where every microsecond counts. It is for backends where you want persistent infrastructure without every piece of state quietly inheriting the lifetime of the process. That usually means mostly-idle services, multi-tenant APIs, webhooks, and apps that mix HTTP with tasks, cron, queues and sockets.

## Try it, and try to break it

```bash
pnpm dlx @sakaladev/create-usai my-app
cd my-app && pnpm install && pnpm dev
```

Usai is alpha, at 0.0.8. It has survived a 72-hour soak and a campaign of deliberate failures, and it has not yet met many developers outside the project. That is the next experiment. If you try it, we want to hear where the model confused you, where it got in your way, and where it caught a bug you did not know you had.

The next posts in this series go deeper: how a world is created cheaply, what 73 million requests over three days taught us, and where Usai loses.
