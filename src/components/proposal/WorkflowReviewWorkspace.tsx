"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Copy,
  Download,
  FileText,
  Lock,
  History,
  Loader2,
  RefreshCw,
  Sparkles,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";

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
  improvedPrompt?: string;
  score: {
    breakdown: {
      actionability: ScoreDimensionResult;
      clarity: ScoreDimensionResult;
      relevance: ScoreDimensionResult;
      specificity: ScoreDimensionResult;
    };
    explanation: string;
    total: number;
  };
  weaknesses: string[];
  whyBetter?: string;
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

type SectionState = {
  completed: boolean;
  improvedPromptCopied: boolean;
  improvementSkipped: boolean;
  originalOutput: string;
  originalPrompt: string;
  originalReview: OutputReview | null;
  regressionNotice: string;
  retryOutput: string;
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
  improvedPromptCopied: false,
  improvementSkipped: false,
  originalOutput: "",
  originalPrompt: "",
  originalReview: null,
  regressionNotice: "",
  retryOutput: "",
  retryReview: null,
  reviewHistory: [],
};

const scoreDimensionIds = [
  "relevance",
  "specificity",
  "clarity",
  "actionability",
] as const;

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
  return {
    ...emptySectionState,
    ...(workspaceState[sectionId] ?? {}),
    reviewHistory: workspaceState[sectionId]?.reviewHistory ?? [],
  };
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
      review.score.total >= 24
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
  if (score >= 32) {
    return "text-emerald-700 dark:text-emerald-300";
  }

  if (score >= 24) {
    return "text-amber-700 dark:text-amber-300";
  }

  return "text-destructive";
}

function getDimensionScoreTone(score: number) {
  if (score >= 9) {
    return "text-emerald-700 dark:text-emerald-300";
  }

  if (score >= 7) {
    return "text-yellow-700 dark:text-yellow-300";
  }

  if (score >= 4) {
    return "text-orange-700 dark:text-orange-300";
  }

  return "text-destructive";
}

