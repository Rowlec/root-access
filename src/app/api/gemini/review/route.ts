import { z } from "zod";

import {
  isProposalSectionId,
  proposalReviewFrameworks,
  proposalSectionIds,
  scoreStartupProposalOutput,
} from "@/lib/proposal-review";

const reviewRequestSchema = z.object({
  context: z.object({
    deadlineUrgency: z.string().trim().max(120),
    industry: z.string().trim().max(200),
    startupIdea: z.string().trim().min(1).max(2000),
    targetCustomer: z.string().trim().max(500).optional(),
  }),
  originalPrompt: z.string().trim().min(1).max(12000),
  output: z.string().trim().min(1).max(20000),
  previousScore: z.number().int().min(0).max(40).optional(),
  section: z.string().trim().min(1).max(120),
  sectionId: z.enum(proposalSectionIds),
});

const geminiReviewSchema = z.object({
  weaknesses: z.array(z.string().trim().min(1).max(1000)).min(0).max(5),
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

const defaultModel = "gemini-3.5-flash";

function getApiKey() {
  return process.env.GEMINI_API_KEY ?? process.env.GOOGLE_GENERATIVE_AI_API_KEY;
}

function getModel() {
  return process.env.GEMINI_MODEL ?? defaultModel;
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
        message: "Gemini returned an unreadable response. Try again later.",
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

function parseGeminiReviewJson(value: string) {
  const parsed: unknown = JSON.parse(extractJsonObject(value));
  const review = geminiReviewSchema.parse(parsed);

  return {
    ...review,
    weaknesses: review.weaknesses
      .slice(0, 2)
      .map((weakness) => truncateReviewText(weakness, 240)),
  };
}

function createGeminiReviewPrompt({
  context,
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
    "The deterministic scoring engine has already scored the output. Do not change or invent scores.",
    "Your job is only Weakness Detection and Prompt Improvement.",
    "Do not write the final proposal section for the user.",
    "Do not give generic writing feedback. Focus only on startup business logic.",
    "",
    "Return ONLY valid JSON matching this exact shape:",
    JSON.stringify(
      {
        weaknesses: ["top business weakness 1", "top business weakness 2"],
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

export async function POST(request: Request) {
  const apiKey = getApiKey();

  if (!apiKey) {
    return Response.json(
      {
        code: "missing_api_key",
        message:
          "Gemini API key is not configured. Set GEMINI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY on the server.",
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
                  text: createGeminiReviewPrompt({
                    ...parsedBody.data,
                    score: deterministicScore,
                  }),
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
                text: "You detect startup proposal weaknesses and improve prompts. You never write final proposal content and you never score outputs.",
              },
            ],
          },
        }),
      },
    );
  } catch {
    return Response.json(
      {
        code: "gemini_unavailable",
        message:
          "Gemini could not be reached. Check server network access and try again.",
      },
      { status: 502 },
    );
  }

  const data = await readGeminiResponse(response);

  if (!response.ok) {
    return Response.json(
      {
        code: "gemini_error",
        message:
          data.error?.message ??
          "Gemini could not review this output. Try again later.",
      },
      { status: response.status },
    );
  }

  const text = extractGeminiText(data);

  if (!text) {
    return Response.json(
      {
        code: "empty_response",
        message: "Gemini returned no review content.",
      },
      { status: 502 },
    );
  }

  try {
    const geminiReview = parseGeminiReviewJson(text);

    return Response.json({
      model,
      review: {
        frameworkChecks: deterministicScore.frameworkChecks,
        frameworkTitle: deterministicScore.frameworkTitle,
        improvedPrompt: geminiReview.improvedPrompt,
        score: deterministicScore,
        weaknesses: geminiReview.weaknesses,
        whyBetter: geminiReview.whyBetter,
      },
    });
  } catch {
    return Response.json(
      {
        code: "invalid_gemini_json",
        message: "Gemini returned a review that could not be parsed.",
      },
      { status: 502 },
    );
  }
}
