---
title: Our 72-hour soak lost 81% of its throughput. We had to prove it wasn't the runtime.
description: A three-day soak served 73.6 million requests without a single 5xx, and still slowed from 794 to 154 requests per second. The easy explanation was the database. We ran a control to find out.
translationKey: soak-test-throughput-decay
lang: en
date: 2026-09-29
author: Sakala maintainers
draft: true
tags: [soak-test, postgresql, reliability, runtime]
series:
  name: How Usai works
  part: 2
evidence:
  status: Usai v0.0.15, alpha. The soaks ran on 2026-09-19/22 and 2026-09-23/24, on the builds of those days.
  setup: 'One VM (16 vCPU Xeon) running a production-shaped deployment: Caddy in front of the published Usai runtime image, PostgreSQL 18, and the examples/invoicing app. Eight closed-loop clients listed, fetched and created invoices, and a sampler recorded status once a minute. Other work ran on the same host at times; the post names it.'
  supports:
    - Over 73.6 M and 124.5 M requests, the runtime returned no 5xx and no 503, and kept memory, descriptors and its ownership counters flat.
    - The 72-hour throughput decay came from the application's unpruned table. With the data pruned, 24 hours showed no decay at all.
    - The runtime's own cost per request stayed flat while throughput fell.
  doesNotSupport:
    - Behaviour under saturation, on other hardware, across several hosts, or for other applications.
    - A general claim about PostgreSQL performance. The decay is one table's growth under one write mix.
    - That Usai is ready for every production workload.
  sources:
    - label: 2026-09-18-p5-p6-qualification.md (72 h soak)
      url: https://usai.sakala.dev/docs/measurements/2026-09-18-p5-p6-qualification/
    - label: 2026-09-24-bounded-soak.md (24 h control)
      url: https://usai.sakala.dev/docs/measurements/2026-09-24-bounded-soak/
    - label: 2026-09-26-idle-decommit.md
      url: https://usai.sakala.dev/docs/measurements/2026-09-26-idle-decommit/
---

Our three-day soak served 73,627,701 requests without a single 5xx, and still lost 81% of its throughput along the way. A second, 24-hour run with the application's data pruned showed no slowdown at all. The cause was one ever-growing table, not the runtime. This post is how we got from the first observation to the second, and why we didn't stop at the easy answer.

```text
72-hour soak     hour 0–6: 794 requests/second    hour 66–72: 154 requests/second
24-hour control  hour 1: 1,416 requests/second    hour 24: 1,480 requests/second
```

## The setup

A soak test runs steady load for a long time. It catches what short benchmarks miss: slow leaks, gradual drift, and things that only break on the millionth request.

Ours ran against a production-shaped deployment on one VM. Caddy sat in front of the published Usai runtime image, which talked to PostgreSQL 18 and ran the `examples/invoicing` application from the repository. Eight closed-loop clients repeated one cycle: list invoices, fetch one, create one. About 10% of requests wrote a new invoice. Once a minute, a sampler recorded memory, CPU, open file descriptors and the runtime's own status page.

## Three days, one falling line

By every correctness criterion we wrote down beforehand, the 72-hour soak passed. There was no 5xx and no 503, and memory stayed flat. Throughput was another story:

| Window | Requests/second | Median latency (p50) | Slow latency (p99) |
|---|---|---|---|
| 0–6 h | 794 | 4.6 ms | 84 ms |
| 12–18 h | 349 | 5.1 ms | 289 ms |
| 24–30 h | 244 | 5.8 ms | 450 ms |
| 48–54 h | 181 | 5.4 ms | 666 ms |
| 66–72 h | 154 | 5.3 ms | 810 ms |

The median barely moved. The slow tail grew tenfold, and throughput fell to a fifth.

Meanwhile, everything the runtime owns stayed flat:

- CPU inside the application's world went from 1.56 to 1.59 ms per request.
- CPU for the whole process went from 2.80 to 3.04 ms per request.
- SQL operations went from 2.52 to 2.59 per request.
- Memory charged to the container went from 51.5 to 53.5 MiB, and open descriptors from 29 to 30.
- The runtime created 73,627,744 execution worlds, detected no detached work, quarantined no database connection, and logged no WARN or ERROR line in three days.

## The easy explanation, and the other one

The workload wrote about 7.4 million invoices, with their line items, into one table that nobody pruned. More rows mean bigger indexes, more write-ahead log, and more checkpoint and autovacuum work. The application waits longer for PostgreSQL, so a closed-loop client completes fewer requests per second. Flat CPU per request fits that story.

