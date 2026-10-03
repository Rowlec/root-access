import { generateIdeaDirections } from "@/lib/studio/generator";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const answers = body.answers || body || {};
    const excludeIds = body.exclude_ids || [];

    const ideas = await generateIdeaDirections(answers, excludeIds);
    return jsonResponse({ ideas }, { status: 200 }, request);
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Failed to generate ideas" }, { status: 500 }, request);
  }
}
