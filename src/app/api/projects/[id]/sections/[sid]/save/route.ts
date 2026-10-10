import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projectSections } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string; sid: string }> },
) {
  try {
    await ensureCurrentUser(request.headers);
    const { id: projectId, sid: sectionId } = await props.params;
    const body = await request.json();

    const savedText = (body.saved_text ?? body.savedText ?? "").trim();
    const savedGradeId = body.saved_grade_id ?? body.savedGradeId ?? null;
    const chatUrl = body.chat_url ?? body.chatUrl ?? null;
    const status = body.status ?? "passed"; // 'todo' | 'drafting' | 'passed'
    const lecturerFeedback = body.lecturer_feedback ?? body.lecturerFeedback ?? null;
    const actualScore = body.actual_score ?? body.actualScore ?? null;

    if (!savedText) {
      return jsonResponse(
        { error: "Nội dung văn bản (saved_text) không được để trống." },
        { status: 422 },
        request,
      );
    }

    const db = getDb();
    const [existing] = await db
      .select()
      .from(projectSections)
      .where(and(eq(projectSections.projectId, projectId), eq(projectSections.sectionId, sectionId)))
      .limit(1);

    let savedSection;
    if (existing) {
      [savedSection] = await db
        .update(projectSections)
        .set({
          status,
          savedText,
          savedGradeId: savedGradeId || existing.savedGradeId,
          chatUrl: chatUrl || existing.chatUrl,
          lecturerFeedback: lecturerFeedback || existing.lecturerFeedback,
          actualScore: actualScore || existing.actualScore,
          updatedAt: new Date(),
        })
        .where(and(eq(projectSections.projectId, projectId), eq(projectSections.sectionId, sectionId)))
        .returning();
    } else {
      [savedSection] = await db
        .insert(projectSections)
        .values({
          projectId,
          sectionId,
          status,
          savedText,
          savedGradeId,
          chatUrl,
          lecturerFeedback,
          actualScore,
        })
        .returning();
    }

    return jsonResponse({ section: savedSection }, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}
