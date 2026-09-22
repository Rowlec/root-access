import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";

type Database = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __rootAccessDb: Database | undefined;
  var __rootAccessSql: ReturnType<typeof postgres> | undefined;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getDb(): Database {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!globalThis.__rootAccessSql) {
    globalThis.__rootAccessSql = postgres(databaseUrl, {
      max: 1,
      prepare: false,
    });
  }

  if (!globalThis.__rootAccessDb) {
    globalThis.__rootAccessDb = drizzle(globalThis.__rootAccessSql, { schema });
  }

  return globalThis.__rootAccessDb;
}
