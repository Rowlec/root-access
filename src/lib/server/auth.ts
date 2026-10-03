import "server-only";

import { and, eq, gt, sql } from "drizzle-orm";
import { headers } from "next/headers";

import { getDb, isDatabaseConfigured } from "@/db";
import {
  authSession,
  authUser,
  creditLedger,
  creditTransactions,
  profiles,
  users,
  wallets,
} from "@/db/schema";
import { auth } from "@/lib/auth";

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

export function isAuthConfigured() {
  return Boolean(
    process.env.DATABASE_URL &&
      (process.env.BETTER_AUTH_SECRET || process.env.CLERK_SECRET_KEY),
  );
}

function configuredAdminEmails() {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );
}

export async function requireAuthSession(customHeaders?: Headers) {
  if (!isAuthConfigured()) {
    throw new UnauthorizedError("Authentication is not configured.");
  }

  const reqHeaders = customHeaders ?? (await headers());
  let session = await auth.api.getSession({ headers: reqHeaders });

  if (!session?.user?.id) {
    const authHeader = reqHeaders.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const db = getDb();
      const [dbSession] = await db
        .select()
        .from(authSession)
        .where(
          and(
            eq(authSession.token, token),
            gt(authSession.expiresAt, new Date()),
          ),
        )
        .limit(1);

      if (dbSession) {
        const [dbUser] = await db
          .select()
          .from(authUser)
          .where(eq(authUser.id, dbSession.userId))
          .limit(1);

        if (dbUser) {
          session = {
            session: dbSession,
            user: dbUser,
          } as any;
        }
      }
    }
  }

  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  return session;
}

export async function ensureCurrentUser(customHeaders?: Headers) {
  const session = await requireAuthSession(customHeaders);

  if (!isDatabaseConfigured()) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const authUserId = session.user.id;
  const email = session.user.email.trim().toLowerCase();
  const displayName = session.user.name?.trim() || null;
  const forcedAdmin = configuredAdminEmails().has(email);
  const db = getDb();

  return db.transaction(async (tx) => {
    let [existingUser] = await tx
      .select()
      .from(users)
      .where(eq(users.authUserId, authUserId))
      .limit(1);

    if (!existingUser) {
      [existingUser] = await tx
        .select()
        .from(users)
        .where(sql`lower(${users.email}) = ${email}`)
        .limit(1);
    }

    if (!existingUser) {
      [existingUser] = await tx
        .insert(users)
        .values({
          authUserId,
          displayName,
          email,
          role: forcedAdmin ? "admin" : "user",
        })
        .returning();
    } else if (
      existingUser.authUserId !== authUserId ||
      existingUser.email !== email ||
      existingUser.displayName !== displayName
    ) {
      [existingUser] = await tx
        .update(users)
        .set({
          authUserId,
          displayName,
          email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
    }

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

    const [insertedWallet] = await tx
      .insert(wallets)
      .values({ userId: appUser.id, balance: 5 })
      .onConflictDoNothing({ target: wallets.userId })
      .returning();

    if (insertedWallet) {
      await tx
        .insert(creditLedger)
        .values({
          amount: 5,
          balanceAfter: 5,
          idempotencyKey: `signup:${appUser.id}`,
          reason: "signup_bonus",
          referenceId: appUser.id,
          referenceType: "user",
          walletId: insertedWallet.id,
        })
        .onConflictDoNothing({ target: creditLedger.idempotencyKey });
    }

    const [wallet] = insertedWallet
      ? [insertedWallet]
      : await tx
          .select()
          .from(wallets)
          .where(eq(wallets.userId, appUser.id))
          .limit(1);

    let [profile] = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.id, appUser.id))
      .limit(1);

    if (!profile) {
      [profile] = await tx
        .insert(profiles)
        .values({
          id: appUser.id,
          displayName: appUser.displayName,
          credits: 5,
        })
        .returning();

      await tx.insert(creditTransactions).values({
        userId: appUser.id,
        delta: 5,
        reason: "signup_bonus",
        refId: appUser.id,
      });
    }

    // Always keep wallet.balance synchronized with profile.credits (Single source of truth)
    if (wallet && profile && wallet.balance !== profile.credits) {
      await tx
        .update(wallets)
        .set({ balance: profile.credits, updatedAt: new Date() })
        .where(eq(wallets.id, wallet.id));
      wallet.balance = profile.credits;
    }

    return { ...appUser, session, wallet, profile };
  });
}

export async function requireAdmin(customHeaders?: Headers) {
  const user = await ensureCurrentUser(customHeaders);

  if (user.role !== "admin") {
    throw new ForbiddenError("Administrator role required.");
  }

  return user;
}
