export function getUniqueAnalyticsTools(tools: readonly string[]) {
  return Array.from(
    new Set(tools.filter((tool) => tool.trim().length > 0)),
  );
}

export function formatAnalyticsTools(tools: readonly string[]) {
  return getUniqueAnalyticsTools(tools).join(", ");
}
