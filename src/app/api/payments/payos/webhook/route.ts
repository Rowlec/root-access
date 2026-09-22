import { eq, sql } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db";
import {
  creditLedger,
  orders,
  paymentEvents,
  usageEvents,
  wallets,
} from "@/db/schema";
import { getPayOS, isPayOSConfigured } from "@/lib/server/payos";

export async function POST(request: Request) {
  if (!isDatabaseConfigured() || !isPayOSConfigured()) {
    return Response.json({ message: "Billing is not configured." }, { status: 503 });
  }

  const payload = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!payload) {
    return Response.json({ message: "Invalid payload." }, { status: 400 });
  }

  let webhookData: Awaited<ReturnType<ReturnType<typeof getPayOS>["webhooks"]["verify"]>>;

  try {
    webhookData = await getPayOS().webhooks.verify(payload as never);
  } catch {
    return Response.json({ message: "Invalid webhook signature." }, { status: 400 });
  }

  const providerEventId = `${webhookData.paymentLinkId}:${webhookData.reference}`;
  const db = getDb();

  const result = await db.transaction(async (tx) => {
    const [event] = await tx
      .insert(paymentEvents)
      .values({
        orderCode: webhookData.orderCode,
        payload,
        providerEventId,
        signatureVerified: true,
      })
      .onConflictDoNothing()
      .returning();

    if (!event) {
      return "duplicate" as const;
    }

    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.orderCode, webhookData.orderCode))
      .limit(1);

    if (!order || order.status === "paid") {
      await tx
        .update(paymentEvents)
        .set({ processedAt: new Date() })
        .where(eq(paymentEvents.id, event.id));
      return "ignored" as const;
    }

    if (webhookData.code !== "00" || webhookData.amount !== order.amountVnd) {
      return "amount_mismatch" as const;
    }

    const [wallet] = await tx
      .update(wallets)
      .set({
        balance: sql`${wallets.balance} + ${order.credits}`,
        updatedAt: new Date(),
      })
      .where(eq(wallets.userId, order.userId))
      .returning();

    if (!wallet) {
      throw new Error("Wallet missing for paid order.");
    }

    await tx.insert(creditLedger).values({
      amount: order.credits,
      balanceAfter: wallet.balance,
      idempotencyKey: `payment:${order.id}`,
      metadata: { orderCode: order.orderCode, provider: "payos" },
      reason: "credit_purchase",
      referenceId: order.id,
      referenceType: "order",
      walletId: wallet.id,
    });

    await tx
      .update(orders)
      .set({ paidAt: new Date(), status: "paid", updatedAt: new Date() })
      .where(eq(orders.id, order.id));
    await tx
      .update(paymentEvents)
      .set({ processedAt: new Date() })
      .where(eq(paymentEvents.id, event.id));
    await tx.insert(usageEvents).values({
      eventName: "payment_succeeded",
      properties: { credits: order.credits, orderId: order.id, revenueVnd: order.amountVnd },
      userId: order.userId,
    });

    return "credited" as const;
  });

  if (result === "amount_mismatch") {
    return Response.json({ message: "Payment amount mismatch." }, { status: 400 });
  }

  return Response.json({ ok: true, result });
}
