export const workflowPhases = ["generate", "review", "improve"] as const;

export type WorkflowPhase = (typeof workflowPhases)[number];

export function isWorkflowPhase(value: string): value is WorkflowPhase {
  return workflowPhases.includes(value as WorkflowPhase);
}
