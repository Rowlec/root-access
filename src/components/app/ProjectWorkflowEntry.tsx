"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";

import { AcademicIntegrityNotice } from "@/components/AcademicIntegrityNotice";
import { WorkflowReviewWorkspace } from "@/components/proposal/WorkflowReviewWorkspace";
import { WorkflowServerSync } from "@/components/proposal/WorkflowServerSync";
import type { ProposalSectionId } from "@/lib/proposal-review";
import { createProposalRunId } from "@/lib/proposal-run";
import type { WorkflowPhase } from "@/lib/workflow-route";

type ProjectWorkflowEntryProps = {
  initialBuilder: Record<string, unknown> | null;
  initialWorkspace: Record<string, unknown> | null;
  phase: WorkflowPhase;
  project: {
    id: string;
    industry: string;
    startupIdea: string;
    targetCustomer: string;
  };
  sectionId: ProposalSectionId;
};

export function ProjectWorkflowEntry({
  initialBuilder,
  initialWorkspace,
  phase,
  project,
  sectionId,
}: ProjectWorkflowEntryProps) {
  const locale = useLocale() === "vi" ? "vi" : "en";
  const [restored, setRestored] = useState(false);
  const workflowRunId = useMemo(
    () =>
      createProposalRunId({
        idea: project.startupIdea,
        industry: project.industry,
        locale,
        targetCustomer: project.targetCustomer,
      }),
    [locale, project.industry, project.startupIdea, project.targetCustomer],
  );

  useEffect(() => {
    window.localStorage.setItem("root-access:active-project-id", project.id);
    window.localStorage.setItem(
      "root-access:startup-context",
      JSON.stringify({
        availableTools: ["Gemini"],
        currentStage: "No clear idea yet",
        deadlineUrgency: "No deadline",
        industry: project.industry,
        startupIdea: project.startupIdea,
        targetCustomer: project.targetCustomer,
        workflowMode: "deep",
      }),
    );

    const workspaceKey = `root-access:workflow-review:${workflowRunId}`;
    const builderKey = `root-access:proposal-builder:${workflowRunId}`;

    if (initialWorkspace && !window.localStorage.getItem(workspaceKey)) {
      window.localStorage.setItem(
        workspaceKey,
        JSON.stringify(initialWorkspace),
      );
    }
    if (initialBuilder && !window.localStorage.getItem(builderKey)) {
      window.localStorage.setItem(
        builderKey,
        JSON.stringify(initialBuilder),
      );
    }
    const restoreTimer = window.setTimeout(() => setRestored(true), 0);

    return () => window.clearTimeout(restoreTimer);
  }, [initialBuilder, initialWorkspace, project, workflowRunId]);

  if (!restored) {
    return <main className="min-h-svh" />;
  }

  const routeBase = `/app/projects/${project.id}/workflow`;

  return (
    <main className="min-h-svh px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-7">
        <WorkflowServerSync workflowRunId={workflowRunId} />
        <WorkflowReviewWorkspace
          activeSectionId={sectionId}
          context={{
            deadlineUrgency: "No deadline",
            industry: project.industry,
            locale,
            startupIdea: project.startupIdea,
            targetCustomer: project.targetCustomer,
            workflowRunId,
          }}
          phase={phase}
          projectHomePath={`/app/projects/${project.id}`}
          routeBase={routeBase}
          serverMetered
        />
        <AcademicIntegrityNotice compact variant="workflow" />
      </div>
    </main>
  );
}
