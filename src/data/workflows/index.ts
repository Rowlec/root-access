import { businessModelDesignWorkflow } from "@/data/workflows/business-model";
import { ideaValidationWorkflow } from "@/data/workflows/idea-validation";
import { marketResearchWorkflow } from "@/data/workflows/market-research";
import { mvpPlanningWorkflow } from "@/data/workflows/mvp-planning";
import { pitchDeckPreparationWorkflow } from "@/data/workflows/pitch-deck";

export interface StartupWorkflowStep {
  title: string;
  goal: string;
  recommendedTool: string;
  originalRecommendedTool?: string;
  adaptedRecommendedTool?: string;
  promptTemplate: string;
  expectedOutput: string;
  commonMistakes: readonly string[];
}

export interface StartupWorkflow {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  steps: readonly StartupWorkflowStep[];
}

export const startupWorkflows = [
  ideaValidationWorkflow,
  marketResearchWorkflow,
  businessModelDesignWorkflow,
  mvpPlanningWorkflow,
  pitchDeckPreparationWorkflow,
] satisfies readonly StartupWorkflow[];
