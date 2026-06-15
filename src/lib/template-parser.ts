export interface TemplateVariables {
  startupIdea: string;
  industry: string;
}

export function injectWorkflowVariables(
  template: string,
  variables: TemplateVariables,
): string {
  return template
    .replaceAll("[STARTUP IDEA]", variables.startupIdea)
    .replaceAll("[INDUSTRY]", variables.industry);
}
