"use client";

import { track } from "@vercel/analytics";
import { useEffect, useMemo } from "react";

import {
  formatAnalyticsTools,
  getUniqueAnalyticsTools,
} from "@/lib/analytics-payload";
import type { WorkflowStep } from "../../../types";

type WorkflowAnalyticsProps = {
  workflowId: string;
  workflowRunId: string;
  workflowTitle: string;
  availableTools: string[];
  steps: WorkflowStep[];
};

export function WorkflowAnalytics({
  workflowId,
  workflowRunId,
  workflowTitle,
  availableTools,
  steps,
}: WorkflowAnalyticsProps) {
  const selectedTools = useMemo(
    () => getUniqueAnalyticsTools(availableTools),
    [availableTools],
  );
  const adaptedSteps = useMemo(
    () =>
      steps.filter(
        (step) => step.adaptedTool && step.adaptedTool !== step.originalTool,
      ),
    [steps],
  );
  const adaptedTools = useMemo(
    () =>
      getUniqueAnalyticsTools(
        adaptedSteps.map((step) => step.adaptedTool ?? ""),
      ),
    [adaptedSteps],
  );

  useEffect(() => {
    track("Workflow Selected", {
      workflowId,
      workflowRunId,
      workflowTitle,
      selectedTools: formatAnalyticsTools(selectedTools),
      selectedToolCount: selectedTools.length,
      adaptedTools: formatAnalyticsTools(adaptedTools),
      adaptedToolCount: adaptedSteps.length,
      hasAdaptations: adaptedSteps.length > 0,
    });

    adaptedSteps.forEach((step) => {
      track("Tool Adapted", {
        workflowId,
        workflowRunId,
        originalTool: step.originalTool ?? step.tool,
        adaptedTool: step.adaptedTool ?? step.tool,
      });
    });
  }, [
    adaptedSteps,
    adaptedTools,
    selectedTools,
    workflowId,
    workflowRunId,
    workflowTitle,
  ]);

  return null;
}
