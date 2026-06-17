"use client";

import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StepCard } from "@/components/workflow/StepCard";
import { WorkflowCompletion } from "@/components/workflow/WorkflowCompletion";
import { useWorkflowProgress } from "@/hooks/useWorkflowProgress";
import type { WorkflowStep } from "../../../types";

type ProgressTrackerProps = {
  workflowId: string;
  workflowRunId: string;
  workflowTitle: string;
  availableTools: string[];
  steps: WorkflowStep[];
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
    isStepCompleted,
    restartWorkflow,
    setStepCompleted,
    totalSteps,
  } = useWorkflowProgress({
    workflowId,
    workflowRunId,
    stepIds: steps.map((step) => String(step.id)),
    availableTools,
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
            </div>
            <div
              className="h-2.5 overflow-hidden rounded-full bg-muted"
              aria-label={t("progressAria", { completionPercentage })}
            >
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </aside>

      <section className="grid gap-5">
        {completionPercentage === 100 ? (
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
        ) : null}

        {steps.map((step) => (
          <StepCard
            key={step.id}
            step={step}
            canComplete={canCompleteStep(String(step.id))}
            isCompleted={isStepCompleted(String(step.id))}
            onCompletedChange={(isCompleted) =>
              setStepCompleted(String(step.id), isCompleted)
            }
          />
        ))}
      </section>
    </div>
  );
}
