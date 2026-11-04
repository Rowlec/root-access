import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { fieldEvidence } from "@/db/schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function DELETE(
  request: Request,
  props: { params: Promise<{ id: string; evidenceId: string }> },
) {
  try {
    await ensureCurrentUser(request.headers);
    const { id: projectId, evidenceId } = await props.params;

    const db = getDb();
    await db
      .delete(fieldEvidence)
      .where(and(eq(fieldEvidence.id, evidenceId), eq(fieldEvidence.projectId, projectId)));

    return jsonResponse({ success: true }, { status: 200 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}

