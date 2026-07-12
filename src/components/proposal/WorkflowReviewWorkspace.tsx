"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Check,
  Copy,
  Download,
  FileText,
  Lock,
  History,
  Loader2,
  RotateCcw,
  Send,
  RefreshCw,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { ContextualHelper } from "@/components/onboarding/ContextualHelper";
import { ProposalBuilder } from "@/components/proposal/ProposalBuilder";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCreditUsage } from "@/hooks/useCreditUsage";
import {
  intelligenceStorageKey,
  parseIntelligenceEvents,
  type IntelligenceEvent,
  type IntelligenceEventType,
} from "@/lib/product-intelligence";
import {
  buildProposalExport,
  createDocxBlob,
  createTextBlob,
  type ProposalExportDocument,
  type ProposalExportSection,
} from "@/lib/proposal-export";
import {
  creditPlanStorageKey,
  parseCreditPlan,
  type CreditPlan,
} from "@/lib/credit-policy";
import {
  proposalReviewFrameworks,
  proposalSectionIds,
  type ProposalSectionId,
} from "@/lib/proposal-review";
import { cn } from "@/lib/utils";

type WorkflowSection = {
  id: ProposalSectionId;
  objective: string;
  promptFocus: string;
  title: string;
};

type ScoreDimensionResult = {
  reason: string;
  score: number;
};

type ReviewCoach = {
  currentOutputSummary: string;
  previousOutputSummary?: string;
  recommendations: string[];
  remainingWeaknesses: string[];
  strengthsImproved: string[];
};

type OutputReview = {
  coach?: ReviewCoach;
  frameworkChecks: readonly string[];
  frameworkTitle: string;
  missingInformation: string[];
  problematicPassages: ProblematicPassage[];
  improvedPrompt?: string;
  score: {
    breakdown: {
      actionability: ScoreDimensionResult;
      clarity: ScoreDimensionResult;
      completeness: ScoreDimensionResult;
      relevance: ScoreDimensionResult;
      rubricAlignment: ScoreDimensionResult;
      specificity: ScoreDimensionResult;
    };
    explanation: string;
    total: number;
  };
  strengths: string[];
  suggestions: string[];
  weaknesses: string[];
  whyBetter?: string;
};

type ProblematicPassage = {
  quote: string;
  reason: string;
  severity: "high" | "medium" | "low";
};

type ReviewHistoryEntry = {
  createdAt: string;
  id: string;
  kind: "original" | "retry";
  label: string;
  output: string;
  prompt: string;
  review: OutputReview;
};

type GenerationVersion = {
  createdAt: string;
  id: string;
  kind: "original" | "retry";
  label: string;
  output: string;
  prompt: string;
  review?: OutputReview;
};

type ImprovementComparison = {
  afterVersionId: string;
  beforeVersionId: string;
  createdAt: string;
  id: string;
};

type SectionState = {
  completed: boolean;
  generationVersions: GenerationVersion[];
  improvementComparisons: ImprovementComparison[];
  improvedPromptCopied: boolean;
  improvementSkipped: boolean;
  originalOutput: string;
  originalPrompt: string;
  originalReview: OutputReview | null;
  regressionNotice: string;
  retryOutput: string;
  retryPrompt: string;
  retryReview: OutputReview | null;
  reviewHistory: ReviewHistoryEntry[];
};

type WorkspaceState = Partial<Record<ProposalSectionId, SectionState>>;

type PendingCreditAction = {
  action: "review" | "improvement";
  label: string;
  run: () => Promise<void> | void;
};

type WorkflowReviewWorkspaceProps = {
  context: {
    aiModel: "ChatGPT" | "Gemini";
    deadlineUrgency: string;
    industry: string;
    locale: string;
    startupIdea: string;
    targetCustomer: string;
    workflowRunId: string;
  };
};

const emptySectionState: SectionState = {
  completed: false,
  generationVersions: [],
  improvementComparisons: [],
  improvedPromptCopied: false,
  improvementSkipped: false,
  originalOutput: "",
  originalPrompt: "",
  originalReview: null,
  regressionNotice: "",
  retryOutput: "",
  retryPrompt: "",
  retryReview: null,
  reviewHistory: [],
};

const scoreDimensionIds = [
  "relevance",
  "clarity",
  "specificity",
  "completeness",
  "actionability",
  "rubricAlignment",
] as const;

function isPhase3Review(review: OutputReview | null | undefined): review is OutputReview {
  return Boolean(
    review?.score?.breakdown?.completeness &&
      review.score.breakdown.rubricAlignment,
  );
}

function getStorageKey(workflowRunId: string) {
  return `root-access:workflow-review:${workflowRunId}`;
}

function readWorkspaceState(workflowRunId: string): WorkspaceState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const storedValue = window.localStorage.getItem(getStorageKey(workflowRunId));

    if (!storedValue) {
      return {};
    }

    const parsed: unknown = JSON.parse(storedValue);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(([sectionId]) =>
        proposalSectionIds.includes(sectionId as ProposalSectionId),
      ),
    ) as WorkspaceState;
  } catch {
    return {};
  }
}

function readCreditPlan(): CreditPlan {
  if (typeof window === "undefined") {
    return "free";
  }

  try {
    return parseCreditPlan(window.localStorage.getItem(creditPlanStorageKey));
  } catch {
    return "free";
  }
}

function getSectionState(
  workspaceState: WorkspaceState,
  sectionId: ProposalSectionId,
) {
  const storedState = workspaceState[sectionId];
  const reviewHistory = (storedState?.reviewHistory ?? []).filter((entry) =>
    isPhase3Review(entry.review),
  );
  const generationVersions =
    storedState?.generationVersions?.length
      ? storedState.generationVersions
      : (storedState?.reviewHistory ?? []).map((entry) => ({
          createdAt: entry.createdAt,
          id: `generation-${entry.id}`,
          kind: entry.kind,
          label: entry.label,
          output: entry.output,
          prompt: entry.prompt,
          ...(isPhase3Review(entry.review) ? { review: entry.review } : {}),
        }));

  return {
    ...emptySectionState,
    ...(storedState ?? {}),
    generationVersions: generationVersions.map((version) => ({
      ...version,
      ...(isPhase3Review(version.review) ? { review: version.review } : { review: undefined }),
    })),
    improvementComparisons: storedState?.improvementComparisons ?? [],
    originalReview: isPhase3Review(storedState?.originalReview)
      ? storedState.originalReview
      : null,
    reviewHistory,
    retryReview: isPhase3Review(storedState?.retryReview)
      ? storedState.retryReview
      : null,
  };
}

function attachReviewToLatestVersion({
  kind,
  output,
  review,
  versions,
}: {
  kind: GenerationVersion["kind"];
  output: string;
  review: OutputReview;
  versions: GenerationVersion[];
}) {
  const matchingIndex = versions.findLastIndex(
    (version) => version.kind === kind && version.output.trim() === output.trim(),
  );

  if (matchingIndex === -1) {
    return versions;
  }

  return versions.map((version, index) =>
    index === matchingIndex ? { ...version, review } : version,
  );
}

function updateLatestVersionOutput({
  kind,
  output,
  versions,
}: {
  kind: GenerationVersion["kind"];
  output: string;
  versions: GenerationVersion[];
}) {
  const matchingIndex = versions.findLastIndex(
    (version) => version.kind === kind,
  );

  if (matchingIndex === -1) {
    return versions;
  }

  return versions.map((version, index) =>
    index === matchingIndex
      ? { ...version, output, review: undefined }
      : version,
  );
}

function getLatestSectionOutputForExport(
  workspaceState: WorkspaceState,
  sectionId: ProposalSectionId,
) {
  const sectionState = getSectionState(workspaceState, sectionId);

  return (
    sectionState.retryOutput.trim() ||
    sectionState.originalOutput.trim() ||
    ""
  );
}

function extractValidationContent(values: string[]) {
  const validationLines = values
    .flatMap((value) => value.split(/\n+/))
    .map((line) => line.trim())
    .filter((line) =>
      /\b(validate|validation|interview|survey|test|pilot|experiment|measure|evidence|verify|kiểm chứng|phỏng vấn|khảo sát|thử nghiệm|bằng chứng)\b/i.test(
        line,
      ),
    )
    .slice(0, 8);

  return validationLines.join("\n");
}

