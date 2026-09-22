import { sql } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db";
import { isClerkConfigured } from "@/lib/server/auth";
import { isPayOSConfigured } from "@/lib/server/payos";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    auth: isClerkConfigured(),
    billing: isPayOSConfigured(),
    database: false,
    gemini: Boolean(process.env.GEMINI_API_KEY),
  };

  if (isDatabaseConfigured()) {
    try {
      await getDb().execute(sql`select 1`);
      checks.database = true;
    } catch {
      checks.database = false;
    }
  }

  const coreReady = checks.auth && checks.database && checks.gemini;

  return Response.json(
    {
      checks,
      status: coreReady ? "ready" : "degraded",
      timestamp: new Date().toISOString(),
    },
    {
      headers: { "Cache-Control": "no-store" },
      status: coreReady ? 200 : 503,
    },
  );
}
