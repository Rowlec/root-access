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
  const [summary] = await sql`
    select
      (select count(*)::int from users) as users,
      (select count(*)::int from users where role = 'admin') as admins,
      (select count(*)::int from projects) as projects,
      (select count(*)::int from workflow_states) as workflow_states,
      (select count(*)::int from usage_events) as usage_events,
      (select count(*)::int from orders) as orders,
      (select coalesce(sum(balance), 0)::int from wallets) as total_credits
  `;
  const checks = [
    ["At least one user", summary.users > 0],
    ["At least one admin", summary.admins > 0],
    ["At least one project", summary.projects > 0],
    ["Workflow state synced", summary.workflow_states > 0],
    ["Analytics events recorded", summary.usage_events > 0],
  ];

  console.log("CP1 demo data");
  console.log(`- Users: ${summary.users}`);
  console.log(`- Admins: ${summary.admins}`);
  console.log(`- Projects: ${summary.projects}`);
  console.log(`- Workflow states: ${summary.workflow_states}`);
  console.log(`- Usage events: ${summary.usage_events}`);
  console.log(`- Orders: ${summary.orders}`);
  console.log(`- Total wallet credits: ${summary.total_credits}`);
  console.log("");

  for (const [label, passed] of checks) {
    console.log(`${passed ? "PASS" : "TODO"}: ${label}`);
  }

  if (checks.some(([, passed]) => !passed)) {
    process.exitCode = 2;
  }
} catch (error) {
  console.error(
    `Readiness check failed: ${error instanceof Error ? error.message : "unknown error"}`,
  );
  process.exitCode = 1;
} finally {
  await sql.end();
}
