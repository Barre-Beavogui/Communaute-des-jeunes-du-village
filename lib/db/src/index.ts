import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index.js";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Serverless instances can multiply quickly. Keep their Neon connection
  // footprint deliberately small while still reusing warm connections.
  max: process.env["VERCEL"] ? 2 : 10,
  idleTimeoutMillis: 10_000,
  allowExitOnIdle: true,
});
export const db = drizzle(pool, { schema });

export * from "./schema/index.js";
