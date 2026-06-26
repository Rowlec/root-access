import type { WorkflowStep } from "../../types";

export type WorkflowExportFormat = "markdown" | "text";

export type WorkflowExportStep = {
  step: WorkflowStep;
  promptDraft: string;
  outputDraft: string;
};

export type WorkflowExportLabels = {
  generatedBy: string;
  goal: string;
  milestone: string;
  noOutput: string;
  output: string;
  promptUsed: string;
  recommendedTool: string;
};

function getStepOutput(step: WorkflowExportStep, labels: WorkflowExportLabels) {
  const outputDraft = step.outputDraft.trim();

  return outputDraft.length > 0 ? outputDraft : labels.noOutput;
}

function formatMarkdownStep(
  exportStep: WorkflowExportStep,
  labels: WorkflowExportLabels,
) {
  const { step, promptDraft } = exportStep;

  return [
    `## ${labels.milestone} ${step.id}: ${step.title}`,
    `**${labels.goal}:** ${step.goal}`,
    `**${labels.recommendedTool}:** ${step.tool}`,
    `### ${labels.output}`,
    getStepOutput(exportStep, labels),
    `### ${labels.promptUsed}`,
    "```text",
    promptDraft.trim(),
    "```",
  ].join("\n\n");
}

function formatTextStep(
  exportStep: WorkflowExportStep,
  labels: WorkflowExportLabels,
) {
  const { step, promptDraft } = exportStep;

  return [
    `${labels.milestone} ${step.id}: ${step.title}`,
    `${labels.goal}: ${step.goal}`,
    `${labels.recommendedTool}: ${step.tool}`,
    "",
    labels.output,
    "-".repeat(labels.output.length),
    getStepOutput(exportStep, labels),
    "",
    labels.promptUsed,
    "-".repeat(labels.promptUsed.length),
    promptDraft.trim(),
  ].join("\n");
}

export function formatStepExport({
  format,
  labels,
  step,
}: {
  format: WorkflowExportFormat;
  labels: WorkflowExportLabels;
  step: WorkflowExportStep;
}) {
  return format === "markdown"
    ? formatMarkdownStep(step, labels)
    : formatTextStep(step, labels);
}

export function formatWorkflowExport({
  format,
  labels,
  steps,
  workflowTitle,
}: {
  format: WorkflowExportFormat;
  labels: WorkflowExportLabels;
  steps: WorkflowExportStep[];
  workflowTitle: string;
}) {
  const formattedSteps = steps.map((step) =>
    formatStepExport({ format, labels, step }),
  );

  if (format === "markdown") {
    return [
      `# ${workflowTitle}`,
      labels.generatedBy,
      ...formattedSteps,
    ].join("\n\n---\n\n");
  }

  return [
    workflowTitle,
    labels.generatedBy,
    "",
    ...formattedSteps,
  ].join("\n\n");
}

export function createExportFileName(title: string, extension: "md" | "txt") {
  const slug = title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${slug || "root-access-export"}.${extension}`;
}
