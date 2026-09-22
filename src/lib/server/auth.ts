import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db";
import { creditLedger, users, wallets } from "@/db/schema";

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You are not allowed to perform this action.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export function isClerkConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY,
  );
}

function configuredAdminIds() {
  return new Set(
    (process.env.ADMIN_USER_IDS ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

export async function requireClerkUserId() {
  if (!isClerkConfigured()) {
    throw new UnauthorizedError("Clerk is not configured.");
  }

  const session = await auth();

  if (!session.userId) {
    throw new UnauthorizedError();
  }

  return session.userId;
}

export async function ensureCurrentUser() {
  const clerkUserId = await requireClerkUserId();

  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const profile = await currentUser();
  const email = profile?.primaryEmailAddress?.emailAddress ?? null;
  const displayName = profile
    ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") || null
    : null;
  const forcedAdmin = configuredAdminIds().has(clerkUserId);
  const db = getDb();

  return db.transaction(async (tx) => {
    await tx
      .insert(users)
      .values({
        clerkUserId,
        displayName,
        email,
        role: forcedAdmin ? "admin" : "user",
      })
      .onConflictDoNothing({ target: users.clerkUserId });

    const [existingUser] = await tx
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!existingUser || existingUser.isDisabled) {
      throw new ForbiddenError("This account is disabled.");
    }

    const appUser =
      forcedAdmin && existingUser.role !== "admin"
        ? (
            await tx
              .update(users)
              .set({ role: "admin", updatedAt: new Date() })
              .where(eq(users.id, existingUser.id))
              .returning()
          )[0]
        : existingUser;

    await tx
      .insert(wallets)
      .values({ userId: appUser.id })
      .onConflictDoNothing({ target: wallets.userId });

    const [wallet] = await tx
      .select()
      .from(wallets)
      .where(eq(wallets.userId, appUser.id))
      .limit(1);

    await tx
      .insert(creditLedger)
      .values({
        amount: 20,
        balanceAfter: wallet.balance,
        idempotencyKey: `signup:${appUser.id}`,
        reason: "signup_bonus",
        referenceId: appUser.id,
        referenceType: "user",
        walletId: wallet.id,
      })
      .onConflictDoNothing({ target: creditLedger.idempotencyKey });

    return { ...appUser, wallet };
  });
}

export async function requireAdmin() {
  const user = await ensureCurrentUser();

  if (user.role !== "admin") {
    throw new ForbiddenError("Administrator role required.");
  }

  return user;
}
