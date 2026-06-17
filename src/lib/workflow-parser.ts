import type { UserGoalInput, Workflow } from "../../types";
import {
  injectWorkflowVariables as injectTemplateVariables,
  replacePromptToolReferences,
} from "@/lib/template-parser";
import { mapTool } from "@/lib/tool-mapper";

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
    steps: workflow.steps.map((step) => {
      const originalTool = injectVariables(step.originalTool ?? step.tool, userInput);
      const adaptedTool = mapTool(originalTool, userInput.availableTools);
      const promptTemplate = replacePromptToolReferences(
        step.promptTemplate,
        originalTool,
        adaptedTool,
      );

      return {
        ...step,
        title: injectVariables(step.title, userInput),
        goal: injectVariables(step.goal, userInput),
        tool: adaptedTool,
        originalTool,
        adaptedTool: adaptedTool === originalTool ? undefined : adaptedTool,
        promptTemplate: injectVariables(promptTemplate, userInput),
        expectedOutput: injectVariables(step.expectedOutput, userInput),
        commonMistakes: step.commonMistakes.map((mistake) =>
          injectVariables(mistake, userInput),
        ),
      };
    }),
  };
}
