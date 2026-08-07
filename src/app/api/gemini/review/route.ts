import { z } from "zod";

import {
  isProposalSectionId,
  proposalReviewFrameworks,
  proposalSectionIds,
  scoreStartupProposalOutput,
} from "@/lib/proposal-review";

const reviewRequestSchema = z.object({
  baselineScore: z.number().int().min(0).max(60).optional(),
  context: z.object({
    aiModel: z.enum(["ChatGPT", "Gemini"]).optional(),
    deadlineUrgency: z.string().trim().max(120),
    industry: z.string().trim().max(200),
    startupIdea: z.string().trim().min(1).max(2000),
    targetCustomer: z.string().trim().max(500).optional(),
  }),
  locale: z.enum(["en", "vi"]).default("en"),
  mode: z.enum(["review", "improve"]).default("review"),
  originalPrompt: z.string().trim().min(1).max(8000),
  output: z.string().trim().min(1).max(12000),
  previousOutput: z.string().trim().max(12000).optional(),
  previousScore: z.number().int().min(0).max(60).optional(),
  section: z.string().trim().min(1).max(120),
  sectionId: z.enum(proposalSectionIds),
  missingInformation: z
    .array(z.string().trim().min(1).max(1000))
    .max(5)
    .optional(),
  suggestions: z.array(z.string().trim().min(1).max(1000)).max(5).optional(),
  weaknesses: z.array(z.string().trim().min(1).max(1000)).max(5).optional(),
});

const geminiDimensionSchema = z.object({
  reason: z.string().trim().min(1).max(1000),
  score: z.number().int().min(0).max(10),
});

const geminiReviewSchema = z.object({
  currentOutputSummary: z.string().trim().min(1).max(1000),
  explanation: z.string().trim().min(1).max(1500),
  missingInformation: z
    .array(z.string().trim().min(1).max(1000))
    .min(0)
    .max(5),
  problematicPassages: z
    .array(
      z.object({
        quote: z.string().trim().min(1).max(1000),
        reason: z.string().trim().min(1).max(1000),
        severity: z.enum(["high", "medium", "low"]),
      }),
    )
    .min(1)
    .max(5),
  previousOutputSummary: z.string().trim().min(1).max(1000).optional(),
  recommendations: z.array(z.string().trim().min(1).max(1000)).min(1).max(3),
  remainingWeaknesses: z
    .array(z.string().trim().min(1).max(1000))
    .min(0)
    .max(3),
  strengthsImproved: z
    .array(z.string().trim().min(1).max(1000))
    .min(0)
    .max(3),
  strengths: z.array(z.string().trim().min(1).max(1000)).min(0).max(5),
  suggestions: z.array(z.string().trim().min(1).max(1000)).min(1).max(5),
  weaknesses: z.array(z.string().trim().min(1).max(1000)).min(0).max(5),
  scores: z.object({
    actionability: geminiDimensionSchema,
    clarity: geminiDimensionSchema,
    completeness: geminiDimensionSchema,
    relevance: geminiDimensionSchema,
    rubricAlignment: geminiDimensionSchema,
    specificity: geminiDimensionSchema,
  }),
});

const geminiImprovementSchema = z.object({
  improvedPrompt: z.string().trim().min(1).max(16000),
  whyBetter: z.string().trim().min(1).max(1500),
});

type GeminiPart = {
  text?: unknown;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: {
    message?: string;
  };
};

const defaultModel = "gemini-3.1-flash-lite";
const serviceUnavailableMessage = "AI service unavailable. Please retry.";

function getApiKey() {
  return process.env.GEMINI_API_KEY;
}

function getModel() {
  return process.env.GEMINI_MODEL ?? defaultModel;
}

function getLanguageInstruction(locale: "en" | "vi") {
  return locale === "vi"
    ? "Return all responses in Vietnamese."
    : "Return all responses in English.";
}

function extractGeminiText(data: GeminiResponse) {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("\n")
      .trim() ?? ""
  );
}

async function readGeminiResponse(response: Response) {
  try {
    return (await response.json()) as GeminiResponse;
  } catch {
    return {
      error: {
        message: serviceUnavailableMessage,
      },
    } satisfies GeminiResponse;
  }
}

