export type CreditPlan = "free" | "starter" | "pro";
export type CreditAction =
  | "generation"
  | "review"
  | "improvement"
  | "refinement"
  | "proposalDraft";
export type CreditUsageSnapshot = Record<CreditAction, number>;

type CreditLimit = number | "unlimited";

export const creditUsageStorageKey = "root-access:credit-usage:v1";
export const creditPlanStorageKey = "root-access:credit-plan:v1";
export const defaultCreditPlan: CreditPlan = "free";
export const emptyCreditUsage: CreditUsageSnapshot = {
  generation: 0,
  review: 0,
  improvement: 0,
  refinement: 0,
  proposalDraft: 0,
};

export const creditPlans = {
  free: {
    limits: {
      generation: "unlimited",
      review: 5,
      improvement: 3,
      refinement: 3,
      proposalDraft: 2,
    },
    features: {
      unlimitedPromptReviews: false,
      advancedWorkflowTemplates: false,
    },
  },
  starter: {
    limits: {
      generation: "unlimited",
      review: 20,
      improvement: 20,
      refinement: 20,
      proposalDraft: 20,
    },
    features: {
      unlimitedPromptReviews: false,
      advancedWorkflowTemplates: false,
    },
  },
  pro: {
    limits: {
      generation: "unlimited",
      review: 50,
      improvement: 50,
      refinement: 50,
      proposalDraft: 50,
    },
    features: {
      unlimitedPromptReviews: false,
      advancedWorkflowTemplates: false,
    },
  },
} satisfies Record<
  CreditPlan,
  {
    limits: Record<CreditAction, CreditLimit>;
    features: {
      advancedWorkflowTemplates: boolean;
      unlimitedPromptReviews: boolean;
    };
  }
>;

export function getCreditLimit(plan: CreditPlan, action: CreditAction) {
  return creditPlans[plan].limits[action];
}

export function canUseCredit({
  action,
  plan,
  usage,
}: {
  action: CreditAction;
  plan: CreditPlan;
  usage: CreditUsageSnapshot;
}) {
  const limit = getCreditLimit(plan, action);

  if (
    (plan === "starter" || plan === "pro") &&
    (action === "review" || action === "improvement")
  ) {
    return limit === "unlimited" || usage.review + usage.improvement < limit;
  }

  return limit === "unlimited" || usage[action] < limit;
}

export function getRemainingCredits({
  action,
  plan,
  usage,
}: {
  action: CreditAction;
  plan: CreditPlan;
  usage: CreditUsageSnapshot;
}) {
  const limit = getCreditLimit(plan, action);

  if (limit === "unlimited") {
    return "unlimited";
  }

  if (
    (plan === "starter" || plan === "pro") &&
    (action === "review" || action === "improvement")
  ) {
    return Math.max(limit - usage.review - usage.improvement, 0);
  }

  return Math.max(limit - usage[action], 0);
}

export function recordCreditUse(
  usage: CreditUsageSnapshot,
  action: CreditAction,
): CreditUsageSnapshot {
  return {
    ...usage,
    [action]: usage[action] + 1,
  };
}

export function parseCreditUsage(value: string | null): CreditUsageSnapshot {
  if (!value) {
    return emptyCreditUsage;
  }

  try {
    const parsed: unknown = JSON.parse(value);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return emptyCreditUsage;
    }

    const usage = parsed as Partial<Record<CreditAction, unknown>>;

    return {
      generation:
        typeof usage.generation === "number" && usage.generation >= 0
          ? usage.generation
          : 0,
      review:
        typeof usage.review === "number" && usage.review >= 0
          ? usage.review
          : 0,
      improvement:
        typeof usage.improvement === "number" && usage.improvement >= 0
          ? usage.improvement
          : 0,
      refinement:
        typeof usage.refinement === "number" && usage.refinement >= 0
          ? usage.refinement
          : 0,
      proposalDraft:
        typeof usage.proposalDraft === "number" && usage.proposalDraft >= 0
          ? usage.proposalDraft
          : 0,
    };
  } catch {
    return emptyCreditUsage;
  }
}

export function parseCreditPlan(value: string | null): CreditPlan {
  if (value === "starter" || value === "pro") {
    return value;
  }

  return defaultCreditPlan;
}
