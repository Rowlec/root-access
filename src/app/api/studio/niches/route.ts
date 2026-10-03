import { generateNiches } from "@/lib/studio/generator";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const direction = body.direction || body;

    if (!direction) {
      return jsonResponse({ error: "Direction is required" }, { status: 400 }, request);
    }

    const niches = await generateNiches(direction);
    return jsonResponse({ niches }, { status: 200 }, request);
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Failed to generate niches" }, { status: 500 }, request);
  }
}
