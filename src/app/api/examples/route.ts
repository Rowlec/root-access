import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { examples } from "@/db/schema";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const course = url.searchParams.get("course") || "EXE101";
    const checkpoint = url.searchParams.get("checkpoint");
    const section = url.searchParams.get("section");
    const criterion = url.searchParams.get("criterion");

    const db = getDb();
    const conditions = [eq(examples.consent, true)];
    if (course) conditions.push(eq(examples.course, course));
    if (checkpoint) conditions.push(eq(examples.checkpoint, checkpoint));
    if (section) conditions.push(eq(examples.sectionKey, section));
    if (criterion) conditions.push(eq(examples.criterionKey, criterion));

    const rows = await db
      .select({
        id: examples.id,
        course: examples.course,
        checkpoint: examples.checkpoint,
        sectionKey: examples.sectionKey,
        criterionKey: examples.criterionKey,
        level: examples.level,
        reportedScore: examples.reportedScore,
        excerpt: examples.excerpt,
        whyGood: examples.whyGood,
        sourceType: examples.sourceType,
      })
      .from(examples)
      .where(and(...conditions))
      .orderBy(desc(examples.createdAt))
      .limit(4);

    return jsonResponse(
      rows,
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
        },
      },
      request,
    );
  } catch (err: any) {
    return jsonResponse(
      { error: err.message || "Failed to fetch examples" },
      { status: 500 },
      request,
    );
  }
}
