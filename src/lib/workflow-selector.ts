import { businessModelDesignWorkflow } from "@/data/workflows/business-model";
import { ideaValidationWorkflow } from "@/data/workflows/idea-validation";
import { marketResearchWorkflow } from "@/data/workflows/market-research";
import { mvpPlanningWorkflow } from "@/data/workflows/mvp-planning";
import { pitchDeckPreparationWorkflow } from "@/data/workflows/pitch-deck";
import type { StartupWorkflow } from "@/data/workflows";
import type { GoalFormValues } from "@/lib/goal-form-schema";

type StartupStage = GoalFormValues["currentStage"];

const workflowRules = {
  "No clear idea yet": ideaValidationWorkflow,
  "Have idea but not validated": marketResearchWorkflow,
  "Doing market research": businessModelDesignWorkflow,
  "Building business model": mvpPlanningWorkflow,
  "Preparing pitch deck": pitchDeckPreparationWorkflow,
} satisfies Record<StartupStage, StartupWorkflow>;

export function selectWorkflow(stage: StartupStage): StartupWorkflow {
  return workflowRules[stage];
}