It also fits a less comfortable one. A runtime leaking something outside the CPU would draw the same curve. Think of a structure that keeps growing and gets walked once per request, a connection pool that slowly degrades, or a table of handles nobody frees. CPU per request stays flat, memory can stay flat if the growth is small, and throughput still falls.

Both stories predicted exactly what we saw. Picking the convenient one would have been a guess, written up as a finding.

## The control run

So we ran it again: the same deployment, the same eight clients and the same load, for 24 hours. The only change was that the harness deleted what the load created, the way an operator would. Every minute it removed invoices beyond the newest 20,000, and finished queue rows older than a minute.

If the data caused the decay, the decay would disappear. If the runtime caused it, the decay would still be there.

It disappeared. Throughput was 1,416 requests per second in the first hour and 1,480 in the last, roughly twice the rate of the 72-hour run's opening hours. Over 124,471,717 successful requests:

| | |
|---|---|
| Server errors | 0 × 5xx, 0 × 503 (and 4 × 4xx) |
| Mean latency | 4.39 ms across the whole run |
| Lifecycle | 0 detached work, 0 quarantined connections, 0 late or stale completions |
| Memory charged to the container | 53.2 to 55.2 MiB |
| Open descriptors | 29 to 31 |

**The decay was the application's table, not the runtime.** A day of machine time let us say that as a measurement rather than an opinion.

## The bad seconds

The control run was not perfect. The load client recorded 344 timeouts, spread over 91 seconds. None came from the server, which answered no 5xx and no 503 in those seconds. All of them fell in two windows:

- In hour 1, another job on the same host was building a Docker image. That explains 12 timeouts in 28 seconds.
- In hours 16 to 18, other work on the host cut the container's CPU share from about 415% to 65% for a few minutes. A closed-loop client that gets fewer cycles sends fewer requests, and eventually hits its own 10-second timeout.

Outside those two windows, over 22 hours and 114 million requests, not one second produced an error. We report the timeouts anyway. A soak that hides its bad seconds makes readers wonder what else it hides.

## Two memory numbers, 36 MiB apart

The control run also taught us something about our instrument. Midway through, the runtime's status page said the process used 89 MiB, while `docker stats` said 53 MiB. Both were correct.

The process figure, `VmRSS`, counts a shared page once for every place it is mapped. Usai maps one prepared application image into each of its eight pooled world slots, so about 13 MiB of real pages showed up as 36 MiB.

The container figure, the cgroup charge, is what decides whether a container gets killed. It under-counts the runtime's own binary. Linux charges a file's pages to whichever container read them first, and something else had read that image layer before.

The honest middle is PSS, which splits shared pages between the processes using them: about 66 MiB here. The soak summary now prints all three numbers. The result doesn't change, because each run used the same instrument from start to end. But a memory figure from one tool should never be compared with a figure from another.

## What the same campaign caught earlier

A soak that passes is only half the story. The same campaign found and fixed real problems before the long runs.

The first was about replacing the running application. Doing it 1,000 times in a row killed the process after about 270 replacements, as memory grew about 2 MB each time until it hit the container's 512 MB limit. It wasn't a leak in the runtime, since the count of compiled images stayed at two. The cause was glibc's `malloc`, which keeps a separate memory arena per worker thread; each arena held on to a freed, module-sized chunk the others could not reuse. Capping the number of arenas fixed it. The final run did 1,000 replacements under load, with 2,039,500 requests and no errors.

The second is a trade-off rather than a bug: memory after a burst does not come back. A world slot that has been used keeps its pages, which buys about 16% more throughput on the next burst. A new release path added upstream in the engine reclaims only about 12 MiB and leaves the plateau where it was. The sizing guide says so, but it means your peak concurrency sets your memory, not your current load.

## What this means if you run a backend

Most of this is not about Usai.

1. A long soak of your application is also a soak of your database. If one table takes millions of inserts, the soak will measure that table. Prune or partition it, or run a control with bounded data, before you blame the runtime.
2. Flat CPU per request does not prove there is no leak. It only rules out one kind. Change one variable and run again.
3. Know which memory number you are reading. Process RSS, PSS and the container's charge answer different questions, and only the last one decides whether the container gets killed.

## Try it

```bash
npm create @sakaladev/usai@latest my-app
cd my-app && npm install && npm run dev
```

Everything above is on the site with the raw numbers: the [benchmark page](https://usai.sakala.dev/benchmarks/), the [72-hour soak report](https://usai.sakala.dev/docs/measurements/2026-09-18-p5-p6-qualification/) and the [24-hour control run](https://usai.sakala.dev/docs/measurements/2026-09-24-bounded-soak/). If you see a hole in the reasoning, open an issue. That is exactly what we want to hear.
