import type { UserGoalInput, Workflow } from "../../types";
import { injectWorkflowVariables as injectTemplateVariables } from "@/lib/template-parser";

function injectVariables(value: string, userInput: UserGoalInput): string {
  return injectTemplateVariables(value, {
    startupIdea: userInput.startupIdea,
    industry: userInput.industry,
  });
}

export function injectWorkflowVariables(
  workflow: Workflow,
  userInput: UserGoalInput,
): Workflow {
  return {
    ...workflow,
    title: injectVariables(workflow.title, userInput),
    description: injectVariables(workflow.description, userInput),
    category: injectVariables(workflow.category, userInput),
    estimatedTime: injectVariables(workflow.estimatedTime, userInput),
    steps: workflow.steps.map((step) => ({
      ...step,
      title: injectVariables(step.title, userInput),
      goal: injectVariables(step.goal, userInput),
      tool: injectVariables(step.tool, userInput),
      promptTemplate: injectVariables(step.promptTemplate, userInput),
      expectedOutput: injectVariables(step.expectedOutput, userInput),
      commonMistakes: step.commonMistakes.map((mistake) =>
        injectVariables(mistake, userInput),
      ),
    })),
  };
}
