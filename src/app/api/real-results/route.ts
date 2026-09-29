import { getDb } from "@/db";
import { realResults } from "@/db/schema";
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
    const checkpoint = body.checkpoint ?? "Checkpoint 2";
    const lecturerFeedback = body.lecturer_feedback ?? body.lecturerFeedback ?? "";
    const actualScore = body.actual_score !== undefined ? String(body.actual_score) : null;
    const questionsAsked = Array.isArray(body.questions_asked)
      ? body.questions_asked
      : Array.isArray(body.questionsAsked)
      ? body.questionsAsked
      : [];

    if (!projectId || !lecturerFeedback) {
      return jsonResponse(
        {
          code: "INVALID_INPUT",
          message: "project_id và lecturer_feedback không được để trống.",
        },
        { status: 422 },
        request,
      );
    }

    const db = getDb();
    const [inserted] = await db
      .insert(realResults)
      .values({
        userId: user.id,
        projectId,
        checkpoint,
        lecturerFeedback,
        actualScore,
        questionsAsked,
      })
      .returning();

    return jsonResponse(inserted, { status: 201 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse(
        { code: "UNAUTHENTICATED", message: "Chưa đăng nhập" },
        { status: 401 },
        request,
      );
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}
