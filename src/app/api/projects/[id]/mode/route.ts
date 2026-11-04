import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    await ensureCurrentUser(request.headers);
    const { id: projectId } = await props.params;
    const body = await request.json();

    const mode = body.workspaceMode ?? body.workspace_mode ?? body.mode;
    if (mode !== "human" && mode !== "ai") {
      return jsonResponse(
        { error: "Chế độ không hợp lệ. Chỉ chấp nhận 'human' hoặc 'ai'." },
        { status: 422 },
        request,
      );
    }

    const db = getDb();
    const [updated] = await db
      .update(projects)
      .set({
        workspaceMode: mode,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId))
      .returning();

    return jsonResponse({ project: updated }, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}

