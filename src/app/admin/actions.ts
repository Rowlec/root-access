"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { getDb } from "@/db";
import {
  adminAuditLogs,
  authUser,
  creditLedger,
  creditTransactions,
  orders,
  packs,
  profiles,
  projects,
  siteSelectors,
  tokenPackages,
  users,
  wallets,
} from "@/db/schema";
import { requireAdmin } from "@/lib/server/auth";

/**
 * Add or Promote an Admin by Email address
 * Supports multiple admins: if user exists, sets role to admin.
 * If user hasn't registered yet, pre-provisions an admin row in users table.
 */
export async function addAdminByEmailAction(formData: FormData) {
  const parsed = z
    .object({
      email: z.string().trim().email().toLowerCase(),
    })
    .safeParse({ email: formData.get("email") });
  if (!parsed.success) return;

  const admin = await requireAdmin();
  const db = getDb();
  const email = parsed.data.email;

  await db.transaction(async (tx) => {
    // 1. Check if user exists in users table
    let [existingUser] = await tx
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = ${email}`)
      .limit(1);

    if (existingUser) {
      await tx
        .update(users)
        .set({ role: "admin", isDisabled: false, updatedAt: new Date() })
        .where(eq(users.id, existingUser.id));
    } else {
      // 2. Check if user exists in Better-Auth authUser table
      const [authRow] = await tx
        .select()
        .from(authUser)
        .where(sql`lower(${authUser.email}) = ${email}`)
        .limit(1);

      const [newUser] = await tx
        .insert(users)
        .values({
          authUserId: authRow ? authRow.id : null,
          displayName: authRow?.name || email.split("@")[0],
          email,
          role: "admin",
          isDisabled: false,
        })
        .returning();

      // Ensure wallet and profile exist
      await tx
        .insert(wallets)
        .values({ userId: newUser.id, balance: 100 })
        .onConflictDoNothing();

      await tx
        .insert(profiles)
        .values({
          id: newUser.id,
          displayName: newUser.displayName,
          credits: 100,
        })
        .onConflictDoNothing();

      existingUser = newUser;
    }

    await tx.insert(adminAuditLogs).values({
      action: "admin_added",
      adminUserId: admin.id,
      metadata: { email, promotedBy: admin.email },
      targetId: existingUser.id,
      targetType: "user",
    });
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

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
  const db = getDb();

  await db.transaction(async (tx) => {
    // Prevent locking oneself out
    if (admin.id === parsed.data.userId && parsed.data.disabled === "true") {
      return;
    }

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
  revalidatePath("/admin");
}

export async function adjustUserCreditsAction(formData: FormData) {
  const parsed = z
    .object({
      delta: z.coerce.number().int().min(-10000).max(10000),
      userId: z.string().uuid(),
    })
    .safeParse({
      delta: formData.get("delta"),
      userId: formData.get("userId"),
    });
  if (!parsed.success || parsed.data.delta === 0) return;

  const admin = await requireAdmin();
  const db = getDb();

  await db.transaction(async (tx) => {
    // 1. Get or create wallet
    let [currentWallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, parsed.data.userId))
      .limit(1);

    if (!currentWallet) {
      [currentWallet] = await tx
        .insert(wallets)
        .values({ userId: parsed.data.userId, balance: 5 })
        .returning();
    }

    // 2. Get or create profile
    let [currentProfile] = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.id, parsed.data.userId))
      .limit(1);

    if (!currentProfile) {
      [currentProfile] = await tx
        .insert(profiles)
        .values({
          id: parsed.data.userId,
          credits: currentWallet.balance,
        })
        .returning();
    }

    // Use profile credits as authoritative starting balance
    const currentCredits = currentProfile.credits ?? currentWallet.balance;
    const nextBalance = Math.max(0, currentCredits + parsed.data.delta);
    const actualDelta = nextBalance - currentCredits;

    // 3. Update both profile and wallet
    await tx
      .update(profiles)
      .set({ credits: nextBalance })
      .where(eq(profiles.id, parsed.data.userId));

    const [updatedWallet] = await tx
      .update(wallets)
      .set({ balance: nextBalance, updatedAt: new Date() })
      .where(eq(wallets.id, currentWallet.id))
      .returning();

    // 4. Ledger & Transaction records
    await tx.insert(creditLedger).values({
      amount: actualDelta,
      balanceAfter: updatedWallet.balance,
      idempotencyKey: `admin:${admin.id}:${crypto.randomUUID()}`,
      metadata: { requestedDelta: parsed.data.delta },
      reason: "manual_adjustment",
      referenceId: admin.id,
      referenceType: "admin_user",
      walletId: updatedWallet.id,
    });

    await tx.insert(creditTransactions).values({
      userId: parsed.data.userId,
      delta: actualDelta,
      reason: "admin",
      refId: admin.id,
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
  revalidatePath("/admin");
  revalidatePath("/app");
}

export async function setAdminProjectStatusAction(formData: FormData) {
  const parsed = z
    .object({
      id: z.string().uuid(),
      status: z.enum(["active", "archived"]),
    })
    .safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) return;

  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx
      .update(projects)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(projects.id, parsed.data.id));
    await tx.insert(adminAuditLogs).values({
      action: "project_status_updated",
      adminUserId: admin.id,
      metadata: { status: parsed.data.status },
      targetId: parsed.data.id,
      targetType: "project",
    });
  });
  revalidatePath("/admin/projects");
}

export async function deleteAdminProjectAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx.insert(adminAuditLogs).values({
      action: "project_deleted",
      adminUserId: admin.id,
      targetId: id.data,
      targetType: "project",
    });
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
  const parsed = packageSchema.safeParse({
    credits: formData.get("credits"),
    id: formData.get("id"),
    name: formData.get("name"),
    priceVnd: formData.get("priceVnd"),
  });
  if (!parsed.success) return;

  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx
      .insert(tokenPackages)
      .values({ ...parsed.data, isActive: true })
      .onConflictDoUpdate({
        target: tokenPackages.id,
        set: {
          credits: parsed.data.credits,
          name: parsed.data.name,
          priceVnd: parsed.data.priceVnd,
          updatedAt: new Date(),
        },
      });
    await tx.insert(adminAuditLogs).values({
      action: "package_upserted",
      adminUserId: admin.id,
      metadata: parsed.data,
      targetId: parsed.data.id,
      targetType: "token_package",
    });
  });
  revalidatePath("/admin/packages");
  revalidatePath("/app/billing");
}

export async function togglePackageAction(formData: FormData) {
  const parsed = z
    .object({ id: z.string(), active: z.enum(["true", "false"]) })
    .safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) return;

  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx
      .update(tokenPackages)
      .set({
        isActive: parsed.data.active === "true",
        updatedAt: new Date(),
      })
      .where(eq(tokenPackages.id, parsed.data.id));
    await tx.insert(adminAuditLogs).values({
      action: "package_toggled",
      adminUserId: admin.id,
      metadata: { active: parsed.data.active },
      targetId: parsed.data.id,
      targetType: "token_package",
    });
  });
  revalidatePath("/admin/packages");
  revalidatePath("/app/billing");
}

export async function deletePackageAction(formData: FormData) {
  const id = z.string().min(2).max(40).safeParse(formData.get("id"));
  if (!id.success || id.data === "starter" || id.data === "pro") return;

  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx.delete(tokenPackages).where(eq(tokenPackages.id, id.data));
    await tx.insert(adminAuditLogs).values({
      action: "package_deleted",
      adminUserId: admin.id,
      targetId: id.data,
      targetType: "token_package",
    });
  });
  revalidatePath("/admin/packages");
  revalidatePath("/app/billing");
}

/**
 * Approve a pending order manually and credit tokens to customer
 * Crucial when VietQR/PayOS webhook has network delay or bank transfer was verified
 */
export async function approveOrderAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const admin = await requireAdmin();
  const db = getDb();

  await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(and(eq(orders.id, id.data), eq(orders.status, "pending")))
      .limit(1);

    if (!order) return;

    // 1. Mark order as paid
    await tx
      .update(orders)
      .set({
        status: "paid",
        paidAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    // 2. Credit profile
    let [profile] = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.id, order.userId))
      .limit(1);

    const currentCredits = profile?.credits ?? 0;
    const nextCredits = currentCredits + order.credits;

    if (!profile) {
      await tx
        .insert(profiles)
        .values({
          id: order.userId,
          credits: nextCredits,
        })
        .onConflictDoUpdate({
          target: profiles.id,
          set: { credits: nextCredits },
        });
    } else {
      await tx
        .update(profiles)
        .set({ credits: nextCredits })
        .where(eq(profiles.id, order.userId));
    }

    // 3. Credit wallet
    let [wallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, order.userId))
      .limit(1);

    if (!wallet) {
      [wallet] = await tx
        .insert(wallets)
        .values({ userId: order.userId, balance: nextCredits })
        .returning();
    } else {
      const nextWalletBalance = wallet.balance + order.credits;
      [wallet] = await tx
        .update(wallets)
        .set({ balance: nextWalletBalance, updatedAt: new Date() })
        .where(eq(wallets.id, wallet.id))
        .returning();
    }

    // 4. Ledger & Transactions
    await tx.insert(creditLedger).values({
      amount: order.credits,
      balanceAfter: wallet.balance,
      idempotencyKey: `admin_approve:${order.id}`,
      metadata: { adminId: admin.id, orderCode: order.orderCode },
      reason: "credit_purchase",
      referenceId: order.id,
      referenceType: "order",
      walletId: wallet.id,
    });

    await tx.insert(creditTransactions).values({
      userId: order.userId,
      delta: order.credits,
      reason: "purchase",
      refId: String(order.orderCode),
    });

    // 5. Audit log
    await tx.insert(adminAuditLogs).values({
      action: "order_manually_approved",
      adminUserId: admin.id,
      metadata: {
        orderCode: order.orderCode,
        credits: order.credits,
        amountVnd: order.amountVnd,
      },
      targetId: order.id,
      targetType: "order",
    });
  });

  revalidatePath("/admin/orders");
  revalidatePath("/admin/users");
  revalidatePath("/admin");
}

export async function cancelOrderAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx
      .update(orders)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(orders.id, id.data), eq(orders.status, "pending")));
    await tx.insert(adminAuditLogs).values({
      action: "order_cancelled",
      adminUserId: admin.id,
      targetId: id.data,
      targetType: "order",
    });
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function deleteOrderAction(formData: FormData) {
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;

  const admin = await requireAdmin();
  await getDb().transaction(async (tx) => {
    await tx.delete(orders).where(eq(orders.id, id.data));
    await tx.insert(adminAuditLogs).values({
      action: "order_deleted",
      adminUserId: admin.id,
      targetId: id.data,
      targetType: "order",
    });
  });
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}

export async function togglePackAction(formData: FormData) {
  const parsed = z
    .object({ id: z.string(), active: z.enum(["true", "false"]) })
    .safeParse({ id: formData.get("id"), active: formData.get("active") });
  if (!parsed.success) return;

  const admin = await requireAdmin();
  await getDb()
    .update(packs)
    .set({ isActive: parsed.data.active === "true" })
    .where(eq(packs.id, parsed.data.id));

  await getDb().insert(adminAuditLogs).values({
    action: "pack_toggled",
    adminUserId: admin.id,
    metadata: { active: parsed.data.active },
    targetId: parsed.data.id,
    targetType: "pack",
  });
  revalidatePath("/admin");
}

export async function updateSelectorConfigAction(formData: FormData) {
  const parsed = z
    .object({ content: z.string() })
    .safeParse({ content: formData.get("content") });
  if (!parsed.success) return;

  let parsedJson: any;
  try {
    parsedJson = JSON.parse(parsed.data.content);
  } catch {
    return;
  }

  const admin = await requireAdmin();
  const db = getDb();
  await db
    .insert(siteSelectors)
    .values({
      id: "default",
      version: parsedJson.version || 1,
      content: parsedJson,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: siteSelectors.id,
      set: {
        content: parsedJson,
        version: (parsedJson.version || 1) + 1,
      },
    });

  await db.insert(adminAuditLogs).values({
    action: "selectors_updated",
    adminUserId: admin.id,
    metadata: { version: parsedJson.version },
    targetId: "default",
    targetType: "site_selectors",
  });
  revalidatePath("/admin");
}
