export const proposalSectionIds = [
  "problem",
  "customer",
  "revenue",
  "mvp",
  "differentiation",
] as const;

export type ProposalSectionId = (typeof proposalSectionIds)[number];
export type ScoreDimension =
  | "relevance"
  | "specificity"
  | "clarity"
  | "completeness"
  | "rubricAlignment"
  | "actionability";

export type ScoreDimensionResult = {
  reason: string;
  score: number;
};

export type ScoreBreakdown = Record<ScoreDimension, ScoreDimensionResult>;

export type DeterministicProposalScore = {
  breakdown: ScoreBreakdown;
  explanation: string;
  frameworkChecks: readonly string[];
  frameworkTitle: string;
  total: number;
};

type ProposalReviewFramework = {
  actionKeywords: readonly string[];
  checks: readonly string[];
  id: ProposalSectionId;
  relevanceKeywords: readonly string[];
  title: string;
};

type ScoreInput = {
  context: {
    industry: string;
    startupIdea: string;
    targetCustomer?: string;
  };
  output: string;
  sectionId: ProposalSectionId;
};

type ScoreSignals = {
  actionKeywordMatches: number;
  avgSentenceWords: number;
  contextMatches: number;
  frameworkKeywordMatches: number;
  hasEvidenceLanguage: boolean;
  hasListStructure: boolean;
  hasNumbers: boolean;
  hasSectionLabels: boolean;
  hasTestLanguage: boolean;
  hasTimeLanguage: boolean;
  hasVagueClaim: boolean;
  sentenceCount: number;
  wordCount: number;
};

export const proposalReviewFrameworks: Record<
  ProposalSectionId,
  ProposalReviewFramework
> = {
  problem: {
    id: "problem",
    title: "Problem Review",
    checks: ["specificity", "urgency", "frequency", "validation ability"],
    relevanceKeywords: [
      "problem",
      "pain",
      "struggle",
      "urgent",
      "frequency",
      "workaround",
      "evidence",
      "validate",
      "interview",
      "survey",
      "vấn đề",
      "nỗi đau",
      "cấp bách",
      "tần suất",
      "khảo sát",
      "phỏng vấn",
      "kiểm chứng",
    ],
    actionKeywords: [
      "validate",
      "interview",
      "survey",
      "measure",
      "observe",
      "frequency",
      "evidence",
      "test",
      "khảo sát",
      "phỏng vấn",
      "đo lường",
      "kiểm chứng",
    ],
  },
  customer: {
    id: "customer",
    title: "Customer Review",
    checks: ["narrowness", "pain intensity", "reachability"],
    relevanceKeywords: [
      "customer",
      "segment",
      "persona",
      "user",
      "buyer",
      "reach",
      "channel",
      "pain",
      "behavior",
      "khách hàng",
      "phân khúc",
      "người dùng",
      "hành vi",
      "kênh tiếp cận",
    ],
    actionKeywords: [
      "segment",
      "reach",
      "interview",
      "channel",
      "recruit",
      "survey",
      "identify",
      "prioritize",
      "phân khúc",
      "tiếp cận",
      "phỏng vấn",
      "khảo sát",
    ],
  },
  revenue: {
    id: "revenue",
    title: "Revenue Review",
    checks: ["realism", "willingness to pay", "scalability"],
    relevanceKeywords: [
      "revenue",
      "pricing",
      "price",
      "payer",
      "subscription",
      "transaction",
      "willingness",
      "pay",
      "margin",
      "scale",
      "doanh thu",
      "định giá",
      "sẵn sàng chi trả",
      "lợi nhuận",
      "mở rộng",
    ],
    actionKeywords: [
      "test",
      "pricing",
      "pilot",
      "measure",
      "willingness",
      "pay",
      "conversion",
      "margin",
      "thử nghiệm",
      "định giá",
      "đo lường",
      "chi trả",
    ],
  },
  mvp: {
    id: "mvp",
    title: "MVP Review",
    checks: ["scope clarity", "feasibility", "testability"],
    relevanceKeywords: [
      "mvp",
      "feature",
      "scope",
      "prototype",
      "feasible",
      "build",
      "test",
      "exclude",
      "must-have",
      "tính năng",
      "phạm vi",
      "khả thi",
      "nguyên mẫu",
      "loại trừ",
    ],
    actionKeywords: [
      "build",
      "prototype",
      "test",
      "ship",
      "exclude",
      "measure",
      "feasible",
      "must-have",
      "xây dựng",
      "nguyên mẫu",
      "thử nghiệm",
      "loại trừ",
    ],
  },
  differentiation: {
    id: "differentiation",
    title: "Differentiation Review",
    checks: ["uniqueness", "defensibility", "user value clarity"],
    relevanceKeywords: [
      "different",
      "differentiation",
      "competitor",
      "alternative",
      "unique",
      "defensible",
      "advantage",
      "value",
      "switch",
      "đối thủ",
      "khác biệt",
      "lợi thế",
      "giá trị",
      "thay thế",
    ],
    actionKeywords: [
      "compare",
      "prove",
      "test",
      "switch",
      "measure",
      "validate",
      "advantage",
      "alternative",
      "so sánh",
      "chứng minh",
      "đo lường",
      "kiểm chứng",
    ],
  },
};

