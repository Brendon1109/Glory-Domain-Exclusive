/**
 * Cloudflare Workers entry. OpenNext's generated worker serves the Next app,
 * and this adds the daily Cron Trigger that Vercel Cron runs today.
 *
 * The cron calls the same /api/push/daily route in process, with the same
 * Bearer CRON_SECRET, so the logic and the fail closed check stay in one
 * place. Without CRON_SECRET the route answers 503 and the run is marked
 * failed.
 *
 * Bundled by wrangler, not by Next, so tsconfig.json leaves it out.
 */
// @ts-expect-error: generated at build time by `opennextjs-cloudflare build`
import { default as handler } from "./.open-next/worker.js";

type Env = { CRON_SECRET?: string };
type Controller = { cron: string; scheduledTime: number };
type Context = { waitUntil(promise: Promise<unknown>): void };

const worker = {
  fetch: handler.fetch,

  async scheduled(controller: Controller, env: Env, ctx: Context) {
    const headers = new Headers();
    if (env.CRON_SECRET) headers.set("authorization", `Bearer ${env.CRON_SECRET}`);
    // This request never leaves the isolate. It carries the canonical host
    // because OpenNext keeps the first request's origin for the isolate.
    const req = new Request("https://glorydomain.org/api/push/daily", { headers });
    const res = await handler.fetch(req, env, ctx);
    const body = (await res.text()).slice(0, 300);
    if (!res.ok) {
      // Throwing marks the run as failed in the Worker's cron events and logs.
      throw new Error(`[cron ${controller.cron}] /api/push/daily answered ${res.status}: ${body}`);
    }
    console.log(`[cron ${controller.cron}] /api/push/daily ${res.status} ${body}`);
  },
};

export default worker;
