import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { createMockDb } from "./mockDb";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDb?: any;
};

let poolInstance: any = null;
let dbInstance: any = null;

if (databaseUrl) {
  try {
    const isLocalhost =
      databaseUrl.includes("localhost") ||
      databaseUrl.includes("127.0.0.1") ||
      databaseUrl.includes("app_db");

    poolInstance =
      globalForDb.__arenaNextJsPostgresqlPool ??
      new Pool({
        connectionString: databaseUrl,
        ssl: isLocalhost ? false : { rejectUnauthorized: false },
      });

    if (process.env.NODE_ENV !== "production") {
      globalForDb.__arenaNextJsPostgresqlPool = poolInstance;
    }

    poolInstance.on?.("error", (err: unknown) => {
      console.warn("[AI Studio] PostgreSQL pool error (fallback store active):", err);
    });

    dbInstance = drizzle(poolInstance);
  } catch (err) {
    console.warn("[AI Studio] Could not connect to PostgreSQL — using in-memory mock store:", err);
    dbInstance = globalForDb.__arenaNextJsDb ?? createMockDb();
    poolInstance = { query: async () => ({ rows: [] }), end: async () => {} };
  }
} else {
  dbInstance = globalForDb.__arenaNextJsDb ?? createMockDb();
  poolInstance = { query: async () => ({ rows: [] }), end: async () => {} };
}

if (process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsDb = dbInstance;
}

export const pool = poolInstance as Pool;
export const db = dbInstance as unknown as ReturnType<typeof drizzle>;

