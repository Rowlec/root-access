import crypto from "crypto";
import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { projectInvites, projectMembers, projects } from "@/db/schema";
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

    const db = getDb();

    // Check project ownership or membership
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return jsonResponse({ error: "Dự án không tồn tại" }, { status: 404 }, request);
    }

    // Generate 7-day token
    const token = crypto.randomBytes(16).toString("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const [invite] = await db
      .insert(projectInvites)
      .values({
        token,
        projectId,
        createdBy: user.id,
        expiresAt,
      })
      .returning();

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const inviteUrl = `${protocol}://${host}/app/join?token=${token}`;

    return jsonResponse(
      {
        token: invite.token,
        invite_url: inviteUrl,
        expires_at: invite.expiresAt,
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
