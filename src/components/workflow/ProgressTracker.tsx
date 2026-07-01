"use client";

import { CheckCircle2, CircleDot, LockKeyhole } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProposalDraftEngine } from "@/components/workflow/ProposalDraftEngine";
import { StepCard } from "@/components/workflow/StepCard";
import { WorkflowCompletion } from "@/components/workflow/WorkflowCompletion";
import { WorkflowExport } from "@/components/workflow/WorkflowExport";
import { useWorkflowProgress } from "@/hooks/useWorkflowProgress";
import { cn } from "@/lib/utils";
import type { WorkflowStep } from "../../../types";

type ProgressTrackerProps = {
  workflowId: string;
  workflowRunId: string;
  workflowTitle: string;
  availableTools: string[];
  steps: WorkflowStep[];
};

const unlockMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: 0.2 },
};

export function ProgressTracker({
  workflowId,
  workflowRunId,
  workflowTitle,
  availableTools,
  steps,
}: ProgressTrackerProps) {
  const t = useTranslations("ProgressTracker");
  const adaptedSteps = steps.filter(
    (step) => step.adaptedTool && step.adaptedTool !== step.originalTool,
  );
  const adaptedTools = Array.from(
    new Set(adaptedSteps.map((step) => step.adaptedTool ?? "")),
  ).filter((tool) => tool.length > 0);
  const {
    canCompleteStep,
    completedCount,
    completionPercentage,
    currentStepId,
    addRefinementHistory,
    getChecklistItems,
    getOutputDraft,
    getPromptDraft,
    getRefinementHistory,
    hasOutputDraft,
    hasPromptEdit,
    hasSavedProgress,
    isStepCompleted,
    resetOutputDraft,
    resetPromptEdit,
    restartWorkflow,
    setChecklistItems,
    setOutputDraft,
    setPromptEdit,
    setStepCompleted,
    totalSteps,
  } = useWorkflowProgress({
    workflowId,
    workflowRunId,
    stepIds: steps.map((step) => String(step.id)),
    availableTools,
  });
  const remainingCount = Math.max(totalSteps - completedCount, 0);
  const visibleSteps = steps.filter((step) => {
    const stepId = String(step.id);

    return canCompleteStep(stepId) || isStepCompleted(stepId);
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[17rem_1fr] lg:items-start">
      <aside className="lg:sticky lg:top-6">
        <Card className="rounded-lg py-5 shadow-sm transition-shadow hover:shadow-md">
          <CardHeader className="gap-1">
            <CardTitle className="text-lg">{t("title")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("description")}
            </p>
          </CardHeader>
          <CardContent className="grid gap-4">
            {hasSavedProgress && completionPercentage < 100 ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-sm font-medium text-foreground">
                  {t("resume.title")}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {currentStepId
                    ? t("resume.description", { stepId: currentStepId })
                    : t("resume.fallbackDescription")}
                </p>
              </div>
            ) : null}
            <div className="space-y-1">
              <p className="text-xl font-semibold leading-tight text-foreground">
                {t("completedSteps", { completedCount, totalSteps })}
              </p>
              <p className="text-4xl font-semibold tracking-normal text-foreground">
                {completionPercentage}%
              </p>
              <p className="text-sm text-muted-foreground">
                {currentStepId
                  ? t("currentStep", { stepId: currentStepId })
                  : t("allComplete")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("remainingSteps", { remainingCount })}
              </p>
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-muted"
              aria-label={t("progressAria", { completionPercentage })}
            >
              <motion.div
                className="h-full rounded-full bg-primary transition-all"
                initial={false}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <ol
              className="grid max-h-64 gap-2 overflow-y-auto pr-1 lg:max-h-none lg:overflow-visible lg:pr-0"
              aria-label={t("milestoneListLabel")}
            >
              {steps.map((step) => {
                const stepId = String(step.id);
                const isCompleted = isStepCompleted(stepId);
                const isCurrent = currentStepId === stepId;
                const isAvailable = canCompleteStep(stepId);
                const Icon = isCompleted
                  ? CheckCircle2
                  : isAvailable
                    ? CircleDot
                    : LockKeyhole;

                return (
                  <motion.li
                    key={step.id}
                    layout
                    transition={{ duration: 0.18 }}
                    className={cn(
                      "flex items-start gap-2 rounded-lg border border-transparent p-2 text-sm transition-colors",
                      isCurrent && "border-border bg-muted/50",
                    )}
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "mt-0.5 size-4 shrink-0 text-muted-foreground",
                        isCompleted && "text-emerald-600",
                        isCurrent && "text-foreground",
                      )}
                    />
                    <span className="grid min-w-0 gap-0.5">
                      <span className="text-xs font-medium text-muted-foreground">
                        {t("milestoneLabel", { step: step.id })}
                      </span>
                      <span className="line-clamp-2 font-medium leading-5 text-foreground">
                        {step.title}
                      </span>
                    </span>
                  </motion.li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      </aside>

      <section className="grid gap-5">
        <AnimatePresence initial={false}>
          {completionPercentage === 100 ? (
            <motion.div key="workflow-completion" {...unlockMotion}>
              <WorkflowCompletion
                completedCount={completedCount}
                totalSteps={totalSteps}
                workflowId={workflowId}
                workflowRunId={workflowRunId}
                workflowTitle={workflowTitle}
                availableTools={availableTools}
                adaptedToolCount={adaptedSteps.length}
                adaptedTools={adaptedTools}
                onRestart={restartWorkflow}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

        {completionPercentage === 100 ? (
          <ProposalDraftEngine
            key={workflowRunId}
            workflowRunId={workflowRunId}
            workflowTitle={workflowTitle}
            steps={steps.map((step) => ({
              step,
              outputDraft: getOutputDraft(String(step.id)),
            }))}
          />
        ) : null}

        <AnimatePresence initial={false}>
          {visibleSteps.map((step) => (
            <motion.div key={step.id} layout {...unlockMotion}>
              <StepCard
                checkedQualityItems={getChecklistItems(String(step.id))}
                hasOutputDraft={hasOutputDraft(String(step.id))}
                hasPromptEdit={hasPromptEdit(String(step.id))}
                outputDraft={getOutputDraft(String(step.id))}
                promptDraft={getPromptDraft(String(step.id), step.promptTemplate)}
                refinementHistory={getRefinementHistory(String(step.id))}
                step={step}
                canComplete={canCompleteStep(String(step.id))}
                isCompleted={isStepCompleted(String(step.id))}
                onCheckedQualityItemsChange={(checkedItems) =>
                  setChecklistItems(String(step.id), checkedItems)
                }
                onCompletedChange={(isCompleted) =>
                  setStepCompleted(String(step.id), isCompleted)
                }
                onOutputDraftChange={(outputDraft) =>
                  setOutputDraft(String(step.id), outputDraft)
                }
                onOutputDraftReset={() => resetOutputDraft(String(step.id))}
                onPromptDraftChange={(promptDraft) =>
                  setPromptEdit(String(step.id), promptDraft)
                }
                onPromptDraftReset={() => resetPromptEdit(String(step.id))}
                onRefinementHistoryAdd={(refinement) =>
                  addRefinementHistory(String(step.id), refinement)
                }
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <WorkflowExport
          workflowTitle={workflowTitle}
          steps={steps.map((step) => ({
            step,
            outputDraft: getOutputDraft(String(step.id)),
            promptDraft: getPromptDraft(String(step.id), step.promptTemplate),
          }))}
        />
      </section>
    </div>
  );
}
