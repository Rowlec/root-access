import { and, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { projectInvites, projectMembers, projects } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(
  request: Request,
  props: { params: Promise<{ token: string }> },
) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const { token } = await props.params;

    const db = getDb();
    const [invite] = await db
      .select()
      .from(projectInvites)
      .where(and(eq(projectInvites.token, token), gt(projectInvites.expiresAt, new Date())))
      .limit(1);

    if (!invite) {
      return jsonResponse({ error: "Lời mời không hợp lệ hoặc đã hết hạn." }, { status: 404 }, request);
    }

    // Add user to project_members
    const [existingMember] = await db
      .select()
      .from(projectMembers)
      .where(and(eq(projectMembers.projectId, invite.projectId), eq(projectMembers.userId, user.id)))
      .limit(1);

    if (!existingMember) {
      await db.insert(projectMembers).values({
        projectId: invite.projectId,
        userId: user.id,
        role: "member",
      });
    }

    // Mark used
    await db
      .update(projectInvites)
      .set({ usedBy: user.id })
      .where(eq(projectInvites.token, token));

    return jsonResponse(
      {
        success: true,
        project_id: invite.projectId,
        message: "Bạn đã tham gia dự án thành công!",
      },
      { status: 200 },
      request,
    );
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}