const vagueClaimPatterns = [
  "everyone",
  "all users",
  "very useful",
  "best",
  "quickly",
  "easily",
  "solve everything",
  "revolutionary",
  "mọi người",
  "tất cả người dùng",
  "rất hữu ích",
  "tốt nhất",
  "dễ dàng",
  "giải quyết mọi thứ",
];

const evidencePatterns = [
  "because",
  "evidence",
  "data",
  "interview",
  "survey",
  "observed",
  "measured",
  "assumption",
  "verify",
  "bằng chứng",
  "dữ liệu",
  "phỏng vấn",
  "khảo sát",
  "giả định",
  "kiểm chứng",
];

const testPatterns = [
  "test",
  "validate",
  "measure",
  "pilot",
  "interview",
  "survey",
  "prototype",
  "experiment",
  "thử nghiệm",
  "kiểm chứng",
  "đo lường",
  "phỏng vấn",
  "khảo sát",
];

const timePatterns = [
  "daily",
  "weekly",
  "monthly",
  "per day",
  "per week",
  "deadline",
  "urgent",
  "now",
  "frequency",
  "hằng ngày",
  "hàng tuần",
  "hàng tháng",
  "cấp bách",
  "tần suất",
];

function normalizeText(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function getWords(value: string) {
  return normalizeText(value).match(/[\p{L}\p{N}]+/gu) ?? [];
}

function countMatches(text: string, keywords: readonly string[]) {
  const normalizedText = normalizeText(text);

  return keywords.reduce(
    (count, keyword) =>
      normalizedText.includes(keyword.toLowerCase()) ? count + 1 : count,
    0,
  );
}

function getContextKeywords(context: ScoreInput["context"]) {
  return [
    ...getWords(context.startupIdea),
    ...getWords(context.industry),
    ...getWords(context.targetCustomer ?? ""),
  ].filter((word) => word.length >= 4);
}

function clampScore(score: number) {
  return Math.max(0, Math.min(10, Math.round(score)));
}

function getSignals({
  context,
  output,
  sectionId,
}: ScoreInput): ScoreSignals {
  const framework = proposalReviewFrameworks[sectionId];
  const sentences = output
    .split(/[.!?\n]+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const wordCount = getWords(output).length;
  const sentenceCount = Math.max(sentences.length, 1);
  const avgSentenceWords = wordCount / sentenceCount;
  const contextKeywords = Array.from(new Set(getContextKeywords(context)));

  return {
    actionKeywordMatches: countMatches(output, framework.actionKeywords),
    avgSentenceWords,
    contextMatches: Math.min(countMatches(output, contextKeywords), 4),
    frameworkKeywordMatches: countMatches(output, framework.relevanceKeywords),
    hasEvidenceLanguage: countMatches(output, evidencePatterns) > 0,
    hasListStructure: /(^|\n)\s*([-*]|\d+[.)])\s+/.test(output),
    hasNumbers: /\d/.test(output),
    hasSectionLabels: /[:|]/.test(output) || /(^|\n)#{1,4}\s+/.test(output),
    hasTestLanguage: countMatches(output, testPatterns) > 0,
    hasTimeLanguage: countMatches(output, timePatterns) > 0,
    hasVagueClaim: countMatches(output, vagueClaimPatterns) > 0,
    sentenceCount,
    wordCount,
  };
}

function scoreRelevance(signals: ScoreSignals) {
  const score = clampScore(
    2 +
      Math.min(signals.frameworkKeywordMatches, 4) +
      Math.min(signals.contextMatches, 2) +
      (signals.wordCount >= 40 ? 1 : 0) +
      (signals.hasEvidenceLanguage ? 1 : 0),
  );
  const reason =
    score >= 8
      ? "Output fits the current proposal section and uses relevant startup context."
      : score >= 5
        ? "Output is partly aligned, but some section-specific business logic is still thin."
        : "Output is too generic for the current proposal section.";

  return { reason, score };
}

function scoreSpecificity(signals: ScoreSignals) {
  const score = clampScore(
    1 +
      (signals.hasNumbers ? 2 : 0) +
      Math.min(signals.contextMatches, 3) +
      (signals.hasTimeLanguage ? 1 : 0) +
      (signals.wordCount >= 70 ? 2 : signals.wordCount >= 35 ? 1 : 0) +
      (signals.hasVagueClaim ? -2 : 1),
  );
  const reason =
    score >= 8
      ? "Output uses concrete context, constraints, and measurable details."
      : score >= 5
        ? "Output has some concrete details, but key assumptions remain broad."
        : "Output lacks precise customer, market, timing, or evidence details.";

  return { reason, score };
}

function scoreClarity(signals: ScoreSignals) {
  const score = clampScore(
    2 +
      (signals.hasListStructure ? 2 : 0) +
      (signals.hasSectionLabels ? 2 : 0) +
      (signals.wordCount >= 45 && signals.wordCount <= 650 ? 2 : 0) +
      (signals.avgSentenceWords <= 26 ? 2 : signals.avgSentenceWords <= 34 ? 1 : 0),
  );
  const reason =
    score >= 8
      ? "Output is structured and easy to scan."
      : score >= 5
        ? "Output is understandable, but structure could be sharper."
        : "Output is hard to use because the structure is weak or too vague.";

  return { reason, score };
}

function scoreActionability(signals: ScoreSignals) {
  const score = clampScore(
    1 +
      Math.min(signals.actionKeywordMatches, 4) +
      (signals.hasTestLanguage ? 2 : 0) +
      (signals.hasEvidenceLanguage ? 1 : 0) +
      (signals.hasListStructure ? 1 : 0) +
      (signals.wordCount >= 60 ? 1 : 0),
  );
  const reason =
    score >= 8
      ? "Output gives usable next steps or validation logic for the proposal."
      : score >= 5
        ? "Output is somewhat useful, but next steps are not concrete enough."
        : "Output does not give enough testable or decision-ready business logic.";

  return { reason, score };
}

function scoreCompleteness(signals: ScoreSignals) {
  const score = clampScore(
    1 +
      (signals.wordCount >= 120 ? 3 : signals.wordCount >= 70 ? 2 : 0) +
      (signals.hasSectionLabels ? 2 : 0) +
      (signals.hasEvidenceLanguage ? 1 : 0) +
      (signals.hasNumbers ? 1 : 0) +
      (signals.hasTestLanguage ? 1 : 0) +
      (signals.frameworkKeywordMatches >= 3 ? 1 : 0),
  );
  const reason =
    score >= 8
      ? "Output covers the section with context, evidence needs, and usable detail."
      : score >= 5
        ? "Output covers the core idea, but important evidence or decision details are missing."
        : "Output is too incomplete to use as a full proposal section.";

  return { reason, score };
}

function scoreRubricAlignment(signals: ScoreSignals) {
  const score = clampScore(
    1 +
      Math.min(signals.frameworkKeywordMatches, 5) +
      Math.min(signals.actionKeywordMatches, 2) +
      (signals.hasEvidenceLanguage ? 1 : 0) +
      (signals.hasTestLanguage ? 1 : 0),
  );
  const reason =
    score >= 8
      ? "Output addresses the business checks required for this proposal section."
      : score >= 5
        ? "Output addresses part of the section rubric but leaves some checks unsupported."
        : "Output does not yet address enough of the section-specific rubric.";

  return { reason, score };
}

export function scoreStartupProposalOutput(input: ScoreInput) {
  const framework = proposalReviewFrameworks[input.sectionId];
  const signals = getSignals(input);
  const breakdown: ScoreBreakdown = {
    relevance: scoreRelevance(signals),
    specificity: scoreSpecificity(signals),
    clarity: scoreClarity(signals),
    completeness: scoreCompleteness(signals),
    rubricAlignment: scoreRubricAlignment(signals),
    actionability: scoreActionability(signals),
  };
  const total = Object.values(breakdown).reduce(
    (sum, dimension) => sum + dimension.score,
    0,
  );

  return {
    breakdown,
    explanation:
      total >= 48
        ? "Strong output. It is section-specific, clear, and usable for proposal work."
        : total >= 36
          ? "Promising output. It needs sharper business logic before it is proposal-ready."
          : "Weak output. It needs more specific startup logic before the user retries.",
    frameworkChecks: framework.checks,
    frameworkTitle: framework.title,
    total,
  } satisfies DeterministicProposalScore;
}

export function isProposalSectionId(value: string): value is ProposalSectionId {
  return proposalSectionIds.includes(value as ProposalSectionId);
}
