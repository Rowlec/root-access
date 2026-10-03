import { generateClarifyQuestions } from "@/lib/studio/generator";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idea = (body.idea || "").trim();

    if (!idea) {
      return jsonResponse({ error: "Idea is required" }, { status: 400 }, request);
    }

    const questions = await generateClarifyQuestions(idea);
    return jsonResponse({ questions }, { status: 200 }, request);
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Failed to clarify idea" }, { status: 500 }, request);
  }
}