function getDimensionScoreBar(score: number) {
  if (score >= 9) {
    return "bg-emerald-600";
  }

  if (score >= 7) {
    return "bg-yellow-500";
  }

  if (score >= 4) {
    return "bg-orange-500";
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
  const [workspaceState, setWorkspaceState] = useState<WorkspaceState>(() =>
    readWorkspaceState(context.workflowRunId),
  );
  const [activeSectionId, setActiveSectionId] =
    useState<ProposalSectionId>("problem");
  const [isReviewing, setIsReviewing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
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
  const oldScore = activeState.originalReview?.score.total;
  const newScore = activeState.retryReview?.score.total;
  const scoreTimeline = activeState.reviewHistory.map(
    (entry) => entry.review.score.total,
  );
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
    comparisonImproved: isVietnamese ? "Đã cải thiện" : "Improved",
    comparisonStillWeak: isVietnamese ? "Vẫn yếu" : "Still weak",
    comparisonTitle: isVietnamese
      ? "So sánh prompt trước/sau"
      : "Before/after prompt comparison",
    comparisonWaiting: isVietnamese
      ? "Paste output từ improved prompt để thấy điểm sau."
      : "Paste output from the improved prompt to see the after score.",
    confirm: isVietnamese ? "Xác nhận" : "Confirm",
    copyAll: isVietnamese ? "Copy tất cả" : "Copy all",
    downloadDocx: isVietnamese ? "Tải DOCX" : "Download DOCX",
    downloadPdf: isVietnamese ? "Xuất PDF" : "Export PDF",
    downloadTxt: isVietnamese ? "Tải .txt" : "Download .txt",
    exportDescription: isVietnamese
      ? "Xuất bản proposal sạch, bỏ markdown và lời thoại AI để dùng như tài liệu nộp bài."
      : "Export a clean proposal without markdown or AI chatter, ready for submission formatting.",
    exportTitle: isVietnamese ? "Xuất Startup Proposal" : "Export Startup Proposal",
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

  useEffect(() => {
    try {
      window.localStorage.setItem(
        getStorageKey(context.workflowRunId),
        JSON.stringify(workspaceState),
      );
    } catch {
      return;
    }
  }, [context.workflowRunId, workspaceState]);

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

  function generatePrompt() {
    if (!canUse("generation")) {
      setError(t("credits.limits.generation"));
      setIsUpgradeOpen(true);
      return;
    }

    const prompt = createInitialPrompt({
      context,
      section: activeSection,
    });

    recordUse("generation");
    setError(null);
    updateSectionState(activeSection.id, (sectionState) => ({
      ...sectionState,
      originalPrompt: prompt,
    }));
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
    const promptForReview = kind === "retry" && improvedPrompt
      ? improvedPrompt
      : activePrompt;

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
            kind === "retry" ? activeState.originalOutput.trim() : undefined,
          previousScore: activeState.originalReview?.score.total,
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

        return {
          ...sectionState,
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
          kind === "retry" && activeState.originalReview
            ? review.score.total - activeState.originalReview.score.total
            : undefined,
        previousScore: activeState.originalReview?.score.total,
        promptLabel: historyLabel,
        score: review.score.total,
        type: kind === "retry" ? "retry_completed" : "review_completed",
        weaknesses: review.weaknesses,
      });

      if (
        kind === "retry" &&
        activeState.originalReview &&
        review.score.total < activeState.originalReview.score.total
      ) {
        await repairRegressedPrompt(review);
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
      activeState.retryReview && improvedPrompt ? improvedPrompt : activePrompt;

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

  async function repairRegressedPrompt(regressedReview: OutputReview) {
    const baselineScore = activeState.originalReview?.score.total;
    const sourceOutput = activeState.retryOutput.trim();

    if (
      baselineScore === undefined ||
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
    const wasEmpty =
      kind === "original"
        ? !activeState.originalOutput.trim()
        : !activeState.retryOutput.trim();
    const isNowFilled = value.trim().length > 0;

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
      retryReview: kind === "retry" ? null : sectionState.retryReview,
    }));

    if (wasEmpty && isNowFilled) {
      logIntelligenceEvent({
        type: "output_pasted",
      });
    }
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
            {score.total}/40
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
              <pre className="mt-3 max-h-36 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-border/60 bg-background/35 p-3 text-xs leading-5 text-muted-foreground">
                {currentOutput}
              </pre>
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
            <pre className="mt-3 max-h-36 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-border/60 bg-background/35 p-3 text-xs leading-5 text-muted-foreground">
              {currentOutput}
            </pre>
          </div>
        )}

        <div className="grid gap-2 sm:grid-cols-2">
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
                {previousReview?.score.total ?? "--"}/40
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {headerCopy.comparisonAfter}
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {score.total}/40
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

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-emerald-300/30 bg-emerald-300/10 p-3">
            <p className="text-sm font-medium text-foreground">
              {hasPrevious
                ? isVietnamese
                  ? "Điểm đã tốt hơn"
                  : "Strengths improved"
                : isVietnamese
                  ? "Điểm mạnh hiện tại"
                  : "Current strengths"}
            </p>
            <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
              {coach.strengthsImproved.map((strength) => (
                <li key={strength}>✓ {strength}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3">
            <p className="text-sm font-medium text-foreground">
              {isVietnamese ? "Điểm vẫn yếu" : "Remaining weaknesses"}
            </p>
            <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
              {coach.remainingWeaknesses.map((weakness) => (
                <li key={weakness}>• {weakness}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
            <p className="text-sm font-medium text-foreground">
              {isVietnamese ? "AI Coach gợi ý" : "AI Coach recommendation"}
            </p>
            <ol className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
              {coach.recommendations.map((recommendation, index) => (
                <li key={recommendation}>
                  {index + 1}. {recommendation}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
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
            <div className="space-y-2">
              <Badge variant="outline">{t("action.layer")}</Badge>
              <h2 className="text-2xl font-semibold leading-tight text-foreground">
                {activeSection.title}
              </h2>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                {activeSection.objective}
              </p>
            </div>

            {error ? (
              <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
                {error}
              </p>
            ) : null}

            <div className="grid gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("action.prompt")}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {t("action.promptHint")}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    className="btn-glass h-10 justify-center rounded-full px-4"
                    onClick={generatePrompt}
                  >
                    <Sparkles aria-hidden="true" />
                    {activeState.originalPrompt
                      ? t("action.regeneratePrompt")
                      : t("action.generatePrompt")}
                  </Button>
                  <Button
                    type="button"
                    className="btn-liquid h-10 justify-center rounded-full px-4 text-primary-foreground"
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
              <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-border/70 bg-background/35 p-3 text-sm leading-6 text-muted-foreground">
                {activePrompt}
              </pre>
            </div>

            <details className="rounded-2xl border border-border/70 bg-secondary/20 p-3">
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

            <div className="grid gap-2">
              <label
                htmlFor="ai-output"
                className="text-sm font-medium text-foreground"
              >
                {t("action.pasteOutput")}
              </label>
              <Textarea
                id="ai-output"
                className="min-h-52 resize-y rounded-2xl bg-background/35 text-sm leading-6 text-foreground"
                placeholder={t("action.outputPlaceholder")}
                value={activeState.originalOutput}
                onChange={(event) =>
                  handleOutputChange("original", event.target.value)
                }
              />
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
                <div className="grid gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-3">
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
                <div className="grid gap-3 rounded-2xl border border-border/70 bg-secondary/30 p-3">
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
                    variant="outline"
                    className="btn-glass h-10 w-full justify-center rounded-full px-4 sm:w-fit"
                    disabled={!improvedPrompt}
                    onClick={copyImprovedPrompt}
                  >
                    <Copy aria-hidden="true" />
                    {copiedKey === `${activeSection.id}:improved-prompt`
                      ? t("copied")
                      : t("retry.copyImproved")}
                  </Button>
                  <div className="grid gap-3 rounded-2xl border border-border/70 bg-background/35 p-3 sm:grid-cols-3">
                    <p className="text-sm font-medium text-foreground sm:col-span-3">
                      {headerCopy.comparisonTitle}
                    </p>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        {headerCopy.comparisonBefore}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {activeState.originalReview?.score.total ?? "--"}/40
                      </p>
                      <ul className="mt-2 grid gap-1 text-sm leading-6 text-muted-foreground">
                        {(activeState.originalReview?.weaknesses ?? []).map(
                          (weakness) => (
                            <li key={weakness}>- {weakness}</li>
                          ),
                        )}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        {headerCopy.comparisonAfter}
                      </p>
                      <p className="mt-1 text-2xl font-semibold text-foreground">
                        {activeState.retryReview?.score.total !== undefined
                          ? `${activeState.retryReview.score.total}/40`
                          : "--/40"}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {activeState.retryReview
                          ? `${activeState.originalReview?.score.total ?? "--"} -> ${activeState.retryReview.score.total}`
                          : headerCopy.comparisonWaiting}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        {activeState.retryReview
                          ? headerCopy.comparisonStillWeak
                          : headerCopy.comparisonImproved}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {activeState.retryReview
                          ? activeState.retryReview.weaknesses.join("; ")
                          : latestReview.whyBetter}
                      </p>
                    </div>
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

              <div className="grid gap-2">
                <label
                  htmlFor="retry-output"
                  className="text-sm font-medium text-foreground"
                >
                  {t("retry.pasteOutput")}
                </label>
                <Textarea
                  id="retry-output"
                  className="min-h-44 resize-y rounded-2xl bg-background/35 text-sm leading-6 text-foreground"
                  placeholder={t("retry.outputPlaceholder")}
                  value={activeState.retryOutput}
                  onChange={(event) =>
                    handleOutputChange("retry", event.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  variant="outline"
                  className="btn-glass h-10 w-full justify-center rounded-full px-4 sm:w-auto"
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
                      {oldScore}/40
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase text-muted-foreground">
                      {t("retry.newScore")}
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">
                      {newScore}/40
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
                    previousOutput: activeState.originalOutput,
                    previousReview: activeState.originalReview,
                    review: activeState.retryReview,
                  })
                : null}
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

          {activeState.reviewHistory.length > 1 ? (
            <section className="glass grid gap-4 rounded-3xl p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <History aria-hidden="true" className="size-4" />
                <h2 className="text-lg font-semibold text-foreground">
                  {t("history.title")}
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3">
                  <p className="text-sm font-medium text-foreground">
                    {t("history.promptVersions")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {activeState.reviewHistory
                      .map((entry) => entry.label)
                      .join(" -> ")}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3">
                  <p className="text-sm font-medium text-foreground">
                    {t("history.outputHistory")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {activeState.reviewHistory
                      .map(
                        (entry, index) =>
                          `${t("history.output")} ${index + 1}: ${entry.review.score.total}/40`,
                      )
                      .join(" -> ")}
                  </p>
                </div>
                <div className="rounded-2xl border border-border/70 bg-secondary/30 p-3">
                  <p className="text-sm font-medium text-foreground">
                    {t("history.timeline")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {scoreTimeline.join(" -> ")}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="glass grid gap-4 rounded-3xl p-4 sm:p-5">
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
