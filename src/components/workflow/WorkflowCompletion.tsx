"use client";

import { track } from "@vercel/analytics";
import { ExternalLink, RotateCcw, Trophy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GOOGLE_FORM_URL } from "@/constants/links";
import {
  formatAnalyticsTools,
  getUniqueAnalyticsTools,
} from "@/lib/analytics-payload";

type WorkflowCompletionProps = {
  adaptedToolCount: number;
  adaptedTools: string[];
  availableTools: string[];
  completedCount: number;
  totalSteps: number;
  workflowId: string;
  workflowRunId: string;
  workflowTitle: string;
  onRestart: () => void;
};

function getCompletionTrackingKey(workflowId: string, workflowRunId: string) {
  return `root-access:workflow-completion-tracked:${workflowId}:${workflowRunId}`;
}

export function WorkflowCompletion({
  adaptedToolCount,
  adaptedTools,
  availableTools,
  completedCount,
  totalSteps,
  workflowId,
  workflowRunId,
  workflowTitle,
  onRestart,
}: WorkflowCompletionProps) {
  const t = useTranslations("WorkflowCompletion");

  useEffect(() => {
    const selectedTools = getUniqueAnalyticsTools(availableTools);
    const trackingKey = getCompletionTrackingKey(workflowId, workflowRunId);

    try {
      if (window.sessionStorage.getItem(trackingKey) === "true") {
        return;
      }

      window.sessionStorage.setItem(trackingKey, "true");
    } catch {
      // Continue tracking even if sessionStorage is unavailable.
    }

    track("Workflow Completion", {
      workflowId,
      workflowRunId,
      workflowTitle,
      completedSteps: completedCount,
      completedCount,
      totalSteps,
      selectedTools: formatAnalyticsTools(selectedTools),
      selectedToolCount: selectedTools.length,
      adaptedTools: formatAnalyticsTools(adaptedTools),
      adaptedToolCount,
    });

    selectedTools.forEach((tool) => {
      track("Tool Workflow Completion", {
        tool,
        workflowId,
        workflowRunId,
        workflowTitle,
      });
    });
  }, [
    adaptedToolCount,
    adaptedTools,
    availableTools,
    completedCount,
    totalSteps,
    workflowId,
    workflowRunId,
    workflowTitle,
  ]);

  return (
    <Card className="rounded-lg border-primary/20 bg-muted/40 py-5 shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="gap-3">
        <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Trophy aria-hidden="true" className="size-5" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl">{t("title")}</CardTitle>
          <CardDescription className="text-base leading-7">
            {t("description", { workflowTitle })}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("summary", { completedCount, totalSteps })}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-3 sm:flex-row">
        <Button asChild className="h-10 w-full sm:w-auto">
          <a
            href={GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              track("Feedback Click", {
                source: "workflow_completion",
                workflowId,
                workflowRunId,
                workflowTitle,
                selectedTools: formatAnalyticsTools(availableTools),
                selectedToolCount: getUniqueAnalyticsTools(availableTools)
                  .length,
                adaptedToolCount,
              })
            }
          >
            {t("submitFeedback")}
            <ExternalLink aria-hidden="true" />
          </a>
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full sm:w-auto"
          onClick={() => {
            try {
              window.sessionStorage.removeItem(
                getCompletionTrackingKey(workflowId, workflowRunId),
              );
            } catch {
              // Nothing to reset when sessionStorage is unavailable.
            }

            onRestart();
          }}
        >
          {t("restart")}
          <RotateCcw aria-hidden="true" />
        </Button>
      </CardFooter>
    </Card>
  );
}