function stripJsonFence(value: string) {
  return value
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function extractJsonObject(value: string) {
  const strippedValue = stripJsonFence(value);
  const startIndex = strippedValue.indexOf("{");
  const endIndex = strippedValue.lastIndexOf("}");

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return strippedValue;
  }

  return strippedValue.slice(startIndex, endIndex + 1);
}

function truncateReviewText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3).trimEnd()}...`;
}

function getQuoteTokens(value: string) {
  return (
    value
      .toLocaleLowerCase()
      .match(/[\p{L}\p{N}]+/gu) ?? []
  );
}

function resolvePassageQuote(quote: string, output: string) {
  const exactIndex = output.toLocaleLowerCase().indexOf(quote.toLocaleLowerCase());

  if (exactIndex >= 0) {
    return output.slice(exactIndex, exactIndex + quote.length);
  }

  const quoteTokens = new Set(getQuoteTokens(quote));
  const sentences = output.match(/[^.!?\n]+[.!?]?/g) ?? [];
  let bestMatch = sentences[0]?.trim() ?? "";
  let bestScore = -1;

  sentences.forEach((sentence) => {
    const sentenceTokens = new Set(getQuoteTokens(sentence));
    const overlap = [...quoteTokens].filter((token) => sentenceTokens.has(token)).length;
    const score = quoteTokens.size > 0 ? overlap / quoteTokens.size : 0;

    if (score > bestScore) {
      bestMatch = sentence.trim();
      bestScore = score;
    }
  });

  return bestMatch;
}

function parseReviewJson(value: string, output: string) {
  const parsed: unknown = JSON.parse(extractJsonObject(value));
  const review = geminiReviewSchema.parse(parsed);
  const breakdown = review.scores;
  const total = Object.values(breakdown).reduce(
    (sum, dimension) => sum + dimension.score,
    0,
  );

  return {
    coach: {
      currentOutputSummary: truncateReviewText(
        review.currentOutputSummary,
        360,
      ),
      previousOutputSummary: review.previousOutputSummary
        ? truncateReviewText(review.previousOutputSummary, 360)
        : undefined,
      recommendations: review.recommendations
        .slice(0, 3)
        .map((recommendation) => truncateReviewText(recommendation, 220)),
      remainingWeaknesses: review.remainingWeaknesses
        .slice(0, 3)
        .map((weakness) => truncateReviewText(weakness, 220)),
      strengthsImproved: review.strengthsImproved
        .slice(0, 3)
        .map((strength) => truncateReviewText(strength, 220)),
    },
    missingInformation: review.missingInformation
      .slice(0, 5)
      .map((item) => truncateReviewText(item, 300)),
    problematicPassages: review.problematicPassages
      .slice(0, 5)
      .map((passage) => ({
        quote: resolvePassageQuote(passage.quote, output),
        reason: truncateReviewText(passage.reason, 300),
        severity: passage.severity,
      }))
      .filter((passage) => passage.quote.length > 0),
    score: {
      breakdown,
      explanation: truncateReviewText(review.explanation, 700),
      total,
    },
    strengths: review.strengths
      .slice(0, 5)
      .map((strength) => truncateReviewText(strength, 300)),
    suggestions: review.suggestions
      .slice(0, 5)
      .map((suggestion) => truncateReviewText(suggestion, 300)),
    weaknesses: review.weaknesses
      .slice(0, 5)
      .map((weakness) => truncateReviewText(weakness, 300)),
  };
}

function parseImprovementJson(value: string) {
  const parsed: unknown = JSON.parse(extractJsonObject(value));
  const improvement = geminiImprovementSchema.parse(parsed);

  return {
    improvedPrompt: improvement.improvedPrompt,
    whyBetter: truncateReviewText(improvement.whyBetter, 500),
  };
}

function createCompletenessGuardrails({
  context,
  locale,
  score,
  section,
  sectionId,
  weaknesses,
}: z.infer<typeof reviewRequestSchema> & {
  score: ReturnType<typeof scoreStartupProposalOutput>;
}) {
  const framework = proposalReviewFrameworks[sectionId];
  const weaknessLines =
    weaknesses && weaknesses.length > 0
      ? weaknesses.map((weakness) => `- ${weakness}`).join("\n")
      : [
          `- Relevance: ${score.breakdown.relevance.reason}`,
          `- Specificity: ${score.breakdown.specificity.reason}`,
          `- Clarity: ${score.breakdown.clarity.reason}`,
          `- Completeness: ${score.breakdown.completeness.reason}`,
          `- Rubric alignment: ${score.breakdown.rubricAlignment.reason}`,
          `- Actionability: ${score.breakdown.actionability.reason}`,
        ].join("\n");

  if (locale === "vi") {
    return [
      "Yêu cầu bắt buộc cho output:",
      `- Trước tiên hãy tạo một bản "${section}" đầy đủ, có thể dùng được ngay cho proposal; không chỉ liệt kê phần sửa.`,
      `- Bắt buộc bao phủ các tiêu chí: ${framework.checks.join(", ")}.`,
      `- Giữ đúng bối cảnh: ${context.startupIdea}; ngành ${context.industry}; khách hàng mục tiêu ${context.targetCustomer || "chưa xác định"}; deadline ${context.deadlineUrgency}.`,
      "- Bổ sung chi tiết cụ thể: số liệu hoặc giả định đo được, hành vi khách hàng, ví dụ, mức độ đau, bằng chứng/validation, bước test hoặc quyết định tiếp theo. Nếu chưa chắc, đánh dấu [VERIFY].",
      "- Sau bản đầy đủ, thêm mục ngắn 'Những điểm đã sửa và bổ sung' để chỉ rõ output mới đã sửa gì so với output trước.",
      "- Dùng heading rõ ràng, bullet hoặc bảng gọn để output dễ scan và dễ chấm điểm.",
      "- Chỉ tập trung vào section hiện tại, không viết lan sang các section khác.",
      "",
      "Các điểm yếu bắt buộc phải sửa:",
      weaknessLines,
    ].join("\n");
  }

  return [
    "Non-negotiable output requirements:",
    `- First generate a complete revised "${section}" section that is usable for the proposal; do not only list fixes.`,
    `- Cover every required check: ${framework.checks.join(", ")}.`,
    `- Preserve this context: ${context.startupIdea}; industry ${context.industry}; target customer ${context.targetCustomer || "not specified"}; deadline ${context.deadlineUrgency}.`,
    "- Add concrete details: measurable numbers or assumptions, customer behavior, examples, pain intensity, evidence/validation, test steps, or next decisions. Mark uncertain claims with [VERIFY].",
    "- After the complete section, add a short 'Fixes and additions' checklist explaining what changed compared with the previous output.",
    "- Use clear headings, bullets, or a compact table so the output is easy to scan and score.",
    "- Stay focused on the current proposal section only; do not drift into unrelated sections.",
    "",
    "Weaknesses that must be fixed:",
    weaknessLines,
  ].join("\n");
}

function attachCompletenessGuardrails({
  improvement,
  request,
  score,
}: {
  improvement: ReturnType<typeof parseImprovementJson>;
  request: z.infer<typeof reviewRequestSchema>;
  score: ReturnType<typeof scoreStartupProposalOutput>;
}) {
  const guardrails = createCompletenessGuardrails({
    ...request,
    score,
  });
  const completenessReason =
    request.locale === "vi"
      ? "Prompt này cũng yêu cầu AI tạo bản đầy đủ trước, sau đó mới liệt kê các điểm đã sửa và bổ sung để retry output không bị hẹp hơn bản ban đầu."
      : "It also requires the AI to generate the full revised section first, then list fixes and additions so the retry output is not narrower than the baseline.";

  return {
    ...improvement,
    improvedPrompt: `${improvement.improvedPrompt.trim()}\n\n${guardrails}`.trim(),
    whyBetter: truncateReviewText(
      `${improvement.whyBetter} ${completenessReason}`,
      700,
    ),
  };
}

function createGeminiWeaknessPrompt({
  context,
  locale,
  originalPrompt,
  output,
  previousOutput,
  previousScore,
  section,
  sectionId,
}: z.infer<typeof reviewRequestSchema>) {
  const framework = proposalReviewFrameworks[sectionId];

  return [
    "You are RootAccess, a domain-specific Startup Proposal reviewer for FPT University students.",
    "Your job is to score the output and perform evidence-based Weakness Detection plus concise AI Coach feedback.",
    "Score each of the six dimensions from 0 to 10. Use only evidence in the output and project context.",
    "For every dimension, explain WHY it received that score. Name the concrete gap instead of repeating the dimension name.",
    "Rubric Alignment means whether the output addresses the section-specific framework checks listed below.",
    "Completeness means whether the section contains enough connected information to be usable, not whether it is merely long.",
    "problematicPassages must contain at least one item. Quote exact short text from the output so Root Access can highlight it. Never paraphrase the quote. For a strong output, select the least effective passage and use low severity.",
    "Do not write the final proposal section for the user.",
    "Do not improve the prompt yet.",
    "Do not give generic writing feedback. Focus only on startup business logic.",
    "Make the feedback feel like a mentor coaching the student.",
    "If there is no previous output, compare against the project objective and explain the current state.",
    "If a previous output exists, explain what improved, what is still weak, and what the student should do next.",
    getLanguageInstruction(locale),
    "",
    "Return ONLY valid JSON matching this exact shape:",
    JSON.stringify(
      {
        currentOutputSummary: "one-sentence summary of the current output",
        explanation: "concise explanation of the overall quality and biggest score drivers",
        scores: {
          relevance: { score: 0, reason: "why, using output evidence" },
          clarity: { score: 0, reason: "why, using output evidence" },
          specificity: { score: 0, reason: "why, using output evidence" },
          completeness: { score: 0, reason: "why, using output evidence" },
          actionability: { score: 0, reason: "why, using output evidence" },
          rubricAlignment: { score: 0, reason: "why, using framework checks" },
        },
        strengths: ["specific strength supported by the output"],
        weaknesses: ["specific weakness and why it matters"],
        missingInformation: ["missing fact, evidence, assumption, or decision"],
        suggestions: ["concrete action that addresses a named weakness"],
        problematicPassages: [
          {
            quote: "exact short quote copied from the output",
            reason: "why this passage is problematic",
            severity: "high",
          },
        ],
        previousOutputSummary:
          "one-sentence summary of previous output, or omit when none",
        recommendations: [
          "maximum three concrete mentor recommendations",
          "do not repeat generic advice",
        ],
        remainingWeaknesses: [
          "remaining weakness 1",
          "remaining weakness 2",
        ],
        strengthsImproved: [
          "specific strength or improvement 1",
          "specific strength or improvement 2",
        ],
      },
      null,
      2,
    ),
    "",
    `Proposal section: ${section}`,
    `Review framework: ${framework.title}`,
    `Framework checks: ${framework.checks.join(", ")}`,
    `Previous score, if retry: ${previousScore ?? "none"}`,
    `Previous output available: ${previousOutput ? "yes" : "no"}`,
    "",
    "Project context:",
    `- Startup idea: ${context.startupIdea}`,
    `- Industry: ${context.industry}`,
    `- Target customer: ${context.targetCustomer || "not specified"}`,
    `- Deadline urgency: ${context.deadlineUrgency}`,
    "",
    "Original prompt:",
    originalPrompt,
    "",
    "Previous output, if any:",
    previousOutput || "none",
    "",
    "Current generated output to review:",
    output,
  ].join("\n");
}

function createGeminiImprovementPrompt({
  baselineScore,
  context,
  locale,
  originalPrompt,
  output,
  score,
  section,
  sectionId,
  missingInformation,
  suggestions,
  weaknesses,
}: z.infer<typeof reviewRequestSchema> & {
  score: ReturnType<typeof scoreStartupProposalOutput>;
}) {
  const framework = proposalReviewFrameworks[sectionId];
  const targetAi = context.aiModel ?? "ChatGPT/Gemini";
  const weaknessList =
    weaknesses && weaknesses.length > 0
      ? weaknesses.map((weakness) => `- ${weakness}`).join("\n")
      : "- Use the deterministic score breakdown to target the weakest dimensions.";
  const missingInformationList =
    missingInformation && missingInformation.length > 0
      ? missingInformation.map((item) => `- ${item}`).join("\n")
      : "- No additional missing information was provided.";
  const suggestionList =
    suggestions && suggestions.length > 0
      ? suggestions.map((item) => `- ${item}`).join("\n")
      : "- No additional suggestions were provided.";

  return [
    "You are RootAccess, a domain-specific Startup Proposal prompt coach for FPT University students.",
    "Your job is only Prompt Improvement.",
    "Do not write the final proposal section for the user.",
    `Create a better prompt the user can copy into ${targetAi}.`,
    "The improved prompt must be a real operational prompt, not a short suggestion.",
    "The improved prompt must preserve the original task intent, project context, proposal section, and output language.",
    "The improved prompt must explicitly fix the exact gaps shown by the reviewed output and weaknesses list.",
    "The improved prompt must ask the target AI to generate a complete revised section first, then a short list of fixes and additions.",
    "The target AI must be allowed and required to produce enough complete information to score better than the baseline, not merely patch isolated weaknesses.",
    "The improved prompt must follow good AI prompting structure: Role, Context, Task, Constraints, Missing items to fix, Output format, and Quality checklist.",
    "Do not create generic instructions such as 'make it better' or 'be more specific' unless they are tied to a concrete missing detail.",
    "Do not add unsupported facts. Require the AI tool to mark assumptions with [VERIFY].",
    "The prompt must guide the AI tool to produce comprehensive revised working material for the proposal section, not a polished final essay.",
    "If a baseline score is provided, design the prompt specifically to improve that baseline by targeting the weakest score dimensions.",
    "Before returning, internally validate: Does this improved prompt directly address each listed weakness and each low scoring dimension? If not, revise it before returning JSON.",
    getLanguageInstruction(locale),
    "",
    "Return ONLY valid JSON matching this exact shape:",
    JSON.stringify(
      {
        improvedPrompt:
          "copy-ready prompt with Role, Context, Task, Constraints, Missing items to fix, Output format, and Quality checklist. It must ask for a complete revised section plus fixes/additions.",
        whyBetter:
          "short reason naming which original output weaknesses this prompt now fixes and why it should produce a fuller output",
      },
      null,
      2,
    ),
    "",
    `Proposal section: ${section}`,
    `Review framework: ${framework.title}`,
    `Framework checks: ${framework.checks.join(", ")}`,
    `Target AI tool: ${targetAi}`,
    `Baseline score before improvement: ${baselineScore ?? score.total}/60`,
    "",
    "Weaknesses to fix:",
    weaknessList,
    "",
    "Missing information that the next output must add or clearly mark [VERIFY]:",
    missingInformationList,
    "",
    "Review suggestions to apply:",
    suggestionList,
    "",
    "Deterministic score breakdown:",
    `- Relevance: ${score.breakdown.relevance.score}/10. Why this score? ${score.breakdown.relevance.reason}`,
    `- Specificity: ${score.breakdown.specificity.score}/10. Why this score? ${score.breakdown.specificity.reason}`,
    `- Clarity: ${score.breakdown.clarity.score}/10. Why this score? ${score.breakdown.clarity.reason}`,
    `- Completeness: ${score.breakdown.completeness.score}/10. Why this score? ${score.breakdown.completeness.reason}`,
    `- Actionability: ${score.breakdown.actionability.score}/10. Why this score? ${score.breakdown.actionability.reason}`,
    `- Rubric alignment: ${score.breakdown.rubricAlignment.score}/10. Why this score? ${score.breakdown.rubricAlignment.reason}`,
    `- Total: ${score.total}/60`,
    "",
    "Required improved prompt behavior:",
    "- Start with a clear role for the AI tool.",
    "- Include the project context as fixed inputs, not optional background.",
    "- State the exact proposal section task.",
    "- Require the AI tool to produce a complete revised section first, with enough information to stand alone.",
    "- Add a 'Fix these issues from my previous output' block using the weaknesses and score reasons above.",
    "- Require concrete details, examples, assumptions, validation logic, or next actions based on the weakest dimensions.",
    "- Require an explicit 'Fixes and additions' section after the revised section so the user can see what changed.",
    "- Require a compact structured output, such as bullets or a table, when useful.",
    "- Require the AI tool to avoid generic advice, unsupported numbers, and final-essay prose.",
    "- Require a final self-check before the AI tool answers.",
    "",
    "Project context:",
    `- Startup idea: ${context.startupIdea}`,
    `- Industry: ${context.industry}`,
    `- Target customer: ${context.targetCustomer || "not specified"}`,
    `- Deadline urgency: ${context.deadlineUrgency}`,
    "",
    "Prompt to improve:",
    originalPrompt,
    "",
    "Output that needs a stronger prompt:",
    output,
  ].join("\n");
}

async function callGemini({
  apiKey,
  maxOutputTokens,
  model,
  prompt,
  systemInstruction,
}: {
  apiKey: string;
  maxOutputTokens: number;
  model: string;
  prompt: string;
  systemInstruction: string;
}) {
  let response: Response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens,
            responseMimeType: "application/json",
            temperature: 0.2,
          },
          systemInstruction: {
            parts: [
              {
                text: systemInstruction,
              },
            ],
          },
        }),
      },
    );
  } catch {
    return {
      error: serviceUnavailableMessage,
      status: 502,
    };
  }

  const data = await readGeminiResponse(response);

  if (!response.ok) {
    return {
      error: data.error?.message ?? serviceUnavailableMessage,
      status: response.status,
    };
  }

  const text = extractGeminiText(data);

  if (!text) {
    return {
      error: serviceUnavailableMessage,
      status: 502,
    };
  }

  return {
    status: 200,
    text,
  };
}

export async function POST(request: Request) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return Response.json(
      {
        code: "missing_api_key",
        message: serviceUnavailableMessage,
      },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        code: "invalid_json",
        message: "Request body must be valid JSON.",
      },
      { status: 400 },
    );
  }

  const parsedBody = reviewRequestSchema.safeParse(body);

  if (!parsedBody.success || !isProposalSectionId(parsedBody.data.sectionId)) {
    return Response.json(
      {
        code: "invalid_request",
        message: "Review input is invalid.",
      },
      { status: 400 },
    );
  }

  const deterministicScore = scoreStartupProposalOutput({
    context: parsedBody.data.context,
    output: parsedBody.data.output,
    sectionId: parsedBody.data.sectionId,
  });
  const model = getModel();
  const maxOutputTokens = parsedBody.data.mode === "improve" ? 1800 : 1400;
  const prompt =
    parsedBody.data.mode === "improve"
      ? createGeminiImprovementPrompt({
          ...parsedBody.data,
          score: deterministicScore,
        })
      : createGeminiWeaknessPrompt({
          ...parsedBody.data,
        });
  const systemInstruction =
    parsedBody.data.mode === "improve"
      ? "You create copy-ready, structured AI prompts for startup proposal work. You never write final proposal content, never score outputs, and every improved prompt must ask for a complete revised section plus concrete fixes and additions that address the reviewed output's weaknesses."
      : "You are an evidence-based Startup Proposal evaluator. You score six rubric dimensions, detect specific weaknesses and missing information, quote exact problematic passages, and coach students concisely. You never write final proposal content or improve prompts.";
  const geminiResult = await callGemini({
    apiKey,
    maxOutputTokens,
    model,
    prompt,
    systemInstruction,
  });

  if ("error" in geminiResult) {
    return Response.json(
      {
        code: "gemini_error",
        message: geminiResult.error,
      },
      { status: geminiResult.status },
    );
  }

  try {
    if (parsedBody.data.mode === "improve") {
      const improvement = attachCompletenessGuardrails({
        improvement: parseImprovementJson(geminiResult.text),
        request: parsedBody.data,
        score: deterministicScore,
      });

      return Response.json({
        improvement,
        model,
      });
    }

    const geminiReview = parseReviewJson(
      geminiResult.text,
      parsedBody.data.output,
    );

    return Response.json({
      model,
      review: {
        coach: geminiReview.coach,
        frameworkChecks:
          proposalReviewFrameworks[parsedBody.data.sectionId].checks,
        frameworkTitle:
          proposalReviewFrameworks[parsedBody.data.sectionId].title,
        missingInformation: geminiReview.missingInformation,
        problematicPassages: geminiReview.problematicPassages,
        score: geminiReview.score,
        strengths: geminiReview.strengths,
        suggestions: geminiReview.suggestions,
        weaknesses: geminiReview.weaknesses,
      },
    });
  } catch {
    return Response.json(
      {
        code: "invalid_gemini_json",
        message: serviceUnavailableMessage,
      },
      { status: 502 },
    );
  }
}
