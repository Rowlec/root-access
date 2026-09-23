export function createProposalRunId({
  idea,
  industry,
  locale,
  targetCustomer,
}: {
  idea: string;
  industry: string;
  locale: string;
  targetCustomer: string;
}) {
  const source = JSON.stringify({ idea, industry, targetCustomer, locale });
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0;
  }

  return hash.toString(36);
}
