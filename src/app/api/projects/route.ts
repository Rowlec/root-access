import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { projects } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const db = getDb();
    const userProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.userId, user.id))
      .orderBy(desc(projects.updatedAt));

    return jsonResponse(userProjects, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}

export async function POST(request: Request) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const body = await request.json();

    const name = (body.name ?? body.title ?? "").trim();
    const idea = (body.idea ?? body.startup_idea ?? "").trim();
    const targetCustomer = (body.target_customer ?? body.targetCustomer ?? "").trim();
    const availableData = body.available_data ?? body.availableData ?? {};
    const packId = body.pack_id ?? body.packId ?? "exe101-cp2";

    if (!name || !idea) {
      return jsonResponse(
        { code: "INVALID_INPUT", message: "Tên dự án và ý tưởng không được để trống." },
        { status: 422 },
        request,
      );
    }

    const db = getDb();
    const [newProject] = await db
      .insert(projects)
      .values({
        userId: user.id,
        name,
        idea,
        targetCustomer,
        availableData,
        packId,
        title: name,
        startupIdea: idea,
      })
      .returning();

    return jsonResponse(newProject, { status: 201 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}
