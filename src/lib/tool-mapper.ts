import {
  availableToolOptions,
  type AvailableTool,
} from "@/lib/goal-form-schema";

const defaultTool: AvailableTool = "ChatGPT";
const structuredIntentTool: AvailableTool = "Gemini";

const validTools = new Set<string>(availableToolOptions);

function isAvailableTool(tool: string): tool is AvailableTool {
  return validTools.has(tool);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toolAppearsInName(toolName: string, tool: AvailableTool) {
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(tool)}([^a-z0-9]|$)`, "i");

  return pattern.test(toolName);
}

function findKnownTool(toolName: string) {
  const trimmedToolName = toolName.trim();

  return (
    availableToolOptions.find(
      (tool) => tool.toLowerCase() === trimmedToolName.toLowerCase(),
    ) ??
    availableToolOptions.find((tool) => toolAppearsInName(trimmedToolName, tool)) ??
    null
  );
}

function normalizeAvailableTools(availableTools: readonly string[]) {
  return Array.from(new Set(availableTools.filter(isAvailableTool)));
}

function hasStructuredIntent(toolName: string) {
  return /\b(compare|competitor|fact|market|organize|pricing|research|segment|source|structure|verify)\b/i.test(
    toolName,
  );
}

export function mapTool(
  originalTool: string,
  availableTools: readonly string[],
): AvailableTool {
  const normalizedAvailableTools = normalizeAvailableTools(availableTools);
  const knownOriginalTool = findKnownTool(originalTool);

  if (normalizedAvailableTools.length === 0) {
    return knownOriginalTool ?? (hasStructuredIntent(originalTool) ? structuredIntentTool : defaultTool);
  }

  if (
    knownOriginalTool &&
    normalizedAvailableTools.includes(knownOriginalTool)
  ) {
    return knownOriginalTool;
  }

  if (
    hasStructuredIntent(originalTool) &&
    normalizedAvailableTools.includes(structuredIntentTool)
  ) {
    return structuredIntentTool;
  }

  return normalizedAvailableTools[0] ?? defaultTool;
}
