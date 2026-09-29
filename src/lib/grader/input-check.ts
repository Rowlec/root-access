export type InputCheckResult =
  | { valid: false; reason: "TOO_SHORT" | "OUTPUT_IS_PROMPT"; message: string }
  | { valid: true; text: string; truncatedWarning?: string };

function tokenizeText(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .trim();
  const words = normalized.split(/\s+/).filter((w) => w.length > 1);
  return new Set(words);
}

export function computeJaccardSimilarity(textA: string, textB: string): number {
  const setA = tokenizeText(textA);
  const setB = tokenizeText(textB);

  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const word of setA) {
    if (setB.has(word)) {
      intersectionSize++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

export function validateGradeInput(
  outputText: string,
  lastPromptText?: string | null,
): InputCheckResult {
  const trimmed = outputText.trim();

  // 1. TOO_SHORT check (< 150 characters)
  if (trimmed.length < 150) {
    return {
      valid: false,
      reason: "TOO_SHORT",
      message: "Câu trả lời quá ngắn để chấm.",
    };
  }

  // 2. OUTPUT_IS_PROMPT check (Jaccard similarity >= 60%)
  if (lastPromptText) {
    const similarity = computeJaccardSimilarity(trimmed, lastPromptText);
    if (similarity >= 0.6) {
      return {
        valid: false,
        reason: "OUTPUT_IS_PROMPT",
        message:
          "Có vẻ đây là prompt chứ không phải câu trả lời của AI. Hãy gửi prompt rồi chấm câu trả lời.",
      };
    }
  }

  // 3. TOO_LONG check (> 20,000 characters)
  if (trimmed.length > 20000) {
    return {
      valid: true,
      text: trimmed.slice(0, 20000),
      truncatedWarning:
        "Câu trả lời dài hơn 20.000 ký tự và đã được tự động cắt bớt phần thừa.",
    };
  }

  return {
    valid: true,
    text: trimmed,
  };
}
