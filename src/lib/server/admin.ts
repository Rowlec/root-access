import "server-only";

import { count, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
  adminAuditLogs,
  orders,
  profiles,
  projects,
  tokenPackages,
  usageEvents,
  users,
  wallets,
} from "@/db/schema";
import { requireAdmin } from "@/lib/server/auth";
import { ensureDefaultPackages } from "@/lib/server/billing";

export async function getAdminDashboardData() {
  const admin = await requireAdmin();
  const db = getDb();

  const [userCount, adminCount, projectCount, paidSummary, recentOrders, eventFunnel] =
    await Promise.all([
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(users).where(eq(users.role, "admin")),
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
      admins: Number(adminCount[0]?.value ?? 1),
    },
    recentOrders,
    eventFunnel,
  };
}

export async function getAdminUsers() {
  await requireAdmin();
  const rows = await getDb()
    .select({
      walletBalance: wallets.balance,
      profileCredits: profiles.credits,
      authUserId: users.authUserId,
      createdAt: users.createdAt,
      displayName: users.displayName,
      email: users.email,
      id: users.id,
      isDisabled: users.isDisabled,
      role: users.role,
    })
    .from(users)
    .leftJoin(wallets, eq(wallets.userId, users.id))
    .leftJoin(profiles, eq(profiles.id, users.id))
    .orderBy(desc(users.createdAt));

  return rows.map((r) => ({
    authUserId: r.authUserId,
    createdAt: r.createdAt,
    displayName: r.displayName,
    email: r.email,
    id: r.id,
    isDisabled: r.isDisabled,
    role: r.role,
    balance: r.profileCredits ?? r.walletBalance ?? 5,
  }));
}

export async function getAdminProjects() {
  await requireAdmin();
  return getDb()
    .select({
      createdAt: projects.createdAt,
      id: projects.id,
      ownerEmail: users.email,
      progressPercent: projects.progressPercent,
      status: projects.status,
      title: projects.title,
      updatedAt: projects.updatedAt,
    })
    .from(projects)
    .leftJoin(users, eq(projects.userId, users.id))
    .orderBy(desc(projects.updatedAt));
}

export async function getAdminPackages() {
  await requireAdmin();
  await ensureDefaultPackages();
  return getDb().select().from(tokenPackages).orderBy(desc(tokenPackages.updatedAt));
}

export async function getAdminOrders() {
  await requireAdmin();
  return getDb()
    .select({
      amountVnd: orders.amountVnd,
      checkoutUrl: orders.checkoutUrl,
      createdAt: orders.createdAt,
      credits: orders.credits,
      email: users.email,
      id: orders.id,
      orderCode: orders.orderCode,
      packageId: orders.packageId,
      paidAt: orders.paidAt,
      status: orders.status,
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt));
}

export async function getAdminAuditLogs() {
  await requireAdmin();
  return getDb()
    .select({
      action: adminAuditLogs.action,
      adminEmail: users.email,
      createdAt: adminAuditLogs.createdAt,
      id: adminAuditLogs.id,
      metadata: adminAuditLogs.metadata,
      targetId: adminAuditLogs.targetId,
      targetType: adminAuditLogs.targetType,
    })
    .from(adminAuditLogs)
    .leftJoin(users, eq(adminAuditLogs.adminUserId, users.id))
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(200);
}
