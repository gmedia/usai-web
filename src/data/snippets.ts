/**
 * Code shown on the home page. Taken from gmedia/usai README.md,
 * examples/hello and docs/GUIDE.md (§5–§10, §15). Keep them compilable in
 * spirit: if the SDK changes, update these in the same PR.
 */
export const snippets: Record<string, string> = {
  hello: `import { defineApp, http, errors } from "@sakaladev/usai";
import { z } from "zod";

const Params = z.object({ name: z.string().min(1).max(40) });
const Greeting = z.object({ hello: z.string() });

export const hello = http.get("/hello/:name", { params: Params, response: Greeting }, async (ctx) => {
  if (ctx.params.name === "nobody") throw errors.notFound("nobody is not here");
  return { hello: ctx.params.name };
});

export default defineApp({ name: "hello", workloads: [hello] });`,

  tasks: `export const order = http.post("/orders", { body: Order }, async (ctx) => {
  // owned: this request waits for it
  const total = await ctx.tasks.invoke(priceOrder, ctx.body);

  // transferred: runs later, in its own world
  await ctx.tasks.dispatch(sendReceipt, { orderId: total.id });

  return total;
});`,

  cron: `export const cleanup = cron("cleanup",
  { schedule: "0 3 * * *", timeout: "5m", overlap: "skip" },
  async (ctx) => { /* … */ });

// one instance per tick, however many replicas
export const digest = cron("digest",
  { schedule: "0 7 * * *", exclusive: true, resources: [db] },
  async (ctx) => { /* … */ });`,

  queue: `export const orders = queue.consume("orders", {
  message: OrderEvent,
  concurrency: 8,
  retry: { maxAttempts: 5, backoff: "exponential" },
}, async (ctx) => {
  await process(ctx.message);
});

// anywhere with a world:
await ctx.queue.publish("orders", { orderId });`,

  socket: `export const chat = socket("/chat", { incoming: Incoming, outgoing: Outgoing }, {
  async open(ctx) {
    ctx.state["count"] = 0;          // lives as long as the connection
  },
  async message(ctx) {
    ctx.state["count"] += 1;
    await ctx.send({ echo: ctx.message.text });
  },
});`,

  service: `export const ledgerSync = service("ledger-sync", { restart: { mode: "on-failure" } }, async (ctx) => {
  const state = new Map();           // persistent on purpose
  while (!ctx.signal.aborted) {
    await reconcile(state);
    await ctx.sleep("5s");
  }
});`,

  test: `import { testApp } from "@sakaladev/usai/test";

const app = await testApp({ root: "." });

const res = await app.http.post("/users", { body: { name: "Ayu", email: "ayu@x.io" } });
await app.task("send-receipt").invoke({ orderId: "o1" });
await app.cron("cleanup").run();
await app.queue("orders").deliver({ orderId: "o1" });`,

  counter: `let counter = 0;   // module-level state

export const count = http.get("/count", async () => {
  counter += 1;
  return { count: counter };
});`,

  antiPattern: `export const order = http.post("/orders", async () => {
  setTimeout(sendEmail, 1000);   // nobody owns this
  return { ok: true };
});`,

  antiPatternError: `HTTP work ended with live asynchronous work.

The request no longer owns execution after the response completes.

Use:
- task() for independent finite work
- cron() for scheduled work
- service() for intentional long-running work`,

  fix: `export const order = http.post("/orders", { body: Order }, async (ctx) => {
  await ctx.tasks.dispatch(sendEmail, { orderId: ctx.body.id });   // owned by a task now
  return { ok: true };
});`,
};
