import { z } from "zod";

import {
  isProposalSectionId,
  proposalReviewFrameworks,
  proposalSectionIds,
  scoreStartupProposalOutput,
} from "@/lib/proposal-review";

const reviewRequestSchema = z.object({
  baselineScore: z.number().int().min(0).max(40).optional(),
  context: z.object({
    aiModel: z.enum(["ChatGPT", "Gemini"]).optional(),
    deadlineUrgency: z.string().trim().max(120),
    industry: z.string().trim().max(200),
    startupIdea: z.string().trim().min(1).max(2000),
    targetCustomer: z.string().trim().max(500).optional(),
  }),
  locale: z.enum(["en", "vi"]).default("en"),
  mode: z.enum(["review", "improve"]).default("review"),
  originalPrompt: z.string().trim().min(1).max(12000),
  output: z.string().trim().min(1).max(20000),
  previousOutput: z.string().trim().max(20000).optional(),
  previousScore: z.number().int().min(0).max(40).optional(),
  section: z.string().trim().min(1).max(120),
  sectionId: z.enum(proposalSectionIds),
  weaknesses: z.array(z.string().trim().min(1).max(1000)).max(5).optional(),
});

const geminiReviewSchema = z.object({
  currentOutputSummary: z.string().trim().min(1).max(1000),
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
  weaknesses: z.array(z.string().trim().min(1).max(1000)).min(0).max(5),
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

function parseReviewJson(value: string) {
  const parsed: unknown = JSON.parse(extractJsonObject(value));
  const review = geminiReviewSchema.parse(parsed);

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
    weaknesses: review.weaknesses
      .slice(0, 2)
      .map((weakness) => truncateReviewText(weakness, 240)),
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
  score,
  section,
  sectionId,
}: z.infer<typeof reviewRequestSchema> & {
  score: ReturnType<typeof scoreStartupProposalOutput>;
}) {
  const framework = proposalReviewFrameworks[sectionId];

  return [
    "You are RootAccess, a domain-specific Startup Proposal reviewer for FPT University students.",
    "The deterministic scoring engine has already scored the output. Do not change, invent, or mention new scores.",
    "Your job is Weakness Detection plus concise AI Coach feedback.",
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
        weaknesses: ["top business weakness 1", "top business weakness 2"],
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
    "Deterministic score breakdown:",
    `- Relevance: ${score.breakdown.relevance.score}/10. Why this score? ${score.breakdown.relevance.reason}`,
    `- Specificity: ${score.breakdown.specificity.score}/10. Why this score? ${score.breakdown.specificity.reason}`,
    `- Clarity: ${score.breakdown.clarity.score}/10. Why this score? ${score.breakdown.clarity.reason}`,
    `- Actionability: ${score.breakdown.actionability.score}/10. Why this score? ${score.breakdown.actionability.reason}`,
    `- Total: ${score.total}/40`,
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
    "Pasted AI output to review:",
    output,
  ].join("\n");
}

function createGeminiImprovementPrompt({
  baselineScore,
  context,
  locale,
  originalPrompt,
  output,
  previousOutput,
  score,
  section,
  sectionId,
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
    `Baseline score before improvement: ${baselineScore ?? score.total}/40`,
    "",
    "Weaknesses to fix:",
    weaknessList,
    "",
    "Deterministic score breakdown:",
    `- Relevance: ${score.breakdown.relevance.score}/10. Why this score? ${score.breakdown.relevance.reason}`,
    `- Specificity: ${score.breakdown.specificity.score}/10. Why this score? ${score.breakdown.specificity.reason}`,
    `- Clarity: ${score.breakdown.clarity.score}/10. Why this score? ${score.breakdown.clarity.reason}`,
    `- Actionability: ${score.breakdown.actionability.score}/10. Why this score? ${score.breakdown.actionability.reason}`,
    `- Total: ${score.total}/40`,
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
    "Original/baseline output, if available:",
    previousOutput || output,
    "",
    "Current AI output that exposed the weaknesses:",
    output,
  ].join("\n");
}

async function callGemini({
  apiKey,
  model,
  prompt,
  systemInstruction,
}: {
  apiKey: string;
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
            responseMimeType: "application/json",
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
  const prompt =
    parsedBody.data.mode === "improve"
      ? createGeminiImprovementPrompt({
          ...parsedBody.data,
          score: deterministicScore,
        })
      : createGeminiWeaknessPrompt({
          ...parsedBody.data,
          score: deterministicScore,
        });
  const geminiResult = await callGemini({
    apiKey,
    model,
    prompt,
    systemInstruction:
      parsedBody.data.mode === "improve"
        ? "You create copy-ready, structured AI prompts for startup proposal work. You never write final proposal content, never score outputs, and every improved prompt must ask for a complete revised section plus concrete fixes and additions that address the reviewed output's weaknesses."
        : "You detect startup proposal weaknesses and coach students with concise comparisons. You never write final proposal content, improve prompts, or score outputs.",
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

    const geminiReview = parseReviewJson(geminiResult.text);

    return Response.json({
      model,
      review: {
        coach: geminiReview.coach,
        frameworkChecks: deterministicScore.frameworkChecks,
        frameworkTitle: deterministicScore.frameworkTitle,
        score: deterministicScore,
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
