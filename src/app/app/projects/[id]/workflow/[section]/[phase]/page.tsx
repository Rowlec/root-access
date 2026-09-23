import { redirect } from "next/navigation";

import { ProjectWorkflowEntry } from "@/components/app/ProjectWorkflowEntry";
import {
  isProposalSectionId,
  type ProposalSectionId,
} from "@/lib/proposal-review";
import { getProjectWorkflowState } from "@/lib/server/projects";
import { isWorkflowPhase, type WorkflowPhase } from "@/lib/workflow-route";

export default async function ProjectWorkflowPage({
  params,
}: {
  params: Promise<{ id: string; phase: string; section: string }>;
}) {
  const { id, phase, section } = await params;

  if (!isProposalSectionId(section) || !isWorkflowPhase(phase)) {
    redirect(`/app/projects/${id}/workflow/problem/generate`);
  }

  const data = await getProjectWorkflowState(id);

  return (
    <ProjectWorkflowEntry
      initialBuilder={data.builder as Record<string, unknown> | null}
      initialWorkspace={data.workspace as Record<string, unknown> | null}
      phase={phase as WorkflowPhase}
      project={data.project}
      sectionId={section as ProposalSectionId}
    />
  );
}
