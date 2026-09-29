import "server-only";

import { eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { creditTransactions, profiles } from "@/db/schema";

export async function ensureProfile(userId: string, displayName?: string | null) {
  const db = getDb();
  return await db.transaction(async (tx) => {
    let [profile] = await tx
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    if (!profile) {
      [profile] = await tx
        .insert(profiles)
        .values({
          id: userId,
          displayName: displayName ?? null,
          credits: 5,
        })
        .returning();

      await tx.insert(creditTransactions).values({
        userId,
        delta: 5,
        reason: "signup_bonus",
        refId: userId,
      });
    }

    return profile;
  });
}

export async function getProfileCredits(userId: string): Promise<number> {
  const db = getDb();
  const [profile] = await db
    .select({ credits: profiles.credits })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (!profile) {
    const created = await ensureProfile(userId);
    return created.credits;
  }

  return profile.credits;
}

export async function consumeCredit(
  userId: string,
  refId?: string,
): Promise<{ success: boolean; creditsLeft: number }> {
  const db = getDb();

  // Try calling the atomic stored function first
  try {
    const res = await db.execute(
      sql`SELECT consume_credit(${userId}::uuid, ${refId ? sql`${refId}::uuid` : null}) as ok;`,
    );
    const ok = Boolean(res[0]?.ok);
    if (ok) {
      const creditsLeft = await getProfileCredits(userId);
      return { success: true, creditsLeft };
    } else {
      const creditsLeft = await getProfileCredits(userId);
      return { success: false, creditsLeft };
    }
  } catch {
    // Fallback to Drizzle transaction if stored function invocation fails
    return await db.transaction(async (tx) => {
      const [userProfile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .for("update");

      if (!userProfile || userProfile.credits <= 0) {
        return { success: false, creditsLeft: userProfile?.credits ?? 0 };
      }

      const newBalance = userProfile.credits - 1;
      await tx
        .update(profiles)
        .set({ credits: newBalance })
        .where(eq(profiles.id, userId));

      await tx.insert(creditTransactions).values({
        userId,
        delta: -1,
        reason: "grade",
        refId: refId ?? null,
      });

      return { success: true, creditsLeft: newBalance };
    });
  }
}

export async function refundCredit(
  userId: string,
  refId?: string,
): Promise<{ success: boolean; creditsLeft: number }> {
  const db = getDb();

  try {
    await db.execute(
      sql`SELECT refund_credit(${userId}::uuid, ${refId ? sql`${refId}::uuid` : null}) as ok;`,
    );
    const creditsLeft = await getProfileCredits(userId);
    return { success: true, creditsLeft };
  } catch {
    return await db.transaction(async (tx) => {
      const [userProfile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .for("update");

      const newBalance = (userProfile?.credits ?? 0) + 1;
      await tx
        .update(profiles)
        .set({ credits: newBalance })
        .where(eq(profiles.id, userId));

      await tx.insert(creditTransactions).values({
        userId,
        delta: 1,
        reason: "refund",
        refId: refId ?? null,
      });

      return { success: true, creditsLeft: newBalance };
    });
  }
}

export async function addCredit(
  userId: string,
  delta: number,
  reason: "signup_bonus" | "grade" | "refund" | "purchase" | "admin" = "admin",
  refId?: string,
): Promise<{ success: boolean; creditsLeft: number }> {
  const db = getDb();

  try {
    const res = await db.execute(
      sql`SELECT add_credit(${userId}::uuid, ${delta}, ${reason}, ${refId ? sql`${refId}::uuid` : null}) as new_balance;`,
    );
    const newBalance = Number(res[0]?.new_balance ?? 0);
    return { success: true, creditsLeft: newBalance };
  } catch {
    return await db.transaction(async (tx) => {
      const [userProfile] = await tx
        .select()
        .from(profiles)
        .where(eq(profiles.id, userId))
        .for("update");

      const newBalance = (userProfile?.credits ?? 0) + delta;
      await tx
        .update(profiles)
        .set({ credits: newBalance })
        .where(eq(profiles.id, userId));

      await tx.insert(creditTransactions).values({
        userId,
        delta,
        reason,
        refId: refId ?? null,
      });

      return { success: true, creditsLeft: newBalance };
    });
  }
}
