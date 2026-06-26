import { startupProposalWorkflow } from "@/data/workflows/startup-proposal";

export interface StartupPromptAssist {
  whyItWorks: string;
  aiFocus: string;
  customize: string;
  editingMistakes: readonly string[];
}

export interface StartupPromptComparison {
  weakPrompt: string;
  explanation: string;
}

export interface StartupToolAlternative {
  tool: string;
  reason: string;
}

export interface StartupToolRecommendation {
  recommendedTool: string;
  whyItFits: string;
  alternativeTools: readonly StartupToolAlternative[];
}

export interface StartupWorkflowStep {
  title: string;
  goal: string;
  timebox?: string;
  recommendedTool: string;
  originalRecommendedTool?: string;
  adaptedRecommendedTool?: string;
  toolRecommendation?: StartupToolRecommendation;
  promptTemplate: string;
  promptAssist?: StartupPromptAssist;
  promptComparison?: StartupPromptComparison;
  qualityChecklist?: readonly string[];
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
  startupProposalWorkflow,
] satisfies readonly StartupWorkflow[];
