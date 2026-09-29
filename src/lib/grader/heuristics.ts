import { WarningItem } from "./types";

interface ProjectDataContext {
  name?: string;
  idea?: string;
  targetCustomer?: string;
  availableData?: Record<string, unknown> | null;
  userInputData?: Record<string, unknown> | null;
}

function extractKnownNumbers(context: ProjectDataContext): Set<string> {
  const known = new Set<string>();

  const textToScan = [
    context.name ?? "",
    context.idea ?? "",
    context.targetCustomer ?? "",
    JSON.stringify(context.availableData ?? {}),
    JSON.stringify(context.userInputData ?? {}),
  ].join(" ");

  // Find all numbers in the known project context
  const matches = textToScan.match(/\d+([.,]\d+)?/g) || [];
  for (const m of matches) {
    const clean = m.replace(/[.,]/g, "");
    known.add(clean);
    known.add(m);
  }

  // Also add common benign values: years 2024-2027, small numbers <= 10
  const currentYear = new Date().getFullYear();
  for (let y = currentYear - 2; y <= currentYear + 3; y++) {
    known.add(String(y));
  }
  for (let i = 0; i <= 10; i++) {
    known.add(String(i));
  }

  return known;
}

export function detectCodeWarnings(
  outputText: string,
  context: ProjectDataContext,
): WarningItem[] {
  const warnings: WarningItem[] = [];
  const knownNumbers = extractKnownNumbers(context);

  // Split into sentences
  const sentences = outputText
    .split(/(?<=[.!?\n])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  // 1. PLACEHOLDER Detection: [CẦN DỮ LIỆU, [X], XXX, [Tên]
  const placeholderRegex = /\[CẦN DỮ LIỆU[^\]]*\]|\[X\]|XXX|\[Tên[^\]]*\]/gi;
  const placeholderMatches = outputText.match(placeholderRegex) || [];
  if (placeholderMatches.length > 0) {
    warnings.push({
      type: "PLACEHOLDER",
      message: `Còn ${placeholderMatches.length} chỗ cần bổ sung dữ liệu (đây là tín hiệu tốt giúp tránh bịa số liệu).`,
    });
  }

  // 2. ASSUMPTION Detection: [GIẢ ĐỊNH]
  const assumptionMatches = outputText.match(/\[GIẢ ĐỊNH[^\]]*\]/gi) || [];
  if (assumptionMatches.length > 0) {
    warnings.push({
      type: "ASSUMPTION",
      message: `${assumptionMatches.length} giả định cần kiểm chứng trước khi nộp.`,
    });
  }

  // 3. POSSIBLY_INVENTED_NUMBER and UNSOURCED_NUMBER
  // Regex for specific number patterns: e.g. 45%, 100k, 5 triệu, 2 tỷ, 500 sinh viên, 50 người
  const numberPhraseRegex =
    /(\d+([.,]\d+)?\s*(%|phần trăm|triệu|tỷ|nghìn|ngàn|k|vnd|đ|usd|\$|khách hàng|người|sinh viên|doanh nghiệp|lượt))/gi;

  const sourceKeywords = [
    "theo",
    "nguồn",
    "khảo sát",
    "báo cáo",
    "thống kê",
    "nghiên cứu",
    "source",
  ];

  let inventedNumberCount = 0;

  for (const sentence of sentences) {
    const matches = Array.from(sentence.matchAll(numberPhraseRegex));
    if (matches.length === 0) continue;

    const lowerSentence = sentence.toLowerCase();
    const hasSource =
      sourceKeywords.some((kw) => lowerSentence.includes(kw)) ||
      /\(20\d\d\)/.test(sentence);

    for (const match of matches) {
      const phrase = match[0];
      const digitsMatch = phrase.match(/\d+([.,]\d+)?/);
      if (!digitsMatch) continue;

      const numStr = digitsMatch[0];
      const cleanNum = numStr.replace(/[.,]/g, "");
      const val = parseFloat(numStr.replace(",", "."));

      // Check if known or benign
      const isKnown =
        knownNumbers.has(numStr) ||
        knownNumbers.has(cleanNum) ||
        (val <= 10 && !phrase.includes("%") && !phrase.includes("triệu") && !phrase.includes("tỷ"));

      if (!isKnown && inventedNumberCount < 2) {
        inventedNumberCount++;
        warnings.push({
          type: "POSSIBLY_INVENTED_NUMBER",
          message: `Số liệu này không có trong dữ liệu của nhóm. Kiểm tra lại hoặc thay bằng dữ liệu thật: "${phrase}"`,
          quote: sentence.length > 180 ? sentence.slice(0, 180) + "..." : sentence,
        });
      }
    }

    // UNSOURCED_NUMBER check: sentence has % or money, but no source
    const hasPercentOrMoney =
      /(\d+([.,]\d+)?\s*(%|phần trăm|triệu|tỷ|nghìn|ngàn|k|vnd|đ|usd|\$))/i.test(
        sentence,
      );
    if (hasPercentOrMoney && !hasSource && warnings.filter((w) => w.type === "UNSOURCED_NUMBER").length < 2) {
      warnings.push({
        type: "UNSOURCED_NUMBER",
        message: "Số liệu chưa ghi nguồn cụ thể (khảo sát của nhóm hay trích dẫn từ báo cáo nào).",
        quote: sentence.length > 180 ? sentence.slice(0, 180) + "..." : sentence,
      });
    }
  }

  return warnings;
}
