import { generateSituations } from "@/lib/studio/generator";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const domain = (body.domain || "").trim();

    if (!domain) {
      return jsonResponse({ error: "Domain is required" }, { status: 400 }, request);
    }

    const situations = await generateSituations(domain);
    return jsonResponse({ situations }, { status: 200 }, request);
  } catch (err: any) {
    return jsonResponse({ error: err.message || "Failed to generate situations" }, { status: 500 }, request);
  }
}
