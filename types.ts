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
  promptTemplate: string;
  expectedOutput: string;
  commonMistakes: string[];
}

export interface UserGoalInput {
  currentStage: string;
  startupIdea: string;
  industry: string;
  deadlineUrgency: string;
}
