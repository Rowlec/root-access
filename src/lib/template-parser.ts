import { availableToolOptions } from "@/lib/goal-form-schema";

export interface TemplateVariables {
  startupIdea: string;
  industry: string;
  targetCustomer: string;
  deadlineUrgency: string;
  preferredAiTools: string;
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceToolName(value: string, originalTool: string, adaptedTool: string) {
  if (!originalTool || originalTool === adaptedTool) {
    return value;
  }

  const pattern = new RegExp(
    `(^|[^a-z0-9])${escapeRegExp(originalTool)}([^a-z0-9]|$)`,
    "gi",
  );

  return value.replace(pattern, `$1${adaptedTool}$2`);
}

function findToolNames(value: string) {
  const lowerValue = value.toLowerCase();

  return availableToolOptions.filter((tool) =>
    lowerValue.includes(tool.toLowerCase()),
  );
}

export function replacePromptToolReferences(
  template: string,
  originalTool: string,
  adaptedTool: string,
): string {
  if (!adaptedTool || originalTool === adaptedTool) {
    return template;
  }

  return findToolNames(originalTool).reduce(
    (nextTemplate, tool) => replaceToolName(nextTemplate, tool, adaptedTool),
    replaceToolName(template, originalTool, adaptedTool),
  );
}

export function injectWorkflowVariables(
  template: string,
  variables: TemplateVariables,
): string {
  return template
    .replaceAll("[STARTUP IDEA]", variables.startupIdea)
    .replaceAll("[INDUSTRY]", variables.industry)
    .replaceAll("[TARGET CUSTOMER]", variables.targetCustomer)
    .replaceAll("[DEADLINE URGENCY]", variables.deadlineUrgency)
    .replaceAll("[PREFERRED AI TOOLS]", variables.preferredAiTools);
}
