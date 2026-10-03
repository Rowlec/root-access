import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { tasks } from "@/db/schema";
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
    await ensureCurrentUser(request.headers);
    const { id: projectId } = await props.params;

    const db = getDb();
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, projectId))
      .orderBy(tasks.done, desc(tasks.createdAt));

    return jsonResponse({ tasks: rows }, { status: 200 }, request);
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
    await ensureCurrentUser(request.headers);
    const { id: projectId } = await props.params;
    const body = await request.json();

    const taskId = body.taskId ?? body.id;
    const done = Boolean(body.done);

    if (!taskId) {
      return jsonResponse({ error: "taskId is required" }, { status: 400 }, request);
    }

    const db = getDb();
    const [updated] = await db
      .update(tasks)
      .set({ done })
      .where(and(eq(tasks.id, taskId), eq(tasks.projectId, projectId)))
      .returning();

    return jsonResponse({ task: updated }, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    await ensureCurrentUser(request.headers);
    const { id: projectId } = await props.params;
    const body = await request.json();

    const title = (body.title || "").trim();
    const sectionId = body.sectionId || null;
    const source = body.source || "manual";

    if (!title) {
      return jsonResponse({ error: "title is required" }, { status: 400 }, request);
    }

    const db = getDb();
    const [created] = await db
      .insert(tasks)
      .values({
        projectId,
        sectionId,
        title,
        source,
        done: false,
      })
      .returning();

    return jsonResponse({ task: created }, { status: 201 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}
