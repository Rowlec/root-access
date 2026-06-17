import {
  availableToolOptions,
  type AvailableTool,
} from "@/lib/goal-form-schema";

const defaultFallbackTool: AvailableTool = "Other";

const toolFallbacks: Partial<Record<AvailableTool, readonly AvailableTool[]>> = {
  Claude: ["ChatGPT", "Gemini"],
  Gamma: ["Canva AI"],
  Perplexity: ["Gemini", "ChatGPT"],
  Lovable: ["ChatGPT"],
};

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
  const normalizedTools = availableTools.filter(isAvailableTool);

  return Array.from(new Set(normalizedTools));
}

function findFirstAvailableTool(
  candidates: readonly AvailableTool[],
  availableTools: readonly AvailableTool[],
) {
  return candidates.find((candidate) => availableTools.includes(candidate));
}

export function mapTool(
  originalTool: string,
  availableTools: readonly string[],
): AvailableTool {
  const normalizedAvailableTools = normalizeAvailableTools(availableTools);
  const knownOriginalTool = findKnownTool(originalTool);

  if (knownOriginalTool && normalizedAvailableTools.includes(knownOriginalTool)) {
    return knownOriginalTool;
  }

  if (knownOriginalTool) {
    const mappedTool = findFirstAvailableTool(
      toolFallbacks[knownOriginalTool] ?? [],
      normalizedAvailableTools,
    );

    if (mappedTool) {
      return mappedTool;
    }
  }

  return normalizedAvailableTools[0] ?? defaultFallbackTool;
}
