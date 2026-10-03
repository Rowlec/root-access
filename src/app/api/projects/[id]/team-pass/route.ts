import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { packs, projects, teamPasses } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const { id: projectId } = await props.params;
    const body = await request.json().catch(() => ({}));

    const db = getDb();
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return jsonResponse({ error: "Dự án không tồn tại" }, { status: 404 }, request);
    }

    const packId = body.pack_id || project.packId || "exe101-cp2";
    const price = body.price || 49000;

    // Check pack ends_at
    const [packRow] = await db
      .select()
      .from(packs)
      .where(eq(packs.id, packId))
      .limit(1);

    const endsAt = packRow?.endsAt ?? new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);

    const [pass] = await db
      .insert(teamPasses)
      .values({
        projectId,
        packId,
        boughtBy: user.id,
        price,
        startsAt: new Date(),
        endsAt,
        gradeCap: 150,
        gradesUsed: 0,
        fullCheckCap: 3,
        fullChecksUsed: 0,
      })
      .returning();

    return jsonResponse(
      {
        success: true,
        team_pass: pass,
        message: "Kích hoạt gói nhóm thành công! Cả nhóm có thể chấm tối đa 150 lượt và 3 lần kiểm tra toàn bộ.",
      },
      { status: 201 },
      request,
    );
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}
