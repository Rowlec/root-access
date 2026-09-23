"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import {
  adminAuditLogs,
  creditLedger,
  orders,
  projects,
  tokenPackages,
  users,
  wallets,
} from "@/db/schema";
import { requireAdmin } from "@/lib/server/auth";

export async function updateUserAccessAction(formData: FormData) {
  const parsed = z
    .object({
      disabled: z.enum(["true", "false"]),
      role: z.enum(["user", "admin"]),
      userId: z.string().uuid(),
    })
    .safeParse({
      disabled: formData.get("disabled"),
      role: formData.get("role"),
      userId: formData.get("userId"),
    });
  if (!parsed.success) return;

  const admin = await requireAdmin();
  if (admin.id === parsed.data.userId) return;

  const db = getDb();
  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        isDisabled: parsed.data.disabled === "true",
        role: parsed.data.role,
        updatedAt: new Date(),
      })
      .where(eq(users.id, parsed.data.userId));
    await tx.insert(adminAuditLogs).values({
      action: "user_access_updated",
      adminUserId: admin.id,
      metadata: { disabled: parsed.data.disabled, role: parsed.data.role },
      targetId: parsed.data.userId,
      targetType: "user",
    });
  });
  revalidatePath("/admin/users");
}

export async function adjustUserCreditsAction(formData: FormData) {
  const parsed = z
    .object({ delta: z.coerce.number().int().min(-10000).max(10000), userId: z.string().uuid() })
    .safeParse({ delta: formData.get("delta"), userId: formData.get("userId") });
  if (!parsed.success || parsed.data.delta === 0) return;

  const admin = await requireAdmin();
  const db = getDb();
  await db.transaction(async (tx) => {
    const [currentWallet] = await tx.select().from(wallets).where(eq(wallets.userId, parsed.data.userId)).limit(1);
    if (!currentWallet) return;
    const nextBalance = Math.max(0, currentWallet.balance + parsed.data.delta);
    const actualDelta = nextBalance - currentWallet.balance;
    const [wallet] = await tx.update(wallets).set({ balance: nextBalance, updatedAt: new Date() }).where(eq(wallets.id, currentWallet.id)).returning();
    await tx.insert(creditLedger).values({
      amount: actualDelta,
      balanceAfter: wallet.balance,
      idempotencyKey: `admin:${admin.id}:${crypto.randomUUID()}`,
      metadata: { requestedDelta: parsed.data.delta },
      reason: "manual_adjustment",
      referenceId: admin.id,
      referenceType: "admin_user",
      walletId: wallet.id,
    });
    await tx.insert(adminAuditLogs).values({
      action: "credits_adjusted",
      adminUserId: admin.id,
      metadata: { actualDelta, nextBalance },
      targetId: parsed.data.userId,
      targetType: "user",
    });
  });
  revalidatePath("/admin/users");
}

export async function setAdminProjectStatusAction(formData: FormData) {
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["active", "archived"]) }).safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;
  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx.update(projects).set({ status: parsed.data.status, updatedAt: new Date() }).where(eq(projects.id, parsed.data.id));
    await tx.insert(adminAuditLogs).values({ action: "project_status_updated", adminUserId: admin.id, metadata: { status: parsed.data.status }, targetId: parsed.data.id, targetType: "project" });
  });
  revalidatePath("/admin/projects");
}

export async function deleteAdminProjectAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx.insert(adminAuditLogs).values({ action: "project_deleted", adminUserId: admin.id, targetId: id.data, targetType: "project" });
    await tx.delete(projects).where(eq(projects.id, id.data));
  });
  revalidatePath("/admin/projects");
}

const packageSchema = z.object({
  credits: z.coerce.number().int().min(1).max(100000),
  id: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(80),
  priceVnd: z.coerce.number().int().min(1000).max(100000000),
});

export async function upsertPackageAction(formData: FormData) {
  const parsed = packageSchema.safeParse({ credits: formData.get("credits"), id: formData.get("id"), name: formData.get("name"), priceVnd: formData.get("priceVnd") });
  if (!parsed.success) return;
  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx.insert(tokenPackages).values(parsed.data).onConflictDoUpdate({ target: tokenPackages.id, set: { credits: parsed.data.credits, name: parsed.data.name, priceVnd: parsed.data.priceVnd, updatedAt: new Date() } });
    await tx.insert(adminAuditLogs).values({ action: "package_upserted", adminUserId: admin.id, metadata: parsed.data, targetId: parsed.data.id, targetType: "token_package" });
  });
  revalidatePath("/admin/packages");
}

export async function togglePackageAction(formData: FormData) {
  const parsed = z.object({ id: z.string(), active: z.enum(["true", "false"]) }).safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) return;
  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx.update(tokenPackages).set({ isActive: parsed.data.active === "true", updatedAt: new Date() }).where(eq(tokenPackages.id, parsed.data.id));
    await tx.insert(adminAuditLogs).values({ action: "package_toggled", adminUserId: admin.id, metadata: { active: parsed.data.active }, targetId: parsed.data.id, targetType: "token_package" });
  });
  revalidatePath("/admin/packages");
}

export async function deletePackageAction(formData: FormData) {
  const id = z.string().min(2).max(40).safeParse(formData.get("id"));
  if (!id.success || id.data === "starter" || id.data === "pro") return;
  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx.delete(tokenPackages).where(eq(tokenPackages.id, id.data));
    await tx.insert(adminAuditLogs).values({ action: "package_deleted", adminUserId: admin.id, targetId: id.data, targetType: "token_package" });
  });
  revalidatePath("/admin/packages");
}

export async function cancelOrderAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx.update(orders).set({ status: "cancelled", updatedAt: new Date() }).where(and(eq(orders.id, id.data), eq(orders.status, "pending")));
    await tx.insert(adminAuditLogs).values({ action: "order_cancelled", adminUserId: admin.id, targetId: id.data, targetType: "order" });
  });
  revalidatePath("/admin/orders");
}
