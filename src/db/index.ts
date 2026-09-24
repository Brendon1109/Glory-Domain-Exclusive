import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/**
 * Drizzle over Neon's HTTP driver. Every query is one HTTPS request and no
 * socket is held between requests, so it behaves the same on Vercel and on
 * Cloudflare Workers, where a module scoped pg Pool hangs from the second
 * request. The pooled and the direct connection string both work here.
 * Nothing in the app uses transactions, which this driver does not offer
 * (db.batch is its equivalent). drizzle-kit still migrates over DIRECT_URL.
 *
 * The client is created on first use rather than at import, so `next build`
 * can load every route with no DATABASE_URL set.
 */
type Db = NeonHttpDatabase<typeof schema>;

let instance: Db | undefined;

function getDb(): Db {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL is not set.");
    instance = drizzle({ client: neon(url), schema });
  }
  return instance;
}

export const db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});
