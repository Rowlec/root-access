import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { grades, projects, promptInsertions } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const { id } = await props.params;

    const db = getDb();
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .limit(1);

    if (!project) {
      return jsonResponse({ code: "NOT_FOUND", message: "Dự án không tồn tại" }, { status: 404 }, request);
    }

    return jsonResponse(project, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const { id } = await props.params;
    const body = await request.json();

    const db = getDb();
    const [existing] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .limit(1);

    if (!existing) {
      return jsonResponse({ code: "NOT_FOUND", message: "Dự án không tồn tại" }, { status: 404 }, request);
    }

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) {
      updates.name = body.name;
      updates.title = body.name;
    }
    if (body.idea !== undefined) {
      updates.idea = body.idea;
      updates.startupIdea = body.idea;
    }
    if (body.target_customer !== undefined || body.targetCustomer !== undefined) {
      updates.targetCustomer = body.target_customer ?? body.targetCustomer;
    }
    if (body.available_data !== undefined || body.availableData !== undefined) {
      updates.availableData = body.available_data ?? body.availableData;
    }
    if (body.pack_id !== undefined || body.packId !== undefined) {
      updates.packId = body.pack_id ?? body.packId;
    }

    const [updated] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();

    return jsonResponse(updated, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const { id } = await props.params;

    const db = getDb();
    // Spec Mục 10: DELETE xoá luôn grades và prompt_insertions liên quan
    await db.delete(grades).where(eq(grades.projectId, id));
    await db.delete(promptInsertions).where(eq(promptInsertions.projectId, id));
    const [deleted] = await db
      .delete(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, user.id)))
      .returning();

    if (!deleted) {
      return jsonResponse({ code: "NOT_FOUND", message: "Dự án không tồn tại" }, { status: 404 }, request);
    }

    return jsonResponse({ success: true, message: "Đã xóa dự án thành công" }, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}
