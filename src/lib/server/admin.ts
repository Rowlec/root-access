import "server-only";

import { count, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { orders, projects, usageEvents, users } from "@/db/schema";
import { requireAdmin } from "@/lib/server/auth";

export async function getAdminDashboardData() {
  const admin = await requireAdmin();
  const db = getDb();

  const [userCount, projectCount, paidSummary, recentOrders, eventFunnel] =
    await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(projects),
      db
        .select({
          orders: count(),
          revenueVnd: sql<number>`coalesce(sum(${orders.amountVnd}), 0)::int`,
        })
        .from(orders)
        .where(eq(orders.status, "paid")),
      db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
      db
        .select({ eventName: usageEvents.eventName, value: count() })
        .from(usageEvents)
        .groupBy(usageEvents.eventName)
        .orderBy(desc(count())),
    ]);

  const events = Object.fromEntries(
    eventFunnel.map((event) => [event.eventName, Number(event.value)]),
  );
  const aiRequests =
    (events.ai_request_succeeded ?? 0) + (events.ai_request_failed ?? 0);

  return {
    admin,
    metrics: {
      aiRequests,
      aiSuccessRate:
        aiRequests > 0
          ? Math.round(((events.ai_request_succeeded ?? 0) / aiRequests) * 100)
          : 0,
      paidOrders: Number(paidSummary[0]?.orders ?? 0),
      projects: Number(projectCount[0]?.value ?? 0),
      revenueVnd: Number(paidSummary[0]?.revenueVnd ?? 0),
      users: Number(userCount[0]?.value ?? 0),
    },
    recentOrders,
    eventFunnel,
  };
}
