"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  Copy,
  GitCompareArrows,
  Lightbulb,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useCreditUsage } from "@/hooks/useCreditUsage";
import type { RefinementHistoryEntry } from "@/hooks/useWorkflowProgress";
import type { WorkflowStep } from "../../../types";

type StepCardProps = {
  checkedQualityItems: number[];
  step: WorkflowStep;
  canComplete: boolean;
  hasOutputDraft: boolean;
  hasPromptEdit: boolean;
  isCompleted: boolean;
  outputDraft: string;
  promptDraft: string;
  refinementHistory: RefinementHistoryEntry[];
  onCheckedQualityItemsChange: (checkedItems: number[]) => void;
  onCompletedChange: (isCompleted: boolean) => void;
  onOutputDraftChange: (outputDraft: string) => void;
  onOutputDraftReset: () => void;
  onPromptDraftChange: (promptDraft: string) => void;
  onPromptDraftReset: () => void;
  onRefinementHistoryAdd: (
    refinement: Omit<RefinementHistoryEntry, "id" | "createdAt">,
  ) => void;
};

const revealMotion = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.18 },
};

type CoachSignal =
  | "missingOutput"
  | "tooShort"
  | "tooBroad"
  | "missingEvidence"
  | "tooLong"
  | "checklistIncomplete"
  | "ready";
type CoachRecommendation = "generate" | "refine" | "review" | "continue";
type CoachNextAction =
  | "generate"
  | "addSpecifics"
  | "narrowAssumption"
  | "addEvidence"
  | "shorten"
  | "finishReview"
  | "continue";

const broadAssumptionPattern =
  /\b(everyone|all users|all people|people|customers|students|users|anyone|general public)\b/i;
const evidencePattern =
  /\b(ask|evidence|interview|measure|research|signal|source|survey|test|validate|verify)\b/i;
const evidenceStepPattern =
  /\b(assumption|competitor|evidence|fact|market|pricing|research|revenue|validate|validation|willingness)\b/i;

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function getCoachSignals({
  hasQualityChecklist,
  isQualityChecklistComplete,
  outputDraft,
  step,
}: {
  hasQualityChecklist: boolean;
  isQualityChecklistComplete: boolean;
  outputDraft: string;
  step: WorkflowStep;
}) {
  const trimmedOutput = outputDraft.trim();
  const signals: CoachSignal[] = [];

  if (!trimmedOutput) {
    return ["missingOutput"] satisfies CoachSignal[];
  }

  if (countWords(trimmedOutput) < 35) {
    signals.push("tooShort");
  }

  if (broadAssumptionPattern.test(trimmedOutput)) {
    signals.push("tooBroad");
  }

  if (
    evidenceStepPattern.test(`${step.title} ${step.goal}`) &&
    !evidencePattern.test(trimmedOutput)
  ) {
    signals.push("missingEvidence");
  }

  if (trimmedOutput.length > 2400) {
    signals.push("tooLong");
  }

  if (hasQualityChecklist && !isQualityChecklistComplete) {
    signals.push("checklistIncomplete");
  }

  return signals.length > 0 ? signals.slice(0, 3) : (["ready"] satisfies CoachSignal[]);
}

function getCoachRecommendation(signals: CoachSignal[]): CoachRecommendation {
  if (signals.includes("missingOutput")) {
    return "generate";
  }

  if (
    signals.some((signal) =>
      ["tooShort", "tooBroad", "missingEvidence", "tooLong"].includes(signal),
    )
  ) {
    return "refine";
  }

  if (signals.includes("checklistIncomplete")) {
    return "review";
  }

  return "continue";
}

function getCoachNextAction(signals: CoachSignal[]): CoachNextAction {
  if (signals.includes("missingOutput")) {
    return "generate";
  }

  if (signals.includes("tooBroad")) {
    return "narrowAssumption";
  }

  if (signals.includes("missingEvidence")) {
    return "addEvidence";
  }

  if (signals.includes("tooShort")) {
    return "addSpecifics";
  }

  if (signals.includes("tooLong")) {
    return "shorten";
  }

  if (signals.includes("checklistIncomplete")) {
    return "finishReview";
  }

  return "continue";
}

