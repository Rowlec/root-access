import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { studioSessions } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const db = getDb();
    const [latest] = await db
      .select()
      .from(studioSessions)
      .where(eq(studioSessions.userId, user.id))
      .orderBy(desc(studioSessions.updatedAt))
      .limit(1);

    return jsonResponse({ session: latest ?? null }, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ session: null }, { status: 200 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}

export async function POST(request: Request) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const body = await request.json();
    const db = getDb();

    const sessionId = body.id;
    const entry = body.entry || "B";
    const answers = body.answers || {};
    const suggestions = body.suggestions || {};
    const chosen = body.chosen || {};

    if (sessionId) {
      const [existing] = await db
        .select()
        .from(studioSessions)
        .where(eq(studioSessions.id, sessionId))
        .limit(1);

      if (existing && existing.userId === user.id) {
        const [updated] = await db
          .update(studioSessions)
          .set({
            entry,
            answers,
            suggestions,
            chosen,
            updatedAt: new Date(),
          })
          .where(eq(studioSessions.id, sessionId))
          .returning();

        return jsonResponse({ session: updated }, { status: 200 }, request);
      }
    }

    const [created] = await db
      .insert(studioSessions)
      .values({
        userId: user.id,
        entry,
        answers,
        suggestions,
        chosen,
      })
      .returning();

    return jsonResponse({ session: created }, { status: 201 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}
