import nextEnv from "@next/env";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("Database migration failed: DATABASE_URL is not configured.");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
});

try {
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Database migrations applied successfully.");
} catch (error) {
  console.error("Database migration failed.");
  console.error(
    error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error),
  );

  if (error && typeof error === "object" && "code" in error) {
    console.error(`Postgres error code: ${String(error.code)}`);
  }

  process.exitCode = 1;
} finally {
  await client.end();
}
