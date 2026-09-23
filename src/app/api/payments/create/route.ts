import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db";
import { orders, tokenPackages, usageEvents } from "@/db/schema";
import { ensureCurrentUser, UnauthorizedError } from "@/lib/server/auth";
import { ensureDefaultPackages } from "@/lib/server/billing";
import { getPayOS, isPayOSConfigured } from "@/lib/server/payos";

const requestSchema = z.object({
  packageId: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/),
});

export async function POST(request: Request) {
  if (!isDatabaseConfigured() || !isPayOSConfigured()) {
    return Response.json(
      { code: "billing_not_configured", message: "Billing is not configured." },
      { status: 503 },
    );
  }

  let user: Awaited<ReturnType<typeof ensureCurrentUser>>;

  try {
    user = await ensureCurrentUser();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ code: "unauthorized", message: error.message }, { status: 401 });
    }
    throw error;
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return Response.json({ code: "invalid_package", message: "Invalid package." }, { status: 400 });
  }

  await ensureDefaultPackages();
  const [selectedPackage] = await getDb()
    .select()
    .from(tokenPackages)
    .where(
      and(
        eq(tokenPackages.id, parsed.data.packageId),
        eq(tokenPackages.isActive, true),
      ),
    )
    .limit(1);

  if (!selectedPackage) {
    return Response.json(
      { code: "package_not_found", message: "Credit package is unavailable." },
      { status: 404 },
    );
  }
  const orderCode = Date.now();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;
  const db = getDb();

  const [order] = await db
    .insert(orders)
    .values({
      amountVnd: selectedPackage.priceVnd,
      credits: selectedPackage.credits,
      orderCode,
      packageId: selectedPackage.id,
      userId: user.id,
    })
    .returning();

  try {
    const paymentLink = await getPayOS().paymentRequests.create({
      amount: selectedPackage.priceVnd,
      cancelUrl: `${siteUrl}/app/billing?payment=cancelled`,
      description: `RA${String(orderCode).slice(-7)}`,
      items: [
        {
          name: `${selectedPackage.name} credits`,
          price: selectedPackage.priceVnd,
          quantity: 1,
        },
      ],
      orderCode,
      returnUrl: `${siteUrl}/app/billing?payment=returned`,
    });

    await db
      .update(orders)
      .set({
        checkoutUrl: paymentLink.checkoutUrl,
        providerPaymentLinkId: paymentLink.paymentLinkId,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, order.id));

    await db.insert(usageEvents).values({
      eventName: "checkout_started",
      properties: { packageId: selectedPackage.id, priceVnd: selectedPackage.priceVnd },
      userId: user.id,
    });

    return Response.json({ checkoutUrl: paymentLink.checkoutUrl, orderId: order.id });
  } catch {
    await db
      .update(orders)
      .set({ status: "failed", updatedAt: new Date() })
      .where(eq(orders.id, order.id));

    return Response.json(
      { code: "payment_provider_error", message: "Could not create payment link." },
      { status: 502 },
    );
  }
}
