import { z } from "zod";

const sectionIds = [
  "idea",
  "problem",
  "customer",
  "market",
  "solution",
  "revenue",
  "competition",
  "mvp",
  "validation",
] as const;

const proposalRequestSchema = z.object({
  context: z.object({
    industry: z.string().trim().min(1).max(200),
    startupIdea: z.string().trim().min(3).max(2000),
    targetCustomer: z.string().trim().max(500),
  }),
  locale: z.enum(["en", "vi"]),
  sections: z.record(z.enum(sectionIds), z.string().trim().max(12000)),
});

const proposalResponseSchema = z.object({
  draft: z.object({
    idea: z.string().trim().min(1).max(6000),
    problem: z.string().trim().min(1).max(6000),
    customer: z.string().trim().min(1).max(6000),
    market: z.string().trim().min(1).max(6000),
    solution: z.string().trim().min(1).max(6000),
    revenue: z.string().trim().min(1).max(6000),
    competition: z.string().trim().min(1).max(6000),
    mvp: z.string().trim().min(1).max(6000),
    validation: z.string().trim().min(1).max(6000),
  }),
});

type GeminiResponse = {
  candidates?: Array<{ content?: { parts?: Array<{ text?: unknown }> } }>;
  error?: { message?: string };
};

const unavailableMessage = "AI service unavailable. Please retry.";
const defaultModel = "gemini-3.1-flash-lite";
const maxSectionSourceCharacters = 4000;

function compactSectionNotes(value: string) {
  if (value.length <= maxSectionSourceCharacters) {
    return value;
  }

  const opening = value.slice(0, 2800).trimEnd();
  const ending = value.slice(-1100).trimStart();

  return `${opening}\n\n[Earlier working notes shortened to keep this AI request focused.]\n\n${ending}`;
}

function extractText(data: GeminiResponse) {
  return data.candidates?.[0]?.content?.parts
    ?.map((part) => (typeof part.text === "string" ? part.text : ""))
    .join("\n")
    .trim();
}

function parseJson(value: string) {
  const normalized = value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  return proposalResponseSchema.safeParse(JSON.parse(normalized));
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

  const parsedRequest = proposalRequestSchema.safeParse(body);

  if (!parsedRequest.success) {
    return Response.json(
      { code: "invalid_request", message: "Proposal input is invalid." },
      { status: 400 },
    );
  }

  const { context, locale, sections } = parsedRequest.data;
  const language = locale === "vi" ? "Vietnamese" : "English";
  const compactSections = Object.fromEntries(
    Object.entries(sections).map(([sectionId, content]) => [
      sectionId,
      compactSectionNotes(content),
    ]),
  );
  const prompt = [
    "Create a polished, editable startup proposal from the student's working notes.",
    `Write every value in ${language}.`,
    "Return JSON only. Its exact shape must be { draft: { idea, problem, customer, market, solution, revenue, competition, mvp, validation } }.",
    "Each field must be plain prose with short paragraphs. Do not include markdown, bullets, asterisks, hash symbols, greetings, or meta commentary.",
    "Use only the supplied notes and context. Do not invent market sizes, customer interview results, competitor facts, prices, legal claims, or citations.",
    "When evidence is absent, state a concrete validation action instead of pretending a fact is known.",
    "Make the sections consistent with one another and suitable for a student to edit before submission.",
    "Project context:",
    `Startup idea: ${context.startupIdea}`,
    `Industry: ${context.industry}`,
    `Target customer: ${context.targetCustomer || "Not specified"}`,
    "Working notes by section:",
    JSON.stringify(compactSections),
  ].join("\n\n");

  let response: Response;

  try {
    response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL ?? defaultModel}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 4600,
            responseMimeType: "application/json",
            temperature: 0.25,
          },
          systemInstruction: {
            parts: [
              {
                text: "You are Root Access's proposal drafting service. Produce accurate, editable student work from supplied notes only.",
              },
            ],
          },
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
      { code: "gemini_error", message: data.error?.message ?? unavailableMessage },
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

  try {
    const parsedOutput = parseJson(output);

    if (!parsedOutput.success) {
      throw new Error("invalid_proposal_json");
    }

    return Response.json(parsedOutput.data);
  } catch {
    return Response.json(
      { code: "invalid_proposal_json", message: unavailableMessage },
      { status: 502 },
    );
  }
}
