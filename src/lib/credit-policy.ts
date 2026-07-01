export type CreditPlan = "free" | "pro";
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
      generation: 5,
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
  pro: {
    limits: {
      generation: "unlimited",
      review: "unlimited",
      improvement: "unlimited",
      refinement: "unlimited",
      proposalDraft: "unlimited",
    },
    features: {
      unlimitedPromptReviews: true,
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
  return value === "pro" ? "pro" : defaultCreditPlan;
}
