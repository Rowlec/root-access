import { runGradingEngine } from "@/lib/grader/engine";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const body = await request.json();

    const projectId = body.project_id ?? body.projectId;
    const sectionId = body.section_id ?? body.sectionId;
    const outputText = body.output_text ?? body.outputText;
    const insertionId = body.insertion_id ?? body.insertionId ?? null;
    const parentGradeId = body.parent_grade_id ?? body.parentGradeId ?? null;
    const site = body.site ?? "chatgpt";

    if (!projectId || !sectionId || typeof outputText !== "string") {
      return jsonResponse(
        {
          code: "INVALID_INPUT",
          message: "project_id, section_id và output_text là bắt buộc.",
        },
        { status: 422 },
        request,
      );
    }

    const engineResponse = await runGradingEngine({
      userId: user.id,
      projectId,
      sectionId,
      outputText,
      insertionId,
      parentGradeId,
      site,
    });

    if (!engineResponse.success) {
      return jsonResponse(
        {
          code: engineResponse.code,
          message: engineResponse.message,
          ...(engineResponse.result ? { result: engineResponse.result } : {}),
        },
        { status: engineResponse.status },
        request,
      );
    }

    return jsonResponse(engineResponse.result, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse(
        { code: "UNAUTHENTICATED", message: "Chưa đăng nhập" },
        { status: 401 },
        request,
      );
    }
    return jsonResponse(
      { code: "INTERNAL_ERROR", error: err.message },
      { status: 500 },
      request,
    );
  }
}
