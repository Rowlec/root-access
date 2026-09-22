import nextEnv from "@next/env";
import postgres from "postgres";

const { loadEnvConfig } = nextEnv;

loadEnvConfig(process.cwd());

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not configured.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });

try {
  const tables = await sql`
    select tablename
    from pg_tables
    where schemaname = 'public'
    order by tablename
  `;
  const expectedTables = [
    "admin_audit_logs",
    "conversations",
    "credit_ledger",
    "messages",
    "orders",
    "payment_events",
    "projects",
    "token_packages",
    "usage_events",
    "users",
    "wallets",
    "workflow_states",
  ];
  const tableNames = new Set(tables.map((row) => row.tablename));
  const missingTables = expectedTables.filter((table) => !tableNames.has(table));

  console.log("Database reachable: yes");
  console.log(`Application tables: ${expectedTables.length - missingTables.length}/${expectedTables.length}`);

  if (missingTables.length > 0) {
    console.error(`Missing tables: ${missingTables.join(", ")}`);
    process.exitCode = 1;
  } else {
    console.log("Schema status: ready");
  }
} catch (error) {
  console.error(
    `Database check failed: ${error instanceof Error ? error.message : "unknown error"}`,
  );
  process.exitCode = 1;
} finally {
  await sql.end();
}
