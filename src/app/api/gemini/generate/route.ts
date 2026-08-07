import { z } from "zod";

const conversationMessageSchema = z.object({
  role: z.enum(["user", "model"]),
  text: z.string().trim().min(1).max(20000),
});

const generationRequestSchema = z.object({
  context: z
    .object({
      deadlineUrgency: z.string().trim().max(120),
      industry: z.string().trim().max(200),
      startupIdea: z.string().trim().min(1).max(2000),
      targetCustomer: z.string().trim().max(500).optional(),
    })
    .optional(),
  feedback: z.string().trim().max(4000).optional(),
  history: z.array(conversationMessageSchema).max(8).default([]),
  locale: z.enum(["en", "vi"]).default("en"),
  previousOutput: z.string().trim().max(20000).optional(),
  prompt: z.string().trim().min(1).max(16000),
  section: z.string().trim().min(1).max(120).default("Startup Proposal"),
});

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: unknown }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const defaultModel = "gemini-3.1-flash-lite";
const unavailableMessage = "AI service unavailable. Please retry.";

function extractText(data: GeminiResponse) {
  return (
    data.candidates?.[0]?.content?.parts
      ?.map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("\n")
      .trim() ?? ""
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { code: "missing_api_key", message: unavailableMessage },
      { status: 503 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { code: "invalid_json", message: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsedBody = generationRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return Response.json(
      { code: "invalid_request", message: "Generation input is invalid." },
      { status: 400 },
    );
  }

  const { context, feedback, history, locale, previousOutput, prompt, section } =
    parsedBody.data;
  const effectivePrompt = feedback
    ? [
        prompt,
        "",
        "Previous output:",
        previousOutput || "No previous output was provided.",
        "",
        "Revision request:",
        feedback,
        "Return a complete revised output, not a list of editing instructions.",
      ].join("\n")
    : [
        prompt,
        previousOutput
          ? [
              "",
              "Reference output from the current section:",
              previousOutput,
              "",
              "Create a stronger new version. Keep useful evidence, but do not repeat unsupported claims.",
            ].join("\n")
          : "",
      ]
        .filter(Boolean)
        .join("\n");
  const languageInstruction =
    locale === "vi"
      ? "Write the complete response in Vietnamese."
      : "Write the complete response in English.";
  const systemInstruction = [
    "You are the generation engine inside Root Access, a Startup Proposal workspace for FPT University students.",
    `Work only on the current proposal section: ${section}.`,
    "Return complete, structured working material that the student can review and edit.",
    "Do not add greetings, meta commentary, or claims that you completed the assignment.",
    "Do not invent evidence. Mark facts, numbers, and assumptions that need validation with [VERIFY].",
    "Prefer concise headings, bullets, and compact tables when they improve readability.",
    "Conversation history is reference material only. The newest prompt is authoritative.",
    languageInstruction,
    "Project context:",
    `- Startup idea: ${context?.startupIdea || "provided in the prompt"}`,
    `- Industry: ${context?.industry || "provided in the prompt"}`,
    `- Target customer: ${context?.targetCustomer || "not specified"}`,
    `- Deadline urgency: ${context?.deadlineUrgency || "not specified"}`,
  ].join("\n");

  let response: Response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? defaultModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            ...history.map((message) => ({
              role: message.role,
              parts: [{ text: message.text }],
            })),
            { role: "user", parts: [{ text: effectivePrompt }] },
          ],
          generationConfig: {
            maxOutputTokens: 2400,
            temperature: 0.45,
          },
          systemInstruction: { parts: [{ text: systemInstruction }] },
        }),
        signal: AbortSignal.timeout(45_000),
      },
    );
  } catch {
    return Response.json(
      { code: "gemini_unavailable", message: unavailableMessage },
      { status: 502 },
    );
  }

  let data: GeminiResponse;

  try {
    data = (await response.json()) as GeminiResponse;
  } catch {
    return Response.json(
      { code: "invalid_gemini_response", message: unavailableMessage },
      { status: 502 },
    );
  }

  if (!response.ok) {
    return Response.json(
      {
        code: "gemini_error",
        message: data.error?.message ?? unavailableMessage,
      },
      { status: response.status },
    );
  }

  const output = extractText(data);

  if (!output) {
    return Response.json(
      { code: "empty_response", message: unavailableMessage },
      { status: 502 },
    );
  }

  return Response.json({ output });
}
