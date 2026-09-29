import { validateProjectProfile } from "@/lib/prompts/builder";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = validateProjectProfile({
      idea: body.idea ?? body.startup_idea,
      targetCustomer: body.target_customer ?? body.targetCustomer,
      availableData: body.available_data ?? body.availableData,
    });

    return jsonResponse(result, { status: 200 }, request);
  } catch (err: any) {
    return jsonResponse(
      { error: err.message || "Failed to validate project" },
      { status: 500 },
      request,
    );
  }
}
