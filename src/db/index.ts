import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Module-scoped connection pool. On Vercel Fluid compute the module is reused
 * across invocations on warm instances, so we keep a single small pool and
 * reuse it (using the Neon *pooled* connection string) to avoid exhausting
 * database connections. The globalThis guard prevents duplicate pools during
 * Next.js dev hot-reloads.
 */
const globalForDb = globalThis as unknown as { __gdPool?: Pool };

const pool =
  globalForDb.__gdPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__gdPool = pool;

export const db = drizzle(pool, { schema });
