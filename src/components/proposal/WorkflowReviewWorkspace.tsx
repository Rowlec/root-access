"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Check,
  Copy,
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

type OutputReview = {
  frameworkChecks: readonly string[];
  frameworkTitle: string;
  improvedPrompt: string;
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
  whyBetter: string;
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
  originalOutput: string;
  originalPrompt: string;
  originalReview: OutputReview | null;
  retryOutput: string;
  retryReview: OutputReview | null;
  reviewHistory: ReviewHistoryEntry[];
};

type WorkspaceState = Partial<Record<ProposalSectionId, SectionState>>;

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
  originalOutput: "",
  originalPrompt: "",
  originalReview: null,
  retryOutput: "",
  retryReview: null,
  reviewHistory: [],
};

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
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<CreditPlan>(() => readCreditPlan());
  const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
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
  const remainingCount = Math.max(sections.length - completedCount, 0);
  const completionPercentage = Math.round(
    (completedCount / sections.length) * 100,
  );
  const latestReview = activeState.retryReview ?? activeState.originalReview;
  const improvedPrompt = latestReview?.improvedPrompt ?? "";
  const oldScore = activeState.originalReview?.score.total;
  const newScore = activeState.retryReview?.score.total;
  const scoreTimeline = activeState.reviewHistory.map(
    (entry) => entry.review.score.total,
  );
  const paidCreditRemaining =
    plan === "free" ? null : getRemaining("review");

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
            deadlineUrgency: context.deadlineUrgency,
            industry: context.industry,
            startupIdea: context.startupIdea,
            targetCustomer: context.targetCustomer,
          },
          originalPrompt: promptForReview,
          output,
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

      if (!review?.score || !review.improvedPrompt) {
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
      updateSectionState(activeSection.id, (sectionState) => ({
        ...sectionState,
        improvedPromptCopied: false,
        originalReview:
          kind === "original" ? review : sectionState.originalReview,
        retryReview: kind === "retry" ? review : sectionState.retryReview,
        reviewHistory: [...sectionState.reviewHistory, historyEntry],
      }));
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

  function handleOutputChange(kind: "original" | "retry", value: string) {
    const wasEmpty =
      kind === "original"
        ? !activeState.originalOutput.trim()
        : !activeState.retryOutput.trim();
    const isNowFilled = value.trim().length > 0;

    updateSectionState(activeSection.id, (sectionState) => ({
      ...sectionState,
      completed: false,
      originalOutput:
        kind === "original" ? value : sectionState.originalOutput,
      originalReview:
        kind === "original" ? null : sectionState.originalReview,
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
    }
  }

  async function copyImprovedPrompt() {
    if (!improvedPrompt) {
      return;
    }

    if (!activeState.improvedPromptCopied && !canUse("improvement")) {
      setError(t("credits.limits.improvement"));
      setIsUpgradeOpen(true);
      return;
    }

    await copyToClipboard(improvedPrompt, `${activeSection.id}:improved-prompt`);

    if (!activeState.improvedPromptCopied) {
      recordUse("improvement");
      updateSectionState(activeSection.id, (sectionState) => ({
        ...sectionState,
        improvedPromptCopied: true,
      }));
    }
  }

  function renderReview(review: OutputReview, label: string) {
    const score = review.score;
    const dimensions = [
      "relevance",
      "specificity",
      "clarity",
      "actionability",
    ] as const;

    return (
      <div className="grid gap-4 rounded-lg border border-border bg-background p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
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

        <div className="grid gap-2 sm:grid-cols-2">
          {dimensions.map((dimension) => (
            <div
              key={dimension}
              className="rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {t(`review.dimensions.${dimension}`)}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {score.breakdown[dimension].score}/10
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {score.breakdown[dimension].reason}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-sm font-medium text-foreground">
            {t("review.weaknesses")}
          </p>
          <ol className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
            {review.weaknesses.map((weakness, index) => (
              <li key={weakness}>
                {index + 1}. {weakness}
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="space-y-5 border-b border-border pb-7">
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
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm leading-6 text-muted-foreground">
            <p className="font-medium text-foreground">{t("context.title")}</p>
            <p>{context.startupIdea}</p>
            <p>
              {context.industry} / {context.aiModel}
            </p>
          </div>
        </div>

        <div className="grid gap-3 rounded-lg border border-border bg-background p-4 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {t("credits.plan")}
            </p>
            <p className="mt-1 text-lg font-semibold text-foreground">
              {t(`credits.${plan}`)}
            </p>
          </div>
          {plan === "free" ? (
            <>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {t("credits.outputReviews")}
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {getRemaining("review")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {t("credits.improvedPrompts")}
                </p>
                <p className="mt-1 text-lg font-semibold text-foreground">
                  {getRemaining("improvement")}
                </p>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {t("credits.paidCredits")}
              </p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {paidCreditRemaining}
              </p>
            </div>
          )}
          <div className="flex items-end justify-between gap-3">
            <Button
              asChild
              type="button"
              variant="ghost"
              size="sm"
              className="hover:bg-muted"
            >
              <Link href="/dashboard">
                <BarChart3 aria-hidden="true" />
                {t("credits.dashboard")}
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUpgradeOpen(true)}
            >
              {t("credits.upgrade")}
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[18rem_1fr] lg:items-start">
        <aside className="lg:sticky lg:top-6">
          <div className="space-y-4 rounded-lg border border-border bg-background p-4 shadow-sm">
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
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <ol className="grid gap-2">
              {sections.map((section) => {
                const sectionState = getSectionState(workspaceState, section.id);
                const isActive = section.id === activeSection.id;

                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border border-transparent p-2 text-left text-sm transition-colors hover:bg-muted/50",
                        isActive && "border-border bg-muted/50",
                      )}
                      onClick={() => {
                        setActiveSectionId(section.id);
                        setError(null);
                      }}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border text-xs",
                          sectionState.completed &&
                            "border-emerald-600 bg-emerald-600 text-white",
                          isActive &&
                            !sectionState.completed &&
                            "border-foreground",
                        )}
                      >
                        {sectionState.completed ? (
                          <Check aria-hidden="true" className="size-3" />
                        ) : null}
                      </span>
                      <span className="grid min-w-0 gap-0.5">
                        <span className="font-medium leading-5 text-foreground">
                          {section.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {sectionState.completed
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
          <section className="grid gap-4 rounded-lg border border-border bg-background p-4 shadow-sm sm:p-5">
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
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
                {error}
              </p>
            ) : null}

            <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3">
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
                    className="h-10 justify-center"
                    onClick={generatePrompt}
                  >
                    <Sparkles aria-hidden="true" />
                    {activeState.originalPrompt
                      ? t("action.regeneratePrompt")
                      : t("action.generatePrompt")}
                  </Button>
                  <Button
                    type="button"
                    className="h-10 justify-center"
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
              <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-sm leading-6 text-muted-foreground">
                {activePrompt}
              </pre>
            </div>

            <details className="rounded-lg border border-border bg-background p-3">
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
                className="min-h-52 resize-y rounded-lg bg-muted/30 text-sm leading-6 text-foreground"
                placeholder={t("action.outputPlaceholder")}
                value={activeState.originalOutput}
                onChange={(event) =>
                  handleOutputChange("original", event.target.value)
                }
              />
            </div>
          </section>

          {activeState.originalOutput.trim() ? (
            <section className="grid gap-4 rounded-lg border border-border bg-background p-4 shadow-sm sm:p-5">
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
                  className="h-10 w-full justify-center sm:w-auto"
                  disabled={isReviewing}
                  onClick={() => reviewOutput("original")}
                >
                  {isReviewing ? (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  ) : (
                    <RefreshCw aria-hidden="true" />
                  )}
                  {t("review.action")}
                </Button>
              </div>

              {activeState.originalReview
                ? renderReview(activeState.originalReview, t("review.firstPass"))
                : null}

              {latestReview ? (
                <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm font-medium text-foreground">
                    {t("improvement.title")}
                  </p>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {latestReview.whyBetter}
                  </p>
                  <pre className="max-h-72 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-background p-3 text-sm leading-6 text-muted-foreground">
                    {latestReview.improvedPrompt}
                  </pre>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-full justify-center sm:w-fit"
                    disabled={!improvedPrompt}
                    onClick={copyImprovedPrompt}
                  >
                    <Copy aria-hidden="true" />
                    {copiedKey === `${activeSection.id}:improved-prompt`
                      ? t("copied")
                      : t("retry.copyImproved")}
                  </Button>
                </div>
              ) : null}
            </section>
          ) : null}

          {improvedPrompt ? (
            <section className="grid gap-4 rounded-lg border border-border bg-background p-4 shadow-sm sm:p-5">
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
                  className="min-h-44 resize-y rounded-lg bg-muted/30 text-sm leading-6 text-foreground"
                  placeholder={t("retry.outputPlaceholder")}
                  value={activeState.retryOutput}
                  onChange={(event) =>
                    handleOutputChange("retry", event.target.value)
                  }
                />
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="h-10 w-full justify-center sm:w-auto"
                  disabled={isReviewing || !activeState.retryOutput.trim()}
                  onClick={() => reviewOutput("retry")}
                >
                  {isReviewing ? (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  ) : (
                    <RefreshCw aria-hidden="true" />
                  )}
                  {t("retry.rescore")}
                </Button>
                <Button
                  type="button"
                  className="h-10 w-full justify-center sm:w-auto"
                  disabled={!activeState.originalReview}
                  onClick={completeSection}
                >
                  <Check aria-hidden="true" />
                  {t("retry.complete")}
                </Button>
              </div>

              {oldScore !== undefined && newScore !== undefined ? (
                <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-3 sm:grid-cols-3">
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
                ? renderReview(activeState.retryReview, t("review.retryPass"))
                : null}
            </section>
          ) : null}

          {activeState.reviewHistory.length > 0 ? (
            <section className="grid gap-4 rounded-lg border border-border bg-background p-4 shadow-sm sm:p-5">
              <div className="flex items-center gap-2">
                <History aria-hidden="true" className="size-4" />
                <h2 className="text-lg font-semibold text-foreground">
                  {t("history.title")}
                </h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm font-medium text-foreground">
                    {t("history.promptVersions")}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {["v1", ...activeState.reviewHistory.map((_, index) => `v${index + 2}`)].join(
                      " -> ",
                    )}
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
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
                <div className="rounded-lg border border-border bg-muted/30 p-3">
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
        </div>
      </section>

      {isUpgradeOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-background p-5 shadow-lg">
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
                className="hover:bg-muted"
                onClick={() => setIsUpgradeOpen(false)}
              >
                <X aria-hidden="true" />
              </Button>
            </div>
            <div className="mt-4 grid gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm leading-6 text-muted-foreground">
              <p>{t("upgrade.reviewUsage", { count: usage.review })}</p>
              <p>{t("upgrade.improvementUsage", { count: usage.improvement })}</p>
              <p className="font-medium text-foreground">
                {t("upgrade.proOffer")}
              </p>
            </div>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="h-10 flex-1">
                <Link href="/checkout">{t("upgrade.checkout")}</Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 flex-1"
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
