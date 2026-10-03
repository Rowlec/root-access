import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { packs } from "@/db/schema";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;
    const db = getDb();
    const [row] = await db
      .select()
      .from(packs)
      .where(and(eq(packs.id, id), eq(packs.isActive, true)))
      .orderBy(desc(packs.version))
      .limit(1);

    if (!row) {
      return jsonResponse({ error: "Pack not found" }, { status: 404 }, request);
    }

    const content = JSON.parse(JSON.stringify(row.content)) as any;

    // Spec Mục 10: Do not send internal fix_hints or anchors to client
    if (Array.isArray(content?.sections)) {
      content.sections.forEach((sec: any) => {
        delete sec.fix_hints;
        if (Array.isArray(sec.criteria)) {
          sec.criteria.forEach((crit: any) => {
            delete crit.anchors;
          });
        }
      });
    }

    return jsonResponse(content, { status: 200 }, request);
  } catch (err: any) {
    return jsonResponse(
      { error: err.message || "Failed to fetch pack" },
      { status: 500 },
      request,
    );
  }
}