export function StepCard({
  checkedQualityItems,
  step,
  canComplete,
  hasOutputDraft,
  hasPromptEdit,
  isCompleted,
  outputDraft,
  promptDraft,
  refinementHistory,
  onCheckedQualityItemsChange,
  onCompletedChange,
  onOutputDraftChange,
  onOutputDraftReset,
  onPromptDraftChange,
  onPromptDraftReset,
  onRefinementHistoryAdd,
}: StepCardProps) {
  const t = useTranslations("StepCard");
  const [isPromptExpanded, setIsPromptExpanded] = useState(false);
  const [isLearnExpanded, setIsLearnExpanded] = useState(false);
  const [isCoachExpanded, setIsCoachExpanded] = useState(false);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [refinementFeedback, setRefinementFeedback] = useState("");
  const { canUse, getRemaining, recordUse } = useCreditUsage();
  const originalTool = step.originalTool ?? step.tool;
  const adaptedTool = step.adaptedTool;
  const qualityChecklist = step.qualityChecklist ?? [];
  const hasQualityChecklist = qualityChecklist.length > 0;
  const allQualityItemIndexes = qualityChecklist.map((_, index) => index);
  const visibleCheckedQualityItems = isCompleted
    ? allQualityItemIndexes
    : checkedQualityItems;
  const isQualityChecklistComplete =
    hasQualityChecklist &&
    visibleCheckedQualityItems.length === qualityChecklist.length;
  const hasToolAdaptation = Boolean(
    adaptedTool && adaptedTool !== originalTool,
  );
  const hasLearnContent = Boolean(
    step.promptComparison || step.promptAssist || step.toolRecommendation,
  );
  const isLocked = !canComplete && !isCompleted;
  const canMarkComplete =
    canComplete &&
    hasOutputDraft &&
    (!hasQualityChecklist || isQualityChecklistComplete);
  const coachSignals = getCoachSignals({
    hasQualityChecklist,
    isQualityChecklistComplete,
    outputDraft,
    step,
  });
  const coachRecommendation = getCoachRecommendation(coachSignals);
  const coachNextAction = getCoachNextAction(coachSignals);

  if (isCompleted && !isCompletedExpanded) {
    return (
      <Card className="rounded-lg py-5 shadow-sm transition-shadow hover:shadow-md">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <Badge variant="outline">
                  {t("stepBadge", { step: step.id })}
                </Badge>
                <Badge variant="default" className="h-6 rounded-lg px-2">
                  {t("status.complete")}
                </Badge>
                <span className="text-sm font-medium text-muted-foreground">
                  {adaptedTool ?? originalTool}
                </span>
              </div>
              <CardTitle className="line-clamp-2 text-lg leading-tight">
                {step.title}
              </CardTitle>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-center sm:w-auto"
              onClick={() => setIsCompletedExpanded(true)}
            >
              <ChevronDown aria-hidden="true" />
              {t("completedSummary.review")}
            </Button>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              {t("completedSummary.outputPreview")}
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {outputDraft}
            </p>
          </div>
        </CardHeader>
      </Card>
    );
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(promptDraft);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 1600);
  }

  function applyGeneratedOutput(nextOutputDraft: string) {
    onOutputDraftChange(nextOutputDraft);

    if (isCompleted) {
      onCheckedQualityItemsChange([]);
      onCompletedChange(false);
    }
  }

  async function executeWithGemini(feedback?: string) {
    const trimmedFeedback = feedback?.trim();
    const creditAction = trimmedFeedback ? "refinement" : "generation";

    if (!canUse(creditAction)) {
      setGenerationError(t(`credits.limits.${creditAction}`));
      return;
    }

    setGenerationError(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/gemini/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: promptDraft,
          previousOutput: trimmedFeedback ? outputDraft : undefined,
          feedback: trimmedFeedback || undefined,
        }),
      });
      const data = (await response.json()) as {
        output?: unknown;
        message?: unknown;
      };

      if (!response.ok) {
        throw new Error(
          typeof data.message === "string"
            ? data.message
            : t("execution.error"),
        );
      }

      if (typeof data.output !== "string" || data.output.trim().length === 0) {
        throw new Error(t("execution.empty"));
      }

      const nextOutput = data.output.trim();

      recordUse(creditAction);
      applyGeneratedOutput(nextOutput);

      if (trimmedFeedback) {
        onRefinementHistoryAdd({
          feedback: trimmedFeedback,
          output: nextOutput,
        });
        setRefinementFeedback("");
      }
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : t("execution.error"),
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function handleOutputDraftChange(nextOutputDraft: string) {
    onOutputDraftChange(nextOutputDraft);

    if (nextOutputDraft.trim().length === 0 && isCompleted) {
      onCheckedQualityItemsChange([]);
      onCompletedChange(false);
    }
  }

  function handleOutputDraftReset() {
    onOutputDraftReset();

    if (isCompleted) {
      onCheckedQualityItemsChange([]);
      onCompletedChange(false);
    }
  }

  function handleQualityChecklistChange(index: number, isChecked: boolean) {
    const currentCheckedItems = isCompleted
      ? allQualityItemIndexes
      : checkedQualityItems;
    const nextCheckedItems = isChecked
      ? Array.from(new Set([...currentCheckedItems, index]))
      : currentCheckedItems.filter((item) => item !== index);
    const nextIsComplete =
      nextCheckedItems.length === qualityChecklist.length;

    onCheckedQualityItemsChange(nextCheckedItems);

    if (canComplete && hasOutputDraft && nextIsComplete && !isCompleted) {
      setIsCompletedExpanded(false);
      onCompletedChange(true);
      return;
    }

    if (!nextIsComplete && isCompleted) {
      onCompletedChange(false);
    }
  }

  function handleCompletedChange(isNextCompleted: boolean) {
    if (!isNextCompleted) {
      onCheckedQualityItemsChange([]);
      onCompletedChange(false);
      return;
    }

    if (canMarkComplete) {
      setIsCompletedExpanded(false);
      onCompletedChange(true);
    }
  }

  return (
    <Card className="rounded-lg py-5 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Badge variant="outline">{t("stepBadge", { step: step.id })}</Badge>
            {step.timebox ? (
              <Badge variant="secondary" className="h-6 rounded-lg px-2">
                {step.timebox}
              </Badge>
            ) : null}
            <Badge
              variant={isCompleted ? "default" : "secondary"}
              className="h-6 rounded-lg px-2"
            >
              {isCompleted
                ? t("status.complete")
                : isLocked
                  ? t("status.locked")
                  : t("status.current")}
            </Badge>
          </div>

          {hasToolAdaptation ? (
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {originalTool}
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-3.5 text-muted-foreground"
              />
              <span className="font-medium text-foreground">{adaptedTool}</span>
            </div>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {originalTool}
            </span>
          )}
        </div>

        <div className="space-y-2">
          <CardTitle className="text-xl leading-tight">{step.title}</CardTitle>
          <CardDescription className="text-base leading-7">
            {step.goal}
          </CardDescription>
          {isLocked ? (
            <p className="text-sm text-muted-foreground">
              {t("locked")}
            </p>
          ) : null}
        </div>
      </CardHeader>

      {!isLocked ? (
        <CardContent className="grid gap-4">
          {isCompleted ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-fit justify-self-end hover:bg-muted"
              onClick={() => setIsCompletedExpanded(false)}
            >
              <ChevronUp aria-hidden="true" />
              {t("completedSummary.collapse")}
            </Button>
          ) : null}

          <section className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="grid gap-1">
                <h2 className="text-sm font-medium text-foreground">
                  {t("actionLayer.title")}
                </h2>
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("actionLayer.description")}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  size="sm"
                  className="w-full justify-center sm:w-auto"
                  disabled={isGenerating}
                  onClick={() => executeWithGemini()}
                >
                  {isGenerating ? (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  ) : (
                    <Sparkles aria-hidden="true" />
                  )}
                  {isGenerating
                    ? t("execution.generating")
                    : t("execution.generate")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-center sm:w-auto"
                  onClick={copyPrompt}
                >
                  {isCopied ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <Copy aria-hidden="true" />
                  )}
                  {isCopied ? t("copied") : t("copyPrompt")}
                </Button>
              </div>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("credits.remaining", {
                generations: String(getRemaining("generation")),
                refinements: String(getRemaining("refinement")),
              })}
            </p>

            {generationError ? (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm leading-6 text-destructive">
                {generationError}
              </p>
            ) : null}

            <div className="grid gap-2 rounded-lg border border-border bg-background p-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid gap-1">
                  <h3 className="text-sm font-medium text-foreground">
                    {t("prompt")}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {hasPromptEdit
                      ? t("promptEditor.saved")
                      : t("promptEditor.hint")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {hasPromptEdit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="hover:bg-muted"
                      onClick={onPromptDraftReset}
                    >
                      {t("promptEditor.reset")}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="hover:bg-muted"
                    aria-expanded={isPromptExpanded}
                    onClick={() =>
                      setIsPromptExpanded((current) => !current)
                    }
                  >
                    {isPromptExpanded ? (
                      <ChevronUp aria-hidden="true" />
                    ) : (
                      <ChevronDown aria-hidden="true" />
                    )}
                    {isPromptExpanded
                      ? t("promptEditor.hide")
                      : t("promptEditor.show")}
                  </Button>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isPromptExpanded ? (
                  <motion.div key="prompt-editor" {...revealMotion}>
                    <Textarea
                      aria-label={t("prompt")}
                      className="min-h-40 resize-y rounded-lg bg-muted/40 text-sm leading-6 text-foreground sm:min-h-48"
                      value={promptDraft}
                      onChange={(event) =>
                        onPromptDraftChange(event.target.value)
                      }
                    />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <div className="grid gap-2">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="grid gap-1">
                  <h3 className="text-sm font-medium text-foreground">
                    {t("outputDraft.title")}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("outputDraft.description")}
                  </p>
                </div>
                {hasOutputDraft ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-fit hover:bg-muted"
                    onClick={handleOutputDraftReset}
                  >
                    {t("outputDraft.reset")}
                  </Button>
                ) : null}
              </div>
              <Textarea
                aria-label={t("outputDraft.title")}
                className="min-h-28 resize-y rounded-lg bg-background text-sm leading-6 text-foreground sm:min-h-32"
                placeholder={t("outputDraft.placeholder")}
                value={outputDraft}
                onChange={(event) =>
                  handleOutputDraftChange(event.target.value)
                }
              />
              <p className="text-sm leading-6 text-muted-foreground">
                {hasOutputDraft ? t("outputDraft.saved") : t("outputDraft.hint")}
              </p>
            </div>

            {hasOutputDraft ? (
              <div className="grid gap-3 rounded-lg border border-border bg-background p-3">
                <div className="grid gap-1">
                  <h3 className="text-sm font-medium text-foreground">
                    {t("refinement.title")}
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t("refinement.description")}
                  </p>
                </div>
                <Textarea
                  aria-label={t("refinement.title")}
                  className="min-h-20 resize-y rounded-lg bg-muted/30 text-sm leading-6 text-foreground"
                  placeholder={t("refinement.placeholder")}
                  value={refinementFeedback}
                  onChange={(event) =>
                    setRefinementFeedback(event.target.value)
                  }
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full justify-center sm:w-auto"
                    disabled={
                      isGenerating ||
                      refinementFeedback.trim().length === 0
                    }
                    onClick={() => executeWithGemini(refinementFeedback)}
                  >
                    {isGenerating ? (
                      <Loader2 aria-hidden="true" className="animate-spin" />
                    ) : (
                      <RefreshCw aria-hidden="true" />
                    )}
                    {isGenerating
                      ? t("refinement.refining")
                      : t("refinement.action")}
                  </Button>
                  {refinementHistory.length > 0 ? (
                    <span className="text-sm text-muted-foreground">
                      {t("refinement.historyCount", {
                        count: refinementHistory.length,
                      })}
                    </span>
                  ) : null}
                </div>
                {refinementHistory.length > 0 ? (
                  <details className="rounded-lg border border-border bg-muted/30 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-foreground">
                      {t("refinement.historyTitle")}
                    </summary>
                    <ol className="mt-3 grid gap-2 text-sm leading-6 text-muted-foreground">
                      {refinementHistory.slice(-3).map((entry, index) => (
                        <li key={entry.id} className="grid gap-1">
                          <span className="font-medium text-foreground">
                            {t("refinement.historyItem", {
                              index:
                                refinementHistory.length -
                                refinementHistory.slice(-3).length +
                                index +
                                1,
                            })}
                          </span>
                          <span>{entry.feedback}</span>
                        </li>
                      ))}
                    </ol>
                  </details>
                ) : null}
              </div>
            ) : null}

            <section className="grid gap-3 rounded-lg border border-border bg-background p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <Bot
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-foreground"
                  />
                  <div className="grid gap-1">
                    <h3 className="text-sm font-medium text-foreground">
                      {t("coach.title")}
                    </h3>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t(`coach.recommendations.${coachRecommendation}`)}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="w-fit rounded-lg">
                    {t(`coach.badges.${coachRecommendation}`)}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 hover:bg-muted"
                    aria-expanded={isCoachExpanded}
                    onClick={() =>
                      setIsCoachExpanded((current) => !current)
                    }
                  >
                    {isCoachExpanded ? (
                      <ChevronUp aria-hidden="true" />
                    ) : (
                      <ChevronDown aria-hidden="true" />
                    )}
                    {isCoachExpanded
                      ? t("coach.hideDetails")
                      : t("coach.showDetails")}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {t("coach.nextAction")}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`coach.nextActions.${coachNextAction}`)}
                </p>
              </div>

              <AnimatePresence initial={false}>
                {isCoachExpanded ? (
                  <motion.div
                    key="coach-details"
                    {...revealMotion}
                    className="grid gap-3 lg:grid-cols-2"
                  >
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        {t("coach.why")}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {step.goal}
                      </p>
                    </div>
                    <div className="rounded-lg border border-border bg-muted/30 p-3">
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        {t("coach.signalsTitle")}
                      </p>
                      <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
                        {coachSignals.map((signal) => (
                          <li key={signal} className="flex gap-2">
                            <CircleAlert
                              aria-hidden="true"
                              className="mt-1 size-3.5 shrink-0 text-muted-foreground"
                            />
                            <span>{t(`coach.signals.${signal}`)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </section>

            <div className="rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                {t("expectedOutput")}
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {step.expectedOutput}
              </p>
            </div>
          </section>

          {hasLearnContent ? (
            <section className="overflow-hidden rounded-lg border border-border bg-background">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40 sm:px-5"
                aria-expanded={isLearnExpanded}
                onClick={() => setIsLearnExpanded((current) => !current)}
              >
                <span className="grid gap-1">
                  <span className="text-sm font-medium text-foreground">
                    {t("learnLayer.title")}
                  </span>
                  <span className="text-sm leading-6 text-muted-foreground">
                    {t("learnLayer.description")}
                  </span>
                </span>
                {isLearnExpanded ? (
                  <ChevronUp
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                ) : (
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 shrink-0 text-muted-foreground"
                  />
                )}
              </button>

              <AnimatePresence initial={false}>
                {isLearnExpanded ? (
                  <motion.div
                    key="learn-layer"
                    {...revealMotion}
                    className="grid gap-4 border-t border-border bg-muted/20 p-4 sm:p-5"
                  >
                  {step.toolRecommendation ? (
                    <div className="grid gap-3 rounded-lg border border-border bg-background p-4">
                      <div className="flex items-start gap-3">
                        <Bot
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-foreground"
                        />
                        <div className="grid gap-1">
                          <h3 className="text-sm font-medium text-foreground">
                            {t("toolRecommendation.title")}
                          </h3>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {step.toolRecommendation.recommendedTool}:{" "}
                            {step.toolRecommendation.whyItFits}
                          </p>
                        </div>
                      </div>
                      {step.toolRecommendation.alternativeTools.length > 0 ? (
                        <ul className="grid gap-2 text-sm leading-6 text-muted-foreground">
                          {step.toolRecommendation.alternativeTools.map(
                            (alternativeTool) => (
                              <li
                                key={`${alternativeTool.tool}-${alternativeTool.reason}`}
                                className="flex gap-2"
                              >
                                <span aria-hidden="true">-</span>
                                <span>
                                  <span className="font-medium text-foreground">
                                    {alternativeTool.tool}:
                                  </span>{" "}
                                  {alternativeTool.reason}
                                </span>
                              </li>
                            ),
                          )}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}

                  {step.promptComparison ? (
                    <div className="grid gap-3 rounded-lg border border-border bg-background p-4">
                      <div className="flex items-start gap-3">
                        <GitCompareArrows
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-foreground"
                        />
                        <div className="grid gap-1">
                          <h3 className="text-sm font-medium text-foreground">
                            {t("promptComparison.title")}
                          </h3>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {step.promptComparison.explanation}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-3 lg:grid-cols-2">
                        <div className="rounded-lg border border-border bg-muted/30 p-3">
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            {t("promptComparison.weakPrompt")}
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {step.promptComparison.weakPrompt}
                          </p>
                        </div>
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                          <p className="text-xs font-medium uppercase text-emerald-700 dark:text-emerald-300">
                            {t("promptComparison.optimizedPrompt")}
                          </p>
                          <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-6 text-foreground">
                            {promptDraft}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {step.promptAssist ? (
                    <div className="grid gap-3 rounded-lg border border-border bg-background p-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-foreground"
                        />
                        <div className="grid gap-1">
                          <h3 className="text-sm font-medium text-foreground">
                            {t("promptAssist.title")}
                          </h3>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {step.promptAssist.whyItWorks}
                          </p>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-1">
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            {t("promptAssist.aiFocus")}
                          </p>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {step.promptAssist.aiFocus}
                          </p>
                        </div>
                        <div className="grid gap-1">
                          <p className="text-xs font-medium uppercase text-muted-foreground">
                            {t("promptAssist.customize")}
                          </p>
                          <p className="text-sm leading-6 text-muted-foreground">
                            {step.promptAssist.customize}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </section>
          ) : null}

          <AnimatePresence initial={false} mode="wait">
            {hasOutputDraft ? (
              <motion.section
                key="review-layer"
                {...revealMotion}
                className="grid gap-4 rounded-lg border border-border bg-muted/30 p-4 sm:p-5"
              >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-foreground"
                  />
                  <div className="grid gap-1">
                    <h2 className="text-sm font-medium text-foreground">
                      {t("reviewLayer.title")}
                    </h2>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t("reviewLayer.description")}
                    </p>
                  </div>
                </div>
                {hasQualityChecklist ? (
                  <span className="w-fit rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
                    {t("qualityChecklist.progress", {
                      checkedCount: visibleCheckedQualityItems.length,
                      totalCount: qualityChecklist.length,
                    })}
                  </span>
                ) : null}
              </div>

              {hasQualityChecklist ? (
                <div className="grid gap-2">
                  {qualityChecklist.map((item, index) => {
                    const isChecked = visibleCheckedQualityItems.includes(index);

                    return (
                      <motion.label
                        key={item}
                        layout
                        animate={{ scale: isChecked ? 1.01 : 1 }}
                        transition={{ duration: 0.18 }}
                        className="flex cursor-pointer gap-3 rounded-lg border border-border bg-background p-3 text-sm leading-6 transition-colors hover:bg-muted/40 has-disabled:cursor-not-allowed has-disabled:opacity-50"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={!canComplete}
                          onChange={(event) =>
                            handleQualityChecklistChange(
                              index,
                              event.target.checked,
                            )
                          }
                          className="mt-1 size-4 shrink-0 rounded border-input accent-primary"
                        />
                        <span className="text-muted-foreground">{item}</span>
                      </motion.label>
                    );
                  })}
                </div>
              ) : null}

              <div className="rounded-lg border border-border bg-background p-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  {t("reviewLayer.retrySuggestions")}
                </p>
                <ul className="mt-2 grid gap-2 text-sm leading-6 text-muted-foreground">
                  {step.commonMistakes.map((mistake) => (
                    <li key={mistake} className="flex gap-2">
                      <span aria-hidden="true">-</span>
                      <span>{mistake}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <label className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted has-disabled:cursor-not-allowed has-disabled:opacity-50 sm:w-fit">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  disabled={!canMarkComplete && !isCompleted}
                  onChange={(event) =>
                    handleCompletedChange(event.target.checked)
                  }
                  className="size-4 shrink-0 rounded border-input accent-primary"
                />
                {t("complete")}
              </label>

              {hasQualityChecklist && !isQualityChecklistComplete ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("qualityChecklist.completeHint")}
                </p>
              ) : null}
              </motion.section>
            ) : (
              <motion.p
                key="review-waiting"
                {...revealMotion}
                className="rounded-lg border border-dashed border-border px-4 py-3 text-sm leading-6 text-muted-foreground"
              >
                {t("reviewLayer.waiting")}
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      ) : null}
    </Card>
  );
}
