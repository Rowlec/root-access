import type { AvailableTool } from "./src/lib/goal-form-schema";

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
  tool: string;
  originalTool?: string;
  adaptedTool?: string;
  promptTemplate: string;
  expectedOutput: string;
  commonMistakes: string[];
}

export interface UserGoalInput {
  currentStage: string;
  startupIdea: string;
  industry: string;
  deadlineUrgency: string;
  availableTools: AvailableTool[];
}
