import type { AvailableTool } from "./src/lib/goal-form-schema";
import type { Locale } from "./src/i18n/config";

export interface Workflow {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: string;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: number;
  title: string;
  goal: string;
  timebox?: string;
  tool: string;
  originalTool?: string;
  adaptedTool?: string;
  toolRecommendation?: ToolRecommendation;
  promptTemplate: string;
  promptAssist?: PromptAssist;
  promptComparison?: PromptComparison;
  qualityChecklist?: string[];
  expectedOutput: string;
  commonMistakes: string[];
}

export interface ToolRecommendation {
  recommendedTool: string;
  whyItFits: string;
  preferenceNote?: string;
  alternativeTools: ToolAlternative[];
}

export interface ToolAlternative {
  tool: string;
  reason: string;
}

export interface PromptComparison {
  weakPrompt: string;
  explanation: string;
}

export interface PromptAssist {
  whyItWorks: string;
  aiFocus: string;
  customize: string;
  editingMistakes: string[];
}

export interface UserGoalInput {
  currentStage: string;
  startupIdea: string;
  industry: string;
  targetCustomer: string;
  deadlineUrgency: string;
  availableTools: AvailableTool[];
  locale?: Locale;
}