function summarizeOutput(value: string, fallback: string) {
  const cleanedValue = value
    .replace(/[#*_`>-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = cleanedValue.split(" ").filter(Boolean);

  if (words.length === 0) {
    return fallback;
  }

  return `${words.slice(0, 30).join(" ")}${words.length > 30 ? "..." : ""}`;
}

function getWeakestDimensions(review: OutputReview) {
  return [...scoreDimensionIds]
    .sort(
      (left, right) =>
        review.score.breakdown[left].score - review.score.breakdown[right].score,
    )
    .slice(0, 3);
}

function getFallbackCoach({
  currentOutput,
  isVietnamese,
  previousOutput,
  review,
}: {
  currentOutput: string;
  isVietnamese: boolean;
  previousOutput?: string;
  review: OutputReview;
}): ReviewCoach {
  const weakestDimensions = getWeakestDimensions(review);
  const fallbackCurrent = isVietnamese
    ? "Chưa có đủ nội dung để tóm tắt output hiện tại."
    : "There is not enough current output to summarize yet.";
  const fallbackPrevious = isVietnamese
    ? "Chưa có output trước đó để so sánh."
    : "No previous output is available for comparison.";

  return {
    currentOutputSummary: summarizeOutput(currentOutput, fallbackCurrent),
    previousOutputSummary: previousOutput
      ? summarizeOutput(previousOutput, fallbackPrevious)
      : fallbackPrevious,
    recommendations: weakestDimensions.map((dimension) =>
      isVietnamese
        ? `Cải thiện ${dimension} bằng một bằng chứng, ví dụ hoặc quyết định cụ thể hơn.`
        : `Improve ${dimension} with a clearer proof point, example, or decision.`,
    ),
    remainingWeaknesses:
      review.weaknesses.length > 0
        ? review.weaknesses.slice(0, 3)
        : weakestDimensions.map((dimension) => review.score.breakdown[dimension].reason),
    strengthsImproved:
      review.score.total >= 36
        ? [
            isVietnamese
              ? "Output đã có cấu trúc đủ rõ để tiếp tục chỉnh."
              : "The output is structured enough to keep refining.",
          ]
        : [
            isVietnamese
              ? "Output đã tạo được bản nháp ban đầu để review."
              : "The output gives an initial draft to review.",
          ],
  };
}

function getDeltaTone(delta: number) {
  if (delta > 0) {
    return "text-emerald-300";
  }

  if (delta < 0) {
    return "text-destructive";
  }

  return "text-muted-foreground";
}

function getDeltaLabel(delta: number) {
  if (delta > 0) {
    return `+${delta}`;
  }

  return `${delta}`;
}

function formatVersionTime(value: string, locale: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getPassageTone(severity: ProblematicPassage["severity"]) {
  if (severity === "high") {
    return "bg-red-400/25 text-foreground decoration-red-400";
  }

  if (severity === "medium") {
    return "bg-amber-300/25 text-foreground decoration-amber-300";
  }

  return "bg-sky-300/20 text-foreground decoration-sky-300";
}

function renderHighlightedOutput(output: string, passages: ProblematicPassage[]) {
  const normalizedOutput = output.toLocaleLowerCase();
  const matches = passages
    .map((passage) => {
      const start = normalizedOutput.indexOf(passage.quote.toLocaleLowerCase());

      return {
        end: start + passage.quote.length,
        passage,
        start,
      };
    })
    .filter((match) => match.start >= 0)
    .sort((left, right) => left.start - right.start)
    .filter((match, index, allMatches) =>
      index === 0 ? true : match.start >= allMatches[index - 1].end,
    );

  if (matches.length === 0) {
    return output;
  }

  const fragments: React.ReactNode[] = [];
  let cursor = 0;

  matches.forEach((match, index) => {
    if (match.start > cursor) {
      fragments.push(output.slice(cursor, match.start));
    }

    fragments.push(
      <mark
        key={`${match.start}-${index}`}
        className={cn(
          "rounded px-0.5 underline decoration-2 underline-offset-2",
          getPassageTone(match.passage.severity),
        )}
        title={match.passage.reason}
      >
        {output.slice(match.start, match.end)}
      </mark>,
    );
    cursor = match.end;
  });

  if (cursor < output.length) {
    fragments.push(output.slice(cursor));
  }

  return fragments;
}

function renderImprovedOutput(previousOutput: string, currentOutput: string) {
  const previousLines = new Set(
    previousOutput
      .split("\n")
      .map((line) => line.trim().toLocaleLowerCase())
      .filter(Boolean),
  );
  const lines = currentOutput.split("\n");
  const changedLineCount = lines.filter(
    (line) => line.trim() && !previousLines.has(line.trim().toLocaleLowerCase()),
  ).length;

  if (changedLineCount === 0) {
    return currentOutput;
  }

  return lines.map((line, index) => {
    const isChanged =
      line.trim().length > 0 &&
      !previousLines.has(line.trim().toLocaleLowerCase());

    return isChanged ? (
      <mark
        key={`${line}-${index}`}
        className="rounded bg-emerald-300/20 px-0.5 text-foreground"
      >
        {line}
        {index < lines.length - 1 ? "\n" : ""}
      </mark>
    ) : (
      `${line}${index < lines.length - 1 ? "\n" : ""}`
    );
  });
}

function createInitialPrompt({
  context,
  section,
}: {
  context: WorkflowReviewWorkspaceProps["context"];
  section: WorkflowSection;
}) {
  const languageInstruction =
    context.locale === "vi"
      ? "Write the output in Vietnamese."
      : "Write the output in English.";
  const framework = proposalReviewFrameworks[section.id];

  return [
    `I am working on the "${section.title}" proposal section.`,
    "",
    "Project context:",
    `- Startup idea: ${context.startupIdea}`,
    `- Industry: ${context.industry}`,
    `- Target customer: ${
      context.targetCustomer || "not specified yet; suggest a narrow first segment"
    }`,
    `- Deadline urgency: ${context.deadlineUrgency}`,
    "",
    `Objective: ${section.objective}`,
    `Business checks to satisfy: ${framework.checks.join(", ")}`,
    `Focus on: ${section.promptFocus}`,
    "",
    "Give me structured working material for this proposal section.",
    "Do not write a final essay.",
    "Use bullets or a compact table if helpful.",
    "Mark uncertain facts or assumptions with [VERIFY].",
    languageInstruction,
  ].join("\n");
}

function getScoreTone(score: number) {
  if (score >= 48) {
    return "text-emerald-700 dark:text-emerald-300";
  }

  if (score >= 36) {
    return "text-amber-700 dark:text-amber-300";
  }

  return "text-destructive";
}

function getDimensionScoreTone(score: number) {
  if (score >= 8) {
    return "text-emerald-700 dark:text-emerald-300";
  }

  if (score >= 5) {
    return "text-yellow-700 dark:text-yellow-300";
  }

  return "text-destructive";
}

function getDimensionScoreBar(score: number) {
  if (score >= 8) {
    return "bg-emerald-600";
  }

  if (score >= 5) {
    return "bg-yellow-500";
  }

  return "bg-destructive";
}

function createEventId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function readIntelligenceEvents() {
  try {
    return parseIntelligenceEvents(
      window.localStorage.getItem(intelligenceStorageKey),
    );
  } catch {
    return [];
  }
}

function writeIntelligenceEvent(event: IntelligenceEvent) {
  try {
    const currentEvents = readIntelligenceEvents();
    const nextEvents = [...currentEvents, event].slice(-250);

    window.localStorage.setItem(
      intelligenceStorageKey,
      JSON.stringify(nextEvents),
    );
  } catch {
    return;
  }
}

export function WorkflowReviewWorkspace({
  context,
}: WorkflowReviewWorkspaceProps) {
  const t = useTranslations("WorkflowWorkspace");
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>({});
  const [hydratedWorkflowRunId, setHydratedWorkflowRunId] = useState<string | null>(
    null,
  );
  const [activeSectionId, setActiveSectionId] =
    useState<ProposalSectionId>("problem");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<CreditPlan>(() => readCreditPlan());
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [printDocument, setPrintDocument] =
    useState<ProposalExportDocument | null>(null);
  const [pendingCreditAction, setPendingCreditAction] =
    useState<PendingCreditAction | null>(null);
  const { canUse, getRemaining, recordUse, usage } = useCreditUsage(plan);
  const sections = useMemo<WorkflowSection[]>(
    () =>
      proposalSectionIds.map((sectionId) => ({
        id: sectionId,
        objective: t(`sections.${sectionId}.objective`),
        promptFocus: t(`sections.${sectionId}.promptFocus`),
        title: t(`sections.${sectionId}.title`),
      })),
    [t],
  );
  const activeSection =
    sections.find((section) => section.id === activeSectionId) ?? sections[0];
  const activeState = getSectionState(workspaceState, activeSection.id);
  const activePrompt =
    activeState.originalPrompt ||
    createInitialPrompt({
      context,
      section: activeSection,
    });
  const completedCount = sections.filter(
    (section) => getSectionState(workspaceState, section.id).completed,
  ).length;
  const currentIndex = sections.findIndex(
    (section) => section.id === activeSection.id,
  );
  const firstIncompleteIndex = sections.findIndex(
    (section) => !getSectionState(workspaceState, section.id).completed,
  );
  const activeUnlockState =
    firstIncompleteIndex === -1
      ? null
      : getSectionState(workspaceState, sections[firstIncompleteIndex].id);
  const unlockedSectionIndex =
    firstIncompleteIndex === -1
      ? sections.length - 1
      : firstIncompleteIndex + (activeUnlockState?.originalOutput.trim() ? 1 : 0);
  const remainingCount = Math.max(sections.length - completedCount, 0);
  const completionPercentage = Math.round(
    (completedCount / sections.length) * 100,
  );
  const latestReview = activeState.retryReview ?? activeState.originalReview;
  const improvedPrompt =
    activeState.retryReview?.improvedPrompt ??
    activeState.originalReview?.improvedPrompt ??
    "";
  const retryPrompt = activeState.retryPrompt || improvedPrompt;
  const latestComparison =
    activeState.improvementComparisons[
      activeState.improvementComparisons.length - 1
    ];
  const comparisonBeforeVersion = latestComparison
    ? activeState.generationVersions.find(
        (version) => version.id === latestComparison.beforeVersionId,
      )
    : undefined;
  const comparisonAfterVersion = latestComparison
    ? activeState.generationVersions.find(
        (version) => version.id === latestComparison.afterVersionId,
      )
    : undefined;
  const oldScore = comparisonBeforeVersion?.review?.score.total;
  const newScore = comparisonAfterVersion?.review?.score.total;
  const isVietnamese = context.locale === "vi";
  const headerCopy = {
    back: isVietnamese ? "Home" : "Home",
    creditTooltip: isVietnamese
      ? "1 review = 1 credit / 1 improve = 1 credit"
      : "1 review = 1 credit / 1 improve = 1 credit",
    creditConfirm: isVietnamese
      ? "Hành động này tốn 1 credit. Bạn muốn tiếp tục?"
      : "This action costs 1 credit. Do you want to continue?",
    creditRemainingAfter: isVietnamese
      ? "Credit còn lại sau hành động"
      : "Remaining after action",
    cancel: isVietnamese ? "Hủy" : "Cancel",
    comparisonAfter: isVietnamese ? "Sau" : "After",
    comparisonBefore: isVietnamese ? "Trước" : "Before",
    comparisonWaiting: isVietnamese
      ? "Tạo output từ improved prompt để xem điểm sau."
      : "Generate from the improved prompt to see the after score.",
    confirm: isVietnamese ? "Xác nhận" : "Confirm",
    copyAll: isVietnamese ? "Copy tất cả" : "Copy all",
    downloadDocx: isVietnamese ? "Tải DOCX" : "Download DOCX",
    downloadPdf: isVietnamese ? "Xuất PDF" : "Export PDF",
    downloadTxt: isVietnamese ? "Tải .txt" : "Download .txt",
    exportDescription: isVietnamese
      ? "Xuất bản proposal sạch, bỏ markdown và lời thoại AI để dùng như tài liệu nộp bài."
      : "Export a clean proposal without markdown or AI chatter, ready for submission formatting.",
    exportTitle: isVietnamese ? "Xuất Startup Proposal" : "Export Startup Proposal",
    improveAgain: isVietnamese
      ? "Cải thiện thêm prompt"
      : "Improve Prompt Again",
    improveAgainDescription: isVietnamese
      ? "Dùng điểm và weakness của output vừa chấm để tạo prompt đầy đủ hơn cho lần retry tiếp theo."
      : "Use the latest retry score and weaknesses to create a fuller prompt for the next retry.",
    improvePrompt: isVietnamese ? "Cải thiện prompt của tôi" : "Improve My Prompt",
    improveQuestion: isVietnamese
      ? "Bạn có muốn cải thiện prompt này không?"
      : "Do you want to improve this prompt?",
    locked: isVietnamese ? "Đang khóa" : "Locked",
    noContinue: isVietnamese ? "Không, tiếp tục" : "No, continue",
    proposalTitle: isVietnamese ? "Startup proposal" : "Startup proposal",
    regressionNotice: isVietnamese
      ? "Retry bị thấp điểm hơn. RootAccess đã tạo lại improved prompt để bạn test lại."
      : "The retry scored lower. RootAccess regenerated the improved prompt for another test.",
    reviewMyWork: isVietnamese ? "Review bài của tôi" : "Review My Work",
    updateProposal: isVietnamese ? "Hoàn thành bước này" : "Complete Step",
  };
  const pendingRemaining = pendingCreditAction
    ? getRemaining(pendingCreditAction.action)
    : null;
  const pendingRemainingAfter =
    typeof pendingRemaining === "number"
      ? Math.max(pendingRemaining - 1, 0)
      : pendingRemaining;
  const proposalDocument = useMemo(() => {
    const problem = getLatestSectionOutputForExport(workspaceState, "problem");
    const customer = getLatestSectionOutputForExport(workspaceState, "customer");
    const revenue = getLatestSectionOutputForExport(workspaceState, "revenue");
    const mvp = getLatestSectionOutputForExport(workspaceState, "mvp");
    const differentiation = getLatestSectionOutputForExport(
      workspaceState,
      "differentiation",
    );
    const validation = extractValidationContent([
      problem,
      customer,
      revenue,
      mvp,
      differentiation,
    ]);
    const exportSections: ProposalExportSection[] = [
      {
        content: problem,
        heading: "Problem Statement",
      },
      {
        content: customer,
        heading: "Customer Segment",
      },
      {
        content: validation,
        heading: "Validation Plan",
      },
      {
        content: revenue,
        heading: "Revenue Model",
      },
      {
        content: differentiation,
        heading: "Competitive Advantage",
      },
      {
        content: mvp,
        heading: "MVP Scope",
      },
    ];

    return buildProposalExport({
      contextLines: [
        `Startup idea: ${context.startupIdea}`,
        `Industry: ${context.industry}`,
        `Target customer: ${
          context.targetCustomer || (isVietnamese ? "Chưa xác định" : "Not specified")
        }`,
        `Deadline urgency: ${context.deadlineUrgency}`,
      ],
      sections: exportSections,
      title: "Startup Proposal",
    });
  }, [
    context.deadlineUrgency,
    context.industry,
    context.startupIdea,
    context.targetCustomer,
    isVietnamese,
    workspaceState,
  ]);
  const proposalBuilderSources = useMemo(
    () => {
      const problem = getLatestSectionOutputForExport(workspaceState, "problem");
      const customer = getLatestSectionOutputForExport(workspaceState, "customer");
      const revenue = getLatestSectionOutputForExport(workspaceState, "revenue");
      const mvp = getLatestSectionOutputForExport(workspaceState, "mvp");
      const differentiation = getLatestSectionOutputForExport(
        workspaceState,
        "differentiation",
      );
      const validation = extractValidationContent([
        problem,
        customer,
        revenue,
        mvp,
        differentiation,
      ]);

      return {
        idea: [
          context.startupIdea,
          context.targetCustomer
            ? `${isVietnamese ? "Khách hàng đầu tiên" : "First customer"}: ${context.targetCustomer}`
            : "",
          `${isVietnamese ? "Lĩnh vực" : "Industry"}: ${context.industry}`,
        ]
          .filter(Boolean)
          .join("\n\n"),
        problem,
        customer,
        market: customer,
        solution: mvp,
        revenue,
        competition: differentiation,
        mvp,
        validation,
      };
    },
    [
      context.industry,
      context.startupIdea,
      context.targetCustomer,
      isVietnamese,
      workspaceState,
    ],
  );

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setWorkspaceState(readWorkspaceState(context.workflowRunId));
      setHydratedWorkflowRunId(context.workflowRunId);
    }, 0);

    return () => window.clearTimeout(hydrationTimer);
  }, [context.workflowRunId]);

  useEffect(() => {
    if (hydratedWorkflowRunId !== context.workflowRunId) {
      return;
    }

    try {
      window.localStorage.setItem(
        getStorageKey(context.workflowRunId),
        JSON.stringify(workspaceState),
      );
    } catch {
      return;
    }
  }, [context.workflowRunId, hydratedWorkflowRunId, workspaceState]);

  useEffect(() => {
    const handleStorage = () => {
      setPlan(readCreditPlan());
    };

    window.addEventListener("storage", handleStorage);

    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (!printDocument) {
      return;
    }

    const handleAfterPrint = () => {
      setPrintDocument(null);
    };
    const printTimer = window.setTimeout(() => window.print(), 100);

    document.body.classList.add("proposal-printing");
    window.addEventListener("afterprint", handleAfterPrint);

    return () => {
      window.clearTimeout(printTimer);
      document.body.classList.remove("proposal-printing");
      window.removeEventListener("afterprint", handleAfterPrint);
    };
  }, [printDocument]);

  function updateSectionState(
    sectionId: ProposalSectionId,
    createNextState: (sectionState: SectionState) => SectionState,
  ) {
    setWorkspaceState((currentState) => ({
      ...currentState,
      [sectionId]: createNextState(getSectionState(currentState, sectionId)),
    }));
  }

  function logIntelligenceEvent({
    improvement,
    previousScore,
    promptLabel,
    score,
    type,
    weaknesses,
  }: {
    improvement?: number;
    previousScore?: number;
    promptLabel?: string;
    score?: number;
    type: IntelligenceEventType;
    weaknesses?: string[];
  }) {
    writeIntelligenceEvent({
      createdAt: new Date().toISOString(),
      id: createEventId(),
      improvement,
      previousScore,
      promptLabel,
      score,
      sectionId: activeSection.id,
      sectionTitle: activeSection.title,
      type,
      weaknesses,
      workflowRunId: context.workflowRunId,
    });
  }

  function requestCreditAction(pendingAction: PendingCreditAction) {
    if (!canUse(pendingAction.action)) {
      setError(t(`credits.limits.${pendingAction.action}`));
      setIsUpgradeOpen(true);
      return;
    }

    setError(null);
    setPendingCreditAction(pendingAction);
  }

  async function confirmCreditAction() {
    const actionToRun = pendingCreditAction;

    if (!actionToRun) {
      return;
    }

    setPendingCreditAction(null);
    await actionToRun.run();
  }

  function resetPrompt() {
    const prompt = createInitialPrompt({
      context,
      section: activeSection,
    });

    setError(null);
    updateSectionState(activeSection.id, (sectionState) => ({
      ...sectionState,
      originalPrompt: prompt,
    }));
  }

  function updatePrompt(kind: "original" | "retry", value: string) {
    updateSectionState(activeSection.id, (sectionState) => ({
      ...sectionState,
      originalPrompt:
        kind === "original" ? value : sectionState.originalPrompt,
      retryPrompt: kind === "retry" ? value : sectionState.retryPrompt,
    }));
  }

  async function generateWithGemini(kind: "original" | "retry") {
    const prompt = (kind === "retry" ? retryPrompt : activePrompt).trim();

    if (!prompt) {
      setError(t("errors.promptRequired"));
      return;
    }

    if (!canUse("generation")) {
      setError(t("credits.limits.generation"));
      setIsUpgradeOpen(true);
      return;
    }

    const history = Object.values(workspaceState)
      .flatMap((sectionState) => sectionState?.generationVersions ?? [])
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
      .slice(-4)
      .flatMap((version) => [
        { role: "user" as const, text: version.prompt },
        { role: "model" as const, text: version.output },
      ]);

    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: {
            deadlineUrgency: context.deadlineUrgency,
            industry: context.industry,
            startupIdea: context.startupIdea,
            targetCustomer: context.targetCustomer,
          },
          history,
          locale: context.locale === "vi" ? "vi" : "en",
          prompt,
          section: activeSection.title,
        }),
      });
      const data = (await response.json()) as {
        message?: unknown;
        output?: unknown;
      };

      if (!response.ok || typeof data.output !== "string" || !data.output.trim()) {
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : t("errors.generateFailed"),
        );
      }

      const output = data.output.trim();

      recordUse("generation");
      updateSectionState(activeSection.id, (sectionState) => {
        const version: GenerationVersion = {
          createdAt: new Date().toISOString(),
          id: createEventId(),
          kind,
          label: `v${sectionState.generationVersions.length + 1}`,
          output,
          prompt,
        };

        return {
          ...sectionState,
          completed: false,
          generationVersions: [...sectionState.generationVersions, version],
          improvedPromptCopied: false,
          improvementSkipped: false,
          originalOutput:
            kind === "original" ? output : sectionState.originalOutput,
          originalPrompt:
            kind === "original" ? prompt : sectionState.originalPrompt,
          originalReview:
            kind === "original" ? null : sectionState.originalReview,
          regressionNotice: "",
          retryOutput: kind === "retry" ? output : "",
          retryPrompt: kind === "retry" ? prompt : sectionState.retryPrompt,
          retryReview: null,
        };
      });
      window.setTimeout(() => {
        document
          .querySelector('[data-generation-latest="true"]')
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 80);
    } catch (generationError) {
      setError(
        generationError instanceof Error
          ? generationError.message
          : t("errors.generateFailed"),
      );
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyToClipboard(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1600);
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadProposalDraft(format: "docx" | "pdf" | "txt") {
    const filename = `startup-proposal-${context.workflowRunId}`;

    if (format === "docx") {
      downloadBlob(createDocxBlob(proposalDocument), `${filename}.docx`);
      return;
    }

    if (format === "pdf") {
      setPrintDocument({
        ...proposalDocument,
        contextLines: [...proposalDocument.contextLines],
        sections: proposalDocument.sections.map((section) => ({ ...section })),
      });
      return;
    }

    downloadBlob(createTextBlob(proposalDocument), `${filename}.txt`);
  }

  async function reviewOutput(kind: "original" | "retry") {
    const output =
      kind === "original"
        ? activeState.originalOutput.trim()
        : activeState.retryOutput.trim();
    const generatedVersion = [...activeState.generationVersions]
      .reverse()
      .find(
        (version) =>
          version.kind === kind && version.output.trim() === output,
      );
    const previousReviewedVersion =
      kind === "retry"
        ? [...activeState.generationVersions]
            .reverse()
            .find(
              (version) =>
                version.id !== generatedVersion?.id && Boolean(version.review),
            )
        : undefined;
    const promptForReview =
      generatedVersion?.prompt ??
      (kind === "retry" && retryPrompt ? retryPrompt : activePrompt);

    if (!output) {
      setError(t("errors.outputRequired"));
      return;
    }

    if (!canUse("review")) {
      setError(t("credits.limits.review"));
      setIsUpgradeOpen(true);
      return;
    }

    setError(null);
    setIsReviewing(true);

    try {
      const response = await fetch("/api/gemini/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context: {
            aiModel: context.aiModel,
            deadlineUrgency: context.deadlineUrgency,
            industry: context.industry,
            startupIdea: context.startupIdea,
            targetCustomer: context.targetCustomer,
          },
          locale: context.locale === "vi" ? "vi" : "en",
          mode: "review",
          originalPrompt: promptForReview,
          output,
          previousOutput:
            kind === "retry" ? previousReviewedVersion?.output : undefined,
          previousScore:
            kind === "retry"
              ? previousReviewedVersion?.review?.score.total
              : undefined,
          section: activeSection.title,
          sectionId: activeSection.id,
        }),
      });
      const data = (await response.json()) as {
        message?: unknown;
        review?: unknown;
      };

      if (!response.ok) {
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : t("errors.reviewFailed"),
        );
      }

      const review = data.review as OutputReview | undefined;

      if (!review?.score) {
        throw new Error(t("errors.reviewFailed"));
      }

      const historyLabel = `v${activeState.reviewHistory.length + 1}`;
      const historyEntry: ReviewHistoryEntry = {
        createdAt: new Date().toISOString(),
        id: createEventId(),
        kind,
        label: historyLabel,
        output,
        prompt: promptForReview,
        review,
      };

      recordUse("review");
      updateSectionState(activeSection.id, (sectionState) => {
        const preservedImprovedPrompt =
          review.improvedPrompt ??
          sectionState.retryReview?.improvedPrompt ??
          sectionState.originalReview?.improvedPrompt;
        const preservedWhyBetter =
          review.whyBetter ??
          sectionState.retryReview?.whyBetter ??
          sectionState.originalReview?.whyBetter;
        const retryReview =
          kind === "retry"
            ? {
                ...review,
                ...(preservedImprovedPrompt
                  ? { improvedPrompt: preservedImprovedPrompt }
                  : {}),
                ...(preservedWhyBetter ? { whyBetter: preservedWhyBetter } : {}),
              }
            : sectionState.retryReview;

        const generationVersions = attachReviewToLatestVersion({
          kind,
          output,
          review,
          versions: sectionState.generationVersions,
        });
        const comparisonBeforeVersion =
          kind === "retry" && generatedVersion
            ? [...sectionState.generationVersions]
                .reverse()
                .find(
                  (version) =>
                    version.id !== generatedVersion.id && Boolean(version.review),
                )
            : undefined;
        const improvementComparisons =
          kind === "retry" && generatedVersion && comparisonBeforeVersion
            ? [
                ...sectionState.improvementComparisons,
                {
                  afterVersionId: generatedVersion.id,
                  beforeVersionId: comparisonBeforeVersion.id,
                  createdAt: new Date().toISOString(),
                  id: createEventId(),
                },
              ]
            : sectionState.improvementComparisons;

        return {
          ...sectionState,
          generationVersions,
          improvementComparisons,
          improvedPromptCopied: false,
          improvementSkipped: false,
          originalReview:
            kind === "original" ? review : sectionState.originalReview,
          retryReview,
          reviewHistory: [...sectionState.reviewHistory, historyEntry],
        };
      });
      logIntelligenceEvent({
        improvement:
          kind === "retry" && previousReviewedVersion?.review
            ? review.score.total - previousReviewedVersion.review.score.total
            : undefined,
        previousScore: previousReviewedVersion?.review?.score.total,
        promptLabel: historyLabel,
        score: review.score.total,
        type: kind === "retry" ? "retry_completed" : "review_completed",
        weaknesses: review.weaknesses,
      });

      if (
        kind === "retry" &&
        previousReviewedVersion?.review &&
        review.score.total < previousReviewedVersion.review.score.total
      ) {
        await repairRegressedPrompt(review, previousReviewedVersion.review.score.total);
      }
    } catch (reviewError) {
      setError(
        reviewError instanceof Error
          ? reviewError.message
          : t("errors.reviewFailed"),
      );
    } finally {
      setIsReviewing(false);
    }
  }

  async function fetchPromptImprovement({
    baselineScore,
    promptToImprove,
    reviewToImprove,
    sourceOutput,
  }: {
    baselineScore: number;
    promptToImprove: string;
    reviewToImprove: OutputReview;
    sourceOutput: string;
  }) {
    const response = await fetch("/api/gemini/review", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        baselineScore,
        context: {
          aiModel: context.aiModel,
          deadlineUrgency: context.deadlineUrgency,
          industry: context.industry,
          startupIdea: context.startupIdea,
          targetCustomer: context.targetCustomer,
        },
        locale: context.locale === "vi" ? "vi" : "en",
        mode: "improve",
        originalPrompt: promptToImprove,
        output: sourceOutput,
        previousOutput: activeState.originalOutput.trim() || undefined,
        previousScore: activeState.originalReview?.score.total,
          section: activeSection.title,
          sectionId: activeSection.id,
          missingInformation: reviewToImprove.missingInformation,
          suggestions: reviewToImprove.suggestions,
          weaknesses: reviewToImprove.weaknesses,
      }),
    });
    const data = (await response.json()) as {
      improvement?: {
        improvedPrompt?: unknown;
        whyBetter?: unknown;
      };
      message?: unknown;
    };

    if (!response.ok) {
      throw new Error(
        typeof data.message === "string"
          ? data.message
          : t("errors.reviewFailed"),
      );
    }

    const improvement = data.improvement;

    if (
      typeof improvement?.improvedPrompt !== "string" ||
      typeof improvement.whyBetter !== "string"
    ) {
      throw new Error(t("errors.reviewFailed"));
    }

    return {
      improvedPrompt: improvement.improvedPrompt,
      whyBetter: improvement.whyBetter,
    };
  }

  async function improvePrompt() {
    const reviewToImprove = activeState.retryReview ?? activeState.originalReview;
    const sourceOutput = activeState.retryReview
      ? activeState.retryOutput.trim()
      : activeState.originalOutput.trim();
    const promptToImprove =
      activeState.retryReview && retryPrompt ? retryPrompt : activePrompt;

    if (!reviewToImprove || !sourceOutput) {
      setError(t("errors.reviewFailed"));
      return;
    }

    if (!canUse("improvement")) {
      setError(t("credits.limits.improvement"));
      setIsUpgradeOpen(true);
      return;
    }

    setError(null);
    setIsImproving(true);

    try {
      const improvement = await fetchPromptImprovement({
        baselineScore: reviewToImprove.score.total,
        promptToImprove,
        reviewToImprove,
        sourceOutput,
      });

      recordUse("improvement");
      updateSectionState(activeSection.id, (sectionState) => {
        const currentReview =
          sectionState.retryReview ?? sectionState.originalReview;
        const nextReview = currentReview
          ? {
              ...currentReview,
              improvedPrompt: improvement.improvedPrompt,
              whyBetter: improvement.whyBetter,
            }
          : currentReview;

        return {
          ...sectionState,
          improvedPromptCopied: false,
          improvementSkipped: false,
          originalReview: sectionState.retryReview
            ? sectionState.originalReview
            : nextReview,
          regressionNotice: "",
          retryPrompt: improvement.improvedPrompt,
          retryReview: sectionState.retryReview ? nextReview : null,
        };
      });
    } catch (improvementError) {
      setError(
        improvementError instanceof Error
          ? improvementError.message
          : t("errors.reviewFailed"),
      );
    } finally {
      setIsImproving(false);
    }
  }

  async function repairRegressedPrompt(
    regressedReview: OutputReview,
    baselineScore: number,
  ) {
    const sourceOutput = activeState.retryOutput.trim();

    if (
      regressedReview.score.total >= baselineScore ||
      !sourceOutput ||
      !improvedPrompt
    ) {
      return;
    }

    setIsImproving(true);

    try {
      let nextPrompt = improvedPrompt;
      let nextImprovement: {
        improvedPrompt: string;
        whyBetter: string;
      } | null = null;

      for (let attempt = 0; attempt < 2; attempt += 1) {
        nextImprovement = await fetchPromptImprovement({
          baselineScore,
          promptToImprove: nextPrompt,
          reviewToImprove: regressedReview,
          sourceOutput,
        });
        nextPrompt = nextImprovement.improvedPrompt;
      }

      if (!nextImprovement) {
        return;
      }

      const repairedImprovement = nextImprovement;

      updateSectionState(activeSection.id, (sectionState) => ({
        ...sectionState,
        improvedPromptCopied: false,
        originalReview: sectionState.originalReview
          ? {
              ...sectionState.originalReview,
              improvedPrompt: repairedImprovement.improvedPrompt,
              whyBetter: repairedImprovement.whyBetter,
            }
          : sectionState.originalReview,
        regressionNotice: headerCopy.regressionNotice,
        retryPrompt: repairedImprovement.improvedPrompt,
        retryReview: sectionState.retryReview
          ? {
              ...sectionState.retryReview,
              improvedPrompt: repairedImprovement.improvedPrompt,
              whyBetter: repairedImprovement.whyBetter,
            }
          : {
              ...regressedReview,
              improvedPrompt: repairedImprovement.improvedPrompt,
              whyBetter: repairedImprovement.whyBetter,
            },
      }));
    } catch (regressionError) {
      setError(
        regressionError instanceof Error
          ? regressionError.message
          : t("errors.reviewFailed"),
      );
    } finally {
      setIsImproving(false);
    }
  }

  function handleOutputChange(kind: "original" | "retry", value: string) {
    updateSectionState(activeSection.id, (sectionState) => ({
      ...sectionState,
      completed: false,
      improvedPromptCopied:
        kind === "original" ? false : sectionState.improvedPromptCopied,
      improvementSkipped:
        kind === "original" ? false : sectionState.improvementSkipped,
      originalOutput:
        kind === "original" ? value : sectionState.originalOutput,
      originalReview:
        kind === "original" ? null : sectionState.originalReview,
      regressionNotice: "",
      retryOutput: kind === "retry" ? value : sectionState.retryOutput,
      generationVersions: updateLatestVersionOutput({
        kind,
        output: value,
        versions: sectionState.generationVersions,
      }),
      retryReview: kind === "retry" ? null : sectionState.retryReview,
    }));
  }

  function completeSection() {
    updateSectionState(activeSection.id, (sectionState) => ({
      ...sectionState,
      completed: true,
    }));
    logIntelligenceEvent({
      score: latestReview?.score.total,
      type: "section_completed",
      weaknesses: latestReview?.weaknesses,
    });

    const nextSection = sections[currentIndex + 1];

    if (nextSection) {
      setActiveSectionId(nextSection.id);
      window.requestAnimationFrame(() => {
        window.scrollTo({
          behavior: "smooth",
          top: 0,
        });
      });
    }
  }

  async function copyImprovedPrompt() {
    if (!improvedPrompt) {
      return;
    }

    await copyToClipboard(improvedPrompt, `${activeSection.id}:improved-prompt`);

    if (!activeState.improvedPromptCopied) {
      updateSectionState(activeSection.id, (sectionState) => ({
        ...sectionState,
        improvedPromptCopied: true,
      }));
    }
  }

  function renderReview({
    currentOutput,
    label,
    previousOutput,
    previousReview,
    review,
  }: {
    currentOutput: string;
    label: string;
    previousOutput?: string;
    previousReview?: OutputReview | null;
    review: OutputReview;
  }) {
    const score = review.score;
    const fallbackCoach = getFallbackCoach({
      currentOutput,
      isVietnamese,
      previousOutput,
      review,
    });
    const coach: ReviewCoach = {
      currentOutputSummary:
        review.coach?.currentOutputSummary ||
        fallbackCoach.currentOutputSummary,
      previousOutputSummary:
        review.coach?.previousOutputSummary ||
        fallbackCoach.previousOutputSummary,
      recommendations:
        review.coach?.recommendations?.length
          ? review.coach.recommendations.slice(0, 3)
          : fallbackCoach.recommendations,
      remainingWeaknesses:
        review.coach?.remainingWeaknesses?.length
          ? review.coach.remainingWeaknesses.slice(0, 3)
          : fallbackCoach.remainingWeaknesses,
      strengthsImproved:
        review.coach?.strengthsImproved?.length
          ? review.coach.strengthsImproved.slice(0, 3)
          : fallbackCoach.strengthsImproved,
    };
    const strengths = review.strengths.length
      ? review.strengths
      : coach.strengthsImproved;
    const weaknesses = review.weaknesses.length
      ? review.weaknesses
      : coach.remainingWeaknesses;
    const suggestions = review.suggestions.length
      ? review.suggestions
      : coach.recommendations;
    const hasPrevious = Boolean(previousReview);

    return (
      <div className="grid gap-4 rounded-2xl border border-border/70 bg-background/35 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">
              {isVietnamese ? "AI Coach Review" : "AI Coach Review"}
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {label}
            </p>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {score.explanation}
            </p>
          </div>
          <p
            className={cn(
              "text-3xl font-semibold leading-none",
              getScoreTone(score.total),
            )}
          >
            {score.total}/60
          </p>
        </div>

        {hasPrevious ? (
          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {headerCopy.comparisonBefore}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {coach.previousOutputSummary}
              </p>
              {previousOutput ? (
                <pre className="mt-3 max-h-36 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-border/60 bg-background/35 p-3 text-xs leading-5 text-muted-foreground">
                  {previousOutput}
                </pre>
              ) : null}
            </div>
            <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
              <p className="text-xs font-medium uppercase text-primary">
                {headerCopy.comparisonAfter}
              </p>
              <p className="mt-2 text-sm leading-6 text-foreground">
                {coach.currentOutputSummary}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
            <p className="text-xs font-medium uppercase text-primary">
              {isVietnamese ? "Tóm tắt output" : "Output summary"}
            </p>
            <p className="mt-2 text-sm leading-6 text-foreground">
              {coach.currentOutputSummary}
            </p>
          </div>
        )}

        <div
          data-review-highlights="true"
          className="rounded-2xl border border-border/70 bg-secondary/25 p-3 sm:p-4"
        >
          <p className="text-sm font-semibold text-foreground">
            {t("review.problematicSections")}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {review.problematicPassages.length > 0
              ? t("review.highlightHelp")
              : t("review.noProblematicSections")}
          </p>
          <div className="mt-3 max-h-72 overflow-y-auto whitespace-pre-wrap rounded-xl border border-border/60 bg-background/40 p-3 text-sm leading-6 text-muted-foreground">
            {renderHighlightedOutput(currentOutput, review.problematicPassages)}
          </div>
          {review.problematicPassages.length > 0 ? (
            <ul className="mt-3 grid gap-2">
              {review.problematicPassages.map((passage, index) => (
                <li
                  key={`${passage.quote}-${index}`}
                  className="grid gap-1 border-l-2 border-primary/50 pl-3 text-sm leading-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {t(`review.severity.${passage.severity}`)}
                    </Badge>
                    <span className="font-medium text-foreground">
                      “{passage.quote}”
                    </span>
                  </div>
                  <span className="text-muted-foreground">{passage.reason}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div data-review-scores="true" className="grid gap-2 sm:grid-cols-2">
          {scoreDimensionIds.map((dimension) => {
            const dimensionScore = score.breakdown[dimension].score;
            const previousScore =
              previousReview?.score.breakdown[dimension].score;
            const delta =
              typeof previousScore === "number"
                ? dimensionScore - previousScore
                : undefined;

            return (
              <div
                key={dimension}
                className="rounded-2xl border border-border/70 bg-secondary/30 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    {t(`review.dimensions.${dimension}`)}
                  </p>
                  <div className="text-right">
                    {typeof previousScore === "number" ? (
                      <p className="text-sm font-semibold text-foreground">
                        {previousScore} → {dimensionScore}
                      </p>
                    ) : (
                      <p
                        className={cn(
                          "text-lg font-semibold",
                          getDimensionScoreTone(dimensionScore),
                        )}
                      >
                        {dimensionScore}/10
                      </p>
                    )}
                    {typeof delta === "number" ? (
                      <p className={cn("text-xs font-semibold", getDeltaTone(delta))}>
                        {getDeltaLabel(delta)}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/45">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      getDimensionScoreBar(dimensionScore),
                    )}
                    style={{ width: `${dimensionScore * 10}%` }}
                  />
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {score.breakdown[dimension].reason}
                </p>
              </div>
            );
          })}
        </div>

        {hasPrevious ? (
          <div className="grid gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-3 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {headerCopy.comparisonBefore}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {previousReview?.score.total ?? "--"}/60
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {headerCopy.comparisonAfter}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {score.total}/60
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {t("retry.change")}
              </p>
              <p
                className={cn(
                  "mt-1 text-2xl font-semibold",
                  getDeltaTone(score.total - (previousReview?.score.total ?? score.total)),
                )}
              >
                {getDeltaLabel(
                  score.total - (previousReview?.score.total ?? score.total),
                )}
              </p>
            </div>
          </div>
        ) : null}

        <div data-review-diagnostics="true" className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-3">
            <p className="text-sm font-medium text-foreground">
              {t("review.strengths")}
            </p>
            <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
              {strengths.map((strength) => (
                <li key={strength}>+ {strength}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-red-300/30 bg-red-300/10 p-3">
            <p className="text-sm font-medium text-foreground">
              {t("review.weaknesses")}
            </p>
            <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
              {weaknesses.map((weakness) => (
                <li key={weakness}>- {weakness}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3">
            <p className="text-sm font-medium text-foreground">
              {t("review.missingInformation")}
            </p>
            <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
              {(review.missingInformation.length
                ? review.missingInformation
                : [t("review.noMissingInformation")]
              ).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
            <p className="text-sm font-medium text-foreground">
              {t("review.suggestions")}
            </p>
            <ol className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion}>{index + 1}. {suggestion}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    );
  }

  function renderImprovementComparison() {
    const beforeVersion = comparisonBeforeVersion;
    const afterVersion = comparisonAfterVersion;
    const beforeReview = beforeVersion?.review;
    const afterReview = afterVersion?.review;

    if (!latestComparison || !beforeVersion || !afterVersion || !beforeReview || !afterReview) {
      return null;
    }

    const scoreDelta = afterReview.score.total - beforeReview.score.total;
    const improvedSections = afterReview.strengths.length
      ? afterReview.strengths
      : afterReview.coach?.strengthsImproved ?? [];
    const remainingProblems = [
      ...afterReview.weaknesses,
      ...afterReview.missingInformation,
    ].slice(0, 5);

    return (
      <motion.section
        key={latestComparison.id}
        data-improvement-comparison="true"
        className="glass grid gap-4 rounded-3xl p-4 sm:p-5"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge variant="secondary">{t("comparison.title")}</Badge>
            <p className="mt-2 text-lg font-semibold text-foreground">
              {beforeVersion.label} <ArrowRight aria-hidden="true" className="mx-1 inline size-4 text-primary" /> {afterVersion.label}
            </p>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("comparison.description")}
            </p>
          </div>
          <div className="grid min-w-36 grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-2xl border border-border/70 bg-secondary/30 p-3 text-center">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {t("comparison.before")}
              </p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {beforeReview.score.total}/60
              </p>
            </div>
            <ArrowRight aria-hidden="true" className="size-4 text-primary" />
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {t("comparison.after")}
              </p>
              <p className={cn("mt-1 text-xl font-semibold", getScoreTone(afterReview.score.total))}>
                {afterReview.score.total}/60
              </p>
              <p className={cn("text-xs font-semibold", getDeltaTone(scoreDelta))}>
                {getDeltaLabel(scoreDelta)}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-secondary/25 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {t("comparison.before")} {t("comparison.prompt")}
            </p>
            <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
              {beforeVersion.prompt}
            </pre>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
            <p className="text-xs font-medium uppercase text-primary">
              {t("comparison.after")} {t("comparison.prompt")}
            </p>
            <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-foreground">
              {afterVersion.prompt}
            </pre>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-secondary/25 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {t("comparison.before")} {t("comparison.output")}
            </p>
            <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {beforeVersion.output}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-3">
            <p className="text-xs font-medium uppercase text-emerald-700 dark:text-emerald-300">
              {t("comparison.after")} {t("comparison.output")}
            </p>
            <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-foreground">
              {renderImprovedOutput(beforeVersion.output, afterVersion.output)}
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-3">
            <p className="text-sm font-semibold text-foreground">
              {t("comparison.improvedSections")}
            </p>
            <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
              {(improvedSections.length
                ? improvedSections
                : [t("comparison.noImprovedSections")]
              ).map((item) => (
                <li key={item}>+ {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3">
            <p className="text-sm font-semibold text-foreground">
              {t("comparison.remainingProblems")}
            </p>
            <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
              {(remainingProblems.length
                ? remainingProblems
                : [t("comparison.noRemainingProblems")]
              ).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </motion.section>
    );
  }

  const printableProposal =
    printDocument && typeof document !== "undefined"
      ? createPortal(
          <article className="proposal-print-root">
            <h1>{printDocument.title}</h1>
            <div className="proposal-print-context">
              {printDocument.contextLines.map((line) => (
                <p key={line} className="proposal-print-context-line">
                  {line}
                </p>
              ))}
            </div>
            {printDocument.sections.map((section) => (
              <section key={section.heading} className="proposal-print-section">
                <h2>{section.heading}</h2>
                {section.content
                  .split(/\n+/)
                  .filter(Boolean)
                  .map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
              </section>
            ))}
          </article>,
          document.body,
        )
      : null;

  return (
    <>
      <section className="space-y-5 pb-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl space-y-3">
            <Badge variant="secondary">{t("badge")}</Badge>
            <h1 className="text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl sm:leading-[1.12]">
              {t("title")}
            </h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              {t("description")}
            </p>
          </div>
          <div className="glass rounded-3xl p-4 text-sm leading-6 text-muted-foreground">
            <p className="font-semibold text-foreground">{t("context.title")}</p>
            <p>{context.startupIdea}</p>
            <p>
              {context.industry} / {context.aiModel}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-6">
          <div className="glass space-y-4 rounded-3xl p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("progress.title")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("progress.count", {
                  completed: completedCount,
                  remaining: remainingCount,
                  total: sections.length,
                })}
              </p>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-secondary/45">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <ol className="grid gap-2">
              {sections.map((section, sectionIndex) => {
                const sectionState = getSectionState(workspaceState, section.id);
                const isActive = section.id === activeSection.id;
                const isLocked = sectionIndex > unlockedSectionIndex;

                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      disabled={isLocked}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-2xl border border-transparent p-3 text-left text-sm transition-colors hover:bg-secondary/35",
                        isActive && "border-primary/40 bg-primary/15",
                        isLocked &&
                          "cursor-not-allowed opacity-50 hover:bg-transparent",
                      )}
                      onClick={() => {
                        if (isLocked) {
                          return;
                        }

                        setActiveSectionId(section.id);
                        setError(null);
                      }}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-xs",
                          sectionState.completed &&
                            "border-primary bg-primary text-primary-foreground",
                          isActive &&
                            !sectionState.completed &&
                            "border-primary text-primary",
                        )}
                      >
                        {sectionState.completed ? (
                          <Check aria-hidden="true" className="size-3" />
                        ) : isLocked ? (
                          <Lock aria-hidden="true" className="size-3" />
                        ) : null}
                      </span>
                      <span className="grid min-w-0 gap-0.5">
                        <span className="font-medium leading-5 text-foreground">
                          {section.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isLocked
                            ? headerCopy.locked
                            : sectionState.completed
                            ? t("progress.completed")
                            : isActive
                              ? t("progress.current")
                              : t("progress.remaining")}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>

        <div className="grid gap-5">
          <section className="glass grid gap-4 rounded-3xl p-4 sm:p-5">
            <div data-onboarding="ai-workspace" className="space-y-2">
              <Badge variant="outline">{t("action.layer")}</Badge>
              <h2 className="text-2xl font-semibold leading-tight text-foreground">
                {activeSection.title}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {activeSection.objective}
              </p>
            </div>

            <ContextualHelper>
              {t("contextualTip", { section: activeSection.title })}
            </ContextualHelper>

            {error ? (
              <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
                {error}
              </p>
            ) : null}

            <div className="grid gap-4 rounded-2xl border border-border/70 bg-secondary/30 p-3 sm:p-4">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <UserRound aria-hidden="true" className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {t("action.prompt")}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {t("action.promptHint")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="btn-glass rounded-full"
                        onClick={resetPrompt}
                      >
                        <RotateCcw aria-hidden="true" />
                        {t("action.resetPrompt")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="btn-glass rounded-full"
                        onClick={() =>
                          copyToClipboard(activePrompt, `${activeSection.id}:prompt`)
                        }
                      >
                        <Copy aria-hidden="true" />
                        {copiedKey === `${activeSection.id}:prompt`
                          ? t("copied")
                          : t("action.copyPrompt")}
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    aria-label={t("action.prompt")}
                    className="mt-3 min-h-52 resize-y rounded-2xl bg-background/45 font-mono text-sm leading-6 text-foreground"
                    value={activePrompt}
                    onChange={(event) => updatePrompt("original", event.target.value)}
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      type="button"
                      data-generation-action="original"
                      className="btn-liquid btn-action h-11 w-full justify-center rounded-full px-5 text-primary-foreground sm:w-auto"
                      disabled={isGenerating || !activePrompt.trim()}
                      onClick={() => generateWithGemini("original")}
                    >
                      {isGenerating ? (
                        <Loader2 aria-hidden="true" className="animate-spin" />
                      ) : (
                        <Send aria-hidden="true" />
                      )}
                      {isGenerating
                        ? t("action.generating")
                        : activeState.generationVersions.some(
                              (version) => version.kind === "original",
                            )
                          ? t("action.regeneratePrompt")
                          : t("action.generatePrompt")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <details
              data-onboarding="improve-guide"
              className="rounded-2xl border border-border/70 bg-secondary/20 p-3"
            >
              <summary className="cursor-pointer text-sm font-medium text-foreground">
                {t("learn.title")}
              </summary>
              <div className="mt-3 grid gap-3 text-sm leading-6 text-muted-foreground">
                <p>{t("learn.whyPromptWorks")}</p>
                <p>
                  {t("learn.toolReason", {
                    tool: context.aiModel,
                  })}
                </p>
                <p>
                  {latestReview
                    ? t("learn.comparisonAfterReview")
                    : t("learn.comparisonBeforeReview")}
                </p>
              </div>
            </details>

            <div
              data-onboarding="review-entry"
              data-generation-latest={activeState.originalOutput ? "true" : undefined}
              className="grid gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-3 sm:p-4"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("action.pasteOutput")}
                  </p>
                  {activeState.originalOutput ? (
                    <p className="text-xs leading-5 text-muted-foreground">
                      {t("action.editableOutput")}
                    </p>
                  ) : null}
                </div>
              </div>
              {isGenerating && !activeState.originalOutput ? (
                <div className="grid min-h-40 animate-pulse content-center gap-3 rounded-2xl border border-border/60 bg-background/35 p-4">
                  <div className="h-3 w-4/5 rounded-full bg-muted" />
                  <div className="h-3 w-full rounded-full bg-muted" />
                  <div className="h-3 w-2/3 rounded-full bg-muted" />
                </div>
              ) : activeState.originalOutput ? (
                <Textarea
                  id="ai-output"
                  className="min-h-64 resize-y rounded-2xl bg-background/45 text-sm leading-6 text-foreground"
                  placeholder={t("action.outputPlaceholder")}
                  value={activeState.originalOutput}
                  onChange={(event) =>
                    handleOutputChange("original", event.target.value)
                  }
                />
              ) : (
                <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm leading-6 text-muted-foreground">
                  {t("action.emptyOutput")}
                </p>
              )}
            </div>
          </section>

          {activeState.originalOutput.trim() ? (
            <section className="glass grid gap-4 rounded-3xl p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <Badge variant="outline">{t("review.layer")}</Badge>
                  <h2 className="text-xl font-semibold text-foreground">
                    {t("review.title")}
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("review.description")}
                  </p>
                </div>
                <Button
                  type="button"
                  data-review-action="original"
                  className="btn-liquid h-10 w-full justify-center rounded-full px-4 text-primary-foreground sm:w-auto"
                  disabled={isReviewing}
                  onClick={() =>
                    requestCreditAction({
                      action: "review",
                      label: headerCopy.reviewMyWork,
                      run: () => reviewOutput("original"),
                    })
                  }
                >
                  {isReviewing ? (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  ) : (
                    <RefreshCw aria-hidden="true" />
                  )}
                  {headerCopy.reviewMyWork}
                </Button>
              </div>

              {activeState.originalReview
                ? renderReview({
                    currentOutput: activeState.originalOutput,
                    label: t("review.firstPass"),
                    review: activeState.originalReview,
                  })
                : null}

              {latestReview &&
              !improvedPrompt &&
              !activeState.improvementSkipped ? (
                <div
                  data-onboarding="improve-result"
                  className="grid gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-3"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {headerCopy.improveQuestion}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {headerCopy.creditTooltip}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        type="button"
                        className="btn-liquid h-10 justify-center rounded-full px-4 text-primary-foreground"
                        disabled={isImproving}
                        onClick={() =>
                          requestCreditAction({
                            action: "improvement",
                            label: headerCopy.improvePrompt,
                            run: improvePrompt,
                          })
                        }
                      >
                        {isImproving ? (
                          <Loader2
                            aria-hidden="true"
                            className="animate-spin"
                          />
                        ) : (
                          <Sparkles aria-hidden="true" />
                        )}
                        {headerCopy.improvePrompt}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="btn-glass h-10 justify-center rounded-full px-4"
                        onClick={() =>
                          updateSectionState(activeSection.id, (sectionState) => ({
                            ...sectionState,
                            improvementSkipped: true,
                          }))
                        }
                      >
                        {headerCopy.noContinue}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              {latestReview && improvedPrompt ? (
                <div
                  data-onboarding="improve-result"
                  className="grid gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-3"
                >
                  <p className="text-sm font-medium text-foreground">
                    {t("improvement.title")}
                  </p>
                  {activeState.regressionNotice ? (
                    <p className="rounded-2xl border border-amber-300/40 bg-amber-300/10 px-3 py-2 text-sm leading-6 text-amber-100">
                      {activeState.regressionNotice}
                    </p>
                  ) : null}
                  <p className="text-sm leading-6 text-muted-foreground">
                    {latestReview.whyBetter}
                  </p>
                  <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-border/70 bg-background/35 p-3 text-sm leading-6 text-muted-foreground">
                    {improvedPrompt}
                  </pre>
                  <Button
                    type="button"
                    className="btn-liquid btn-action h-11 w-full justify-center rounded-full px-5 text-primary-foreground sm:w-fit"
                    disabled={!improvedPrompt}
                    onClick={copyImprovedPrompt}
                  >
                    <Copy aria-hidden="true" />
                    {copiedKey === `${activeSection.id}:improved-prompt`
                      ? t("copied")
                      : t("retry.copyImproved")}
                  </Button>
                  <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/35 p-3 sm:grid-cols-2">
                    <p className="text-sm font-medium text-foreground sm:col-span-2">
                      {t("comparison.title")}
                    </p>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        {t("comparison.before")} {t("comparison.prompt")}
                      </p>
                      <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                        {activePrompt}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-primary">
                        {t("comparison.after")} {t("comparison.prompt")}
                      </p>
                      <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-foreground">
                        {retryPrompt}
                      </pre>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground sm:col-span-2">
                      {headerCopy.comparisonWaiting}
                    </p>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {improvedPrompt ? (
            <section className="glass grid gap-4 rounded-3xl p-4 sm:p-5">
              <div className="space-y-2">
                <Badge variant="outline">{t("retry.layer")}</Badge>
                <h2 className="text-xl font-semibold text-foreground">
                  {t("retry.title")}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("retry.description")}
                </p>
              </div>

              <div className="grid gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-3">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <UserRound aria-hidden="true" className="size-4" />
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {t("action.prompt")}
                  </p>
                </div>
                <Textarea
                  aria-label={t("action.prompt")}
                  className="min-h-52 resize-y rounded-2xl bg-background/45 font-mono text-sm leading-6 text-foreground"
                  value={retryPrompt}
                  onChange={(event) => updatePrompt("retry", event.target.value)}
                />
                <div className="flex justify-end">
                  <Button
                    type="button"
                    data-generation-action="retry"
                    className="btn-liquid btn-action h-11 w-full justify-center rounded-full px-5 text-primary-foreground sm:w-auto"
                    disabled={isGenerating || !retryPrompt.trim()}
                    onClick={() => generateWithGemini("retry")}
                  >
                    {isGenerating ? (
                      <Loader2 aria-hidden="true" className="animate-spin" />
                    ) : (
                      <Send aria-hidden="true" />
                    )}
                    {isGenerating ? t("action.generating") : t("retry.generate")}
                  </Button>
                </div>
              </div>

              <div
                data-generation-latest={activeState.retryOutput ? "true" : undefined}
                className="grid gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Bot aria-hidden="true" className="size-4" />
                  </span>
                  <label
                    htmlFor="retry-output"
                    className="text-sm font-medium text-foreground"
                  >
                    {t("retry.pasteOutput")}
                  </label>
                </div>
                {activeState.retryOutput ? (
                  <Textarea
                    id="retry-output"
                    className="min-h-56 resize-y rounded-2xl bg-background/45 text-sm leading-6 text-foreground"
                    placeholder={t("retry.outputPlaceholder")}
                    value={activeState.retryOutput}
                    onChange={(event) =>
                      handleOutputChange("retry", event.target.value)
                    }
                  />
                ) : (
                  <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm leading-6 text-muted-foreground">
                    {t("retry.outputPlaceholder")}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  data-review-action="retry"
                  className="btn-liquid btn-action h-11 w-full justify-center rounded-full px-5 text-primary-foreground sm:w-auto"
                  disabled={isReviewing || !activeState.retryOutput.trim()}
                  onClick={() =>
                    requestCreditAction({
                      action: "review",
                      label: t("retry.rescore"),
                      run: () => reviewOutput("retry"),
                    })
                  }
                >
                  {isReviewing ? (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  ) : (
                    <RefreshCw aria-hidden="true" />
                  )}
                  {isVietnamese ? "Review output tốt hơn" : "Review Better Output"}
                </Button>
              </div>

              {oldScore !== undefined && newScore !== undefined ? (
                <div className="grid gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      {t("retry.oldScore")}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {oldScore}/60
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      {t("retry.newScore")}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {newScore}/60
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      {t("retry.change")}
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-2xl font-semibold",
                        newScore >= oldScore
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-destructive",
                      )}
                    >
                      {newScore - oldScore >= 0 ? "+" : ""}
                      {newScore - oldScore}
                    </p>
                  </div>
                </div>
              ) : null}

              {activeState.retryReview
                ? renderReview({
                    currentOutput: activeState.retryOutput,
                    label: t("review.retryPass"),
                    previousOutput:
                      comparisonBeforeVersion?.output ??
                      activeState.originalOutput,
                    previousReview:
                      comparisonBeforeVersion?.review ??
                      activeState.originalReview,
                    review: activeState.retryReview,
                  })
                : null}

              {activeState.retryReview ? renderImprovementComparison() : null}

              {activeState.retryReview ? (
                <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {headerCopy.improveAgainDescription}
                  </p>
                  <Button
                    type="button"
                    className="btn-liquid h-10 w-full justify-center rounded-full px-4 text-primary-foreground sm:w-auto"
                    disabled={isImproving}
                    onClick={() =>
                      requestCreditAction({
                        action: "improvement",
                        label: headerCopy.improveAgain,
                        run: improvePrompt,
                      })
                    }
                  >
                    {isImproving ? (
                      <Loader2 aria-hidden="true" className="animate-spin" />
                    ) : (
                      <Sparkles aria-hidden="true" />
                    )}
                    {headerCopy.improveAgain}
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}

          {latestReview ? (
            <div className="flex justify-end">
              <Button
                type="button"
                className="btn-liquid h-11 w-full justify-center rounded-full px-5 text-primary-foreground sm:w-auto"
                disabled={!activeState.originalReview}
                onClick={completeSection}
              >
                <Check aria-hidden="true" />
                {headerCopy.updateProposal}
              </Button>
            </div>
          ) : null}

          {activeState.generationVersions.length > 0 ? (
            <section className="glass grid gap-4 rounded-3xl p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <History aria-hidden="true" className="size-4" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {t("history.title")}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {t("history.description")}
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                {[...activeState.generationVersions]
                  .reverse()
                  .map((version, index) => (
                    <article
                      key={version.id}
                      className="rounded-2xl border border-border/70 bg-secondary/25 p-3 sm:p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={index === 0 ? "default" : "outline"}>
                            {version.label}
                          </Badge>
                          <Badge variant="secondary">
                            {version.kind === "retry"
                              ? t("history.retryVersion")
                              : t("history.originalVersion")}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {t("history.generated")} {formatVersionTime(version.createdAt, context.locale)}
                          </span>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            version.review
                              ? getScoreTone(version.review.score.total)
                              : "text-muted-foreground",
                          )}
                        >
                          {version.review
                            ? `${version.review.score.total}/60`
                            : t("history.notReviewed")}
                        </span>
                      </div>
                      <details className="mt-3 border-t border-border/60 pt-3">
                        <summary className="cursor-pointer text-sm font-medium text-foreground">
                          {t("history.prompt")}
                        </summary>
                        <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-5 text-muted-foreground">
                          {version.prompt}
                        </pre>
                      </details>
                      <div className="mt-3 border-t border-border/60 pt-3">
                        <p className="text-sm font-medium text-foreground">
                          {t("history.output")}
                        </p>
                        <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {version.output}
                        </p>
                      </div>
                    </article>
                  ))}
              </div>
            </section>
          ) : null}

          <ProposalBuilder
            sources={proposalBuilderSources}
            workflowRunId={context.workflowRunId}
          />

          <section
            data-onboarding="export"
            className="glass grid gap-4 rounded-3xl p-4 sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText aria-hidden="true" className="size-4" />
                  <h2 className="text-lg font-semibold text-foreground">
                    {headerCopy.exportTitle}
                  </h2>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  {headerCopy.exportDescription}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="btn-glass h-10 justify-center rounded-full px-4"
                  onClick={() =>
                    copyToClipboard(proposalDocument.text, "proposal-draft")
                  }
                >
                  <Copy aria-hidden="true" />
                  {copiedKey === "proposal-draft"
                    ? t("copied")
                    : headerCopy.copyAll}
                </Button>
                <Button
                  type="button"
                  className="btn-liquid h-10 justify-center rounded-full px-4 text-primary-foreground"
                  onClick={() => downloadProposalDraft("txt")}
                >
                  <Download aria-hidden="true" />
                  {headerCopy.downloadTxt}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="btn-glass h-10 justify-center rounded-full px-4"
                  onClick={() => downloadProposalDraft("docx")}
                >
                  <Download aria-hidden="true" />
                  {headerCopy.downloadDocx}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="btn-glass h-10 justify-center rounded-full px-4"
                  onClick={() => downloadProposalDraft("pdf")}
                >
                  <Download aria-hidden="true" />
                  {headerCopy.downloadPdf}
                </Button>
              </div>
            </div>
            <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-border/70 bg-secondary/30 p-3 text-sm leading-6 text-muted-foreground">
              {proposalDocument.text}
            </pre>
          </section>
        </div>
      </section>

      {printableProposal}

      {pendingCreditAction ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-3xl p-5">
            <div className="space-y-3">
              <Badge variant="secondary">{pendingCreditAction.label}</Badge>
              <h2 className="text-xl font-semibold leading-tight text-foreground">
                {headerCopy.creditConfirm}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {headerCopy.creditRemainingAfter}: {pendingRemainingAfter} credits
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                data-credit-confirm="true"
                className="btn-liquid h-10 flex-1 rounded-full text-primary-foreground"
                onClick={confirmCreditAction}
              >
                {headerCopy.confirm}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-glass h-10 flex-1 rounded-full"
                onClick={() => setPendingCreditAction(null)}
              >
                {headerCopy.cancel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isUpgradeOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="glass w-full max-w-md rounded-3xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <Badge variant="secondary">{t("upgrade.badge")}</Badge>
                <h2 className="text-2xl font-semibold leading-tight text-foreground">
                  {t("upgrade.title")}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("upgrade.description")}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-secondary/45"
                onClick={() => setIsUpgradeOpen(false)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-4 grid gap-2 rounded-2xl border border-border/70 bg-secondary/30 p-3 text-sm leading-6 text-muted-foreground">
              <p>{t("upgrade.reviewUsage", { count: usage.review })}</p>
              <p>{t("upgrade.improvementUsage", { count: usage.improvement })}</p>
              <p className="font-medium text-foreground">
                {t("upgrade.proOffer")}
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="btn-liquid h-10 flex-1 rounded-full text-primary-foreground">
                <Link href="/checkout">{t("upgrade.checkout")}</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="btn-glass h-10 flex-1 rounded-full"
                onClick={() => setIsUpgradeOpen(false)}
              >
                {t("upgrade.later")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
