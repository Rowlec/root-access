import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { packs } from "@/db/schema";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: packs.id,
        version: packs.version,
        checkpoint: packs.checkpoint,
        course: packs.course,
        term: packs.term,
        source: packs.source,
        content: packs.content,
      })
      .from(packs)
      .where(eq(packs.isActive, true));

    const result = rows.map((r) => {
      const content = r.content as any;
      const sections = (content?.sections ?? []).map((s: any) => ({
        id: s.id,
        title: s.title,
        order: s.order,
        criteria_count: s.criteria?.length ?? 0,
      }));

      return {
        id: r.id,
        version: r.version,
        course: r.course,
        term: r.term,
        checkpoint: r.checkpoint,
        source: r.source,
        sections,
      };
    });

    return jsonResponse(result, { status: 200 }, request);
  } catch (err: any) {
    return jsonResponse(
      { error: err.message || "Failed to fetch packs" },
      { status: 500 },
      request,
    );
  }
}
