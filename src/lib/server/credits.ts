import "server-only";

import { and, eq, gte, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { creditLedger, wallets } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/server/auth";

export const creditCosts = {
  generation: 2,
  improvement: 2,
  proposalDraft: 5,
  review: 1,
} as const;

export type MeteredAction = keyof typeof creditCosts;

export class InsufficientCreditsError extends Error {
  constructor() {
    super("Not enough credits for this action.");
    this.name = "InsufficientCreditsError";
  }
}

export async function debitCredits(action: MeteredAction) {
  const user = await ensureCurrentUser();
  const cost = creditCosts[action];
  const idempotencyKey = `ai:${crypto.randomUUID()}`;
  const db = getDb();

  return db.transaction(async (tx) => {
    const [updatedWallet] = await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} - ${cost}`,
        updatedAt: new Date(),
      })
      .where(and(eq(wallets.userId, user.id), gte(wallets.balance, cost)))
      .returning();

    if (!updatedWallet) {
      throw new InsufficientCreditsError();
    }

    const [entry] = await tx
      .insert(creditLedger)
      .values({
        amount: -cost,
        balanceAfter: updatedWallet.balance,
        idempotencyKey,
        metadata: { action },
        reason: "ai_usage",
        referenceType: "ai_request",
        walletId: updatedWallet.id,
      })
      .returning();

    return { action, cost, entryId: entry.id, user, wallet: updatedWallet };
  });
}

export async function refundCredits({
  action,
  cost,
  debitEntryId,
  userId,
}: {
  action: MeteredAction;
  cost: number;
  debitEntryId: string;
  userId: string;
}) {
  const db = getDb();

  await db.transaction(async (tx) => {
    const idempotencyKey = `refund:${debitEntryId}`;
    const [existing] = await tx
      .select({ id: creditLedger.id })
      .from(creditLedger)
      .where(eq(creditLedger.idempotencyKey, idempotencyKey))
      .limit(1);

    if (existing) {
      return;
    }

    const [updatedWallet] = await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${cost}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, userId))
      .returning();

    if (!updatedWallet) {
      throw new Error("Wallet not found while refunding credits.");
    }

    await tx.insert(creditLedger).values({
      amount: cost,
      balanceAfter: updatedWallet.balance,
      idempotencyKey,
      metadata: { action, debitEntryId },
      reason: "ai_refund",
      referenceId: debitEntryId,
      referenceType: "credit_ledger",
      walletId: updatedWallet.id,
    });
  });
}
