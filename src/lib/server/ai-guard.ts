import "server-only";

import { getDb, isDatabaseConfigured } from "@/db";
import { usageEvents } from "@/db/schema";
import {
  debitCredits,
  InsufficientCreditsError,
  refundCredits,
  type MeteredAction,
} from "@/lib/server/credits";
import {
  isClerkConfigured,
  UnauthorizedError,
} from "@/lib/server/auth";

export async function withAiCreditGuard(
  action: MeteredAction,
  handler: () => Promise<Response>,
) {
  if (!isDatabaseConfigured()) {
    return handler();
  }

  if (!isClerkConfigured()) {
    return Response.json(
      { code: "auth_not_configured", message: "Authentication is not configured." },
      { status: 503 },
    );
  }

  let debit: Awaited<ReturnType<typeof debitCredits>>;

  try {
    debit = await debitCredits(action);
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return Response.json(
        { code: "insufficient_credits", message: error.message },
        { status: 402 },
      );
    }

    if (error instanceof UnauthorizedError) {
      return Response.json(
        { code: "unauthorized", message: error.message },
        { status: 401 },
      );
    }

    throw error;
  }

  try {
    const response = await handler();
    const succeeded = response.ok;

    if (!succeeded) {
      await refundCredits({
        action,
        cost: debit.cost,
        debitEntryId: debit.entryId,
        userId: debit.user.id,
      });
    }

    await getDb().insert(usageEvents).values({
      eventName: succeeded ? "ai_request_succeeded" : "ai_request_failed",
      properties: {
        action,
        cost: debit.cost,
        status: response.status,
      },
      userId: debit.user.id,
    });

    return response;
  } catch (error) {
    await refundCredits({
      action,
      cost: debit.cost,
      debitEntryId: debit.entryId,
      userId: debit.user.id,
    });

    await getDb().insert(usageEvents).values({
      eventName: "ai_request_failed",
      properties: { action, cost: debit.cost, exception: true },
      userId: debit.user.id,
    });

    throw error;
  }
}
