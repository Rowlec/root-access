import { generateProjectNames } from "@/lib/studio/generator";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const direction = body.direction || {};
    const niche = body.niche || "";
    const exclude = body.exclude || [];

    const names = await generateProjectNames(direction, niche, exclude);
    return jsonResponse({ names }, { status: 200 }, request);
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Failed to generate names" }, { status: 500 }, request);
  }
}
