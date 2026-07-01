import { z } from "zod";

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
});

const scoreDimensionSchema = z
  .number()
  .min(0)
  .max(10)
  .transform((score) => Math.round(score));

const scoreBreakdownSchema = z.object({
  relevance: scoreDimensionSchema,
  specificity: scoreDimensionSchema,
  actionability: scoreDimensionSchema,
  clarity: scoreDimensionSchema,
});

const reviewResponseSchema = z.object({
  score: z.object({
    total: z.number().min(0).max(40).optional(),
    breakdown: scoreBreakdownSchema,
    explanation: z.string().trim().min(1).max(1500),
  }),
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
        message:
          "Gemini returned an unreadable response. Try again later.",
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
  const review = reviewResponseSchema.parse(parsed);
  const total =
    review.score.breakdown.relevance +
    review.score.breakdown.specificity +
    review.score.breakdown.actionability +
    review.score.breakdown.clarity;

  return {
    ...review,
    score: {
      ...review.score,
      total,
    },
    weaknesses: review.weaknesses
      .slice(0, 2)
      .map((weakness) => truncateReviewText(weakness, 240)),
  };
}

function createReviewPrompt({
  context,
  originalPrompt,
  output,
  previousScore,
  section,
}: z.infer<typeof reviewRequestSchema>) {
  return [
    "You are RootAccess, an AI workflow reviewer for FPT University startup proposal work.",
    "The user already tested a prompt in ChatGPT/Gemini and pasted the AI output back into RootAccess.",
    "Do not write the user's proposal section. Review the output quality and improve the prompt for the next retry.",
    "",
    "Return ONLY valid JSON matching this exact shape:",
    JSON.stringify(
      {
        score: {
          total: 0,
          breakdown: {
            relevance: 0,
            specificity: 0,
            actionability: 0,
            clarity: 0,
          },
          explanation: "short explanation",
        },
        weaknesses: ["top weakness 1", "top weakness 2"],
        improvedPrompt: "better prompt the user can copy into ChatGPT/Gemini",
        whyBetter: "short reason why the prompt is better",
      },
      null,
      2,
    ),
    "",
    "Scoring rules:",
    "- Score relevance, specificity, actionability, and clarity from 0 to 10.",
    "- Total must equal the four dimensions, 0 to 40.",
    "- Keep the explanation simple and understandable.",
    "- Detect only the top 2 weaknesses.",
    "- Possible weakness types include: too broad, unclear customer, weak pain point, no urgency, solution-first thinking, unrealistic assumptions.",
    "- Improved prompt must address the detected weaknesses and help the user retry externally.",
    "",
    `Workflow section: ${section}`,
    `Previous score, if this is a retry: ${previousScore ?? "none"}`,
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

  if (!parsedBody.success) {
    return Response.json(
      {
        code: "invalid_request",
        message: "Review input is invalid.",
      },
      { status: 400 },
    );
  }

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
                  text: createReviewPrompt(parsedBody.data),
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
                text: "You review AI outputs for startup proposal workflows. You score outputs, detect the top weaknesses, and improve prompts. You never write the user's final proposal.",
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
    return Response.json({
      model,
      review: parseReviewJson(text),
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
