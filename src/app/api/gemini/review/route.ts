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
    deadlineUrgency: z.string().trim().max(120),
    industry: z.string().trim().max(200),
    startupIdea: z.string().trim().min(1).max(2000),
    targetCustomer: z.string().trim().max(500).optional(),
  }),
  locale: z.enum(["en", "vi"]).default("en"),
  mode: z.enum(["review", "improve"]).default("review"),
  originalPrompt: z.string().trim().min(1).max(12000),
  output: z.string().trim().min(1).max(20000),
  previousScore: z.number().int().min(0).max(40).optional(),
  section: z.string().trim().min(1).max(120),
  sectionId: z.enum(proposalSectionIds),
  weaknesses: z.array(z.string().trim().min(1).max(1000)).max(5).optional(),
});

const geminiWeaknessSchema = z.object({
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

function parseWeaknessJson(value: string) {
  const parsed: unknown = JSON.parse(extractJsonObject(value));
  const review = geminiWeaknessSchema.parse(parsed);

  return {
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

function createGeminiWeaknessPrompt({
  context,
  locale,
  originalPrompt,
  output,
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
    "Your job is only Weakness Detection.",
    "Do not write the final proposal section for the user.",
    "Do not improve the prompt yet.",
    "Do not give generic writing feedback. Focus only on startup business logic.",
    getLanguageInstruction(locale),
    "",
    "Return ONLY valid JSON matching this exact shape:",
    JSON.stringify(
      {
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
  score,
  section,
  sectionId,
  weaknesses,
}: z.infer<typeof reviewRequestSchema> & {
  score: ReturnType<typeof scoreStartupProposalOutput>;
}) {
  const framework = proposalReviewFrameworks[sectionId];
  const weaknessList =
    weaknesses && weaknesses.length > 0
      ? weaknesses.map((weakness) => `- ${weakness}`).join("\n")
      : "- Use the deterministic score breakdown to target the weakest dimensions.";

  return [
    "You are RootAccess, a domain-specific Startup Proposal prompt coach for FPT University students.",
    "Your job is only Prompt Improvement.",
    "Do not write the final proposal section for the user.",
    "Create a better prompt the user can copy into ChatGPT or Gemini.",
    "The improved prompt must target relevance, specificity, clarity, and actionability.",
    "If a baseline score is provided, the prompt must be designed to improve that baseline.",
    "Before returning, internally validate: Does this improved prompt actually improve specificity, relevance, clarity, or actionability? If not, revise it before returning JSON.",
    getLanguageInstruction(locale),
    "",
    "Return ONLY valid JSON matching this exact shape:",
    JSON.stringify(
      {
        improvedPrompt: "better prompt the user can copy into ChatGPT/Gemini",
        whyBetter: "short reason why the prompt is better",
      },
      null,
      2,
    ),
    "",
    `Proposal section: ${section}`,
    `Review framework: ${framework.title}`,
    `Framework checks: ${framework.checks.join(", ")}`,
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
    "Project context:",
    `- Startup idea: ${context.startupIdea}`,
    `- Industry: ${context.industry}`,
    `- Target customer: ${context.targetCustomer || "not specified"}`,
    `- Deadline urgency: ${context.deadlineUrgency}`,
    "",
    "Prompt to improve:",
    originalPrompt,
    "",
    "AI output that exposed the weaknesses:",
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
        ? "You improve startup proposal prompts. You never write final proposal content and you never score outputs."
        : "You detect startup proposal weaknesses. You never write final proposal content, improve prompts, or score outputs.",
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
      return Response.json({
        improvement: parseImprovementJson(geminiResult.text),
        model,
      });
    }

    const geminiReview = parseWeaknessJson(geminiResult.text);

    return Response.json({
      model,
      review: {
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
