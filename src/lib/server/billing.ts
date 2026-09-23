import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/db";
import { tokenPackages } from "@/db/schema";
import { creditPackages } from "@/lib/billing/packages";

export async function ensureDefaultPackages() {
  const db = getDb();

  for (const item of Object.values(creditPackages)) {
    await db
      .insert(tokenPackages)
      .values({
        credits: item.credits,
        id: item.id,
        name: item.name,
        priceVnd: item.priceVnd,
      })
      .onConflictDoNothing({ target: tokenPackages.id });
  }
}

export async function getAvailablePackages() {
  await ensureDefaultPackages();
  return getDb()
    .select()
    .from(tokenPackages)
    .where(eq(tokenPackages.isActive, true));
}
