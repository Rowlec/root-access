import { combineIdeaDirections } from "@/lib/studio/generator";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const idea1 = body.idea1;
    const idea2 = body.idea2;

    if (!idea1 || !idea2) {
      return jsonResponse({ error: "idea1 and idea2 are required" }, { status: 400 }, request);
    }

    const idea = await combineIdeaDirections(idea1, idea2);
    return jsonResponse({ idea }, { status: 200 }, request);
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Failed to combine ideas" }, { status: 500 }, request);
  }
}
