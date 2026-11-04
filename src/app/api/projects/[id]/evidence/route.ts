import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { fieldEvidence, projects } from "@/db/schema";
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
    const user = await ensureCurrentUser(request.headers);
    const { id: projectId } = await props.params;

    const url = new URL(request.url);
    const sectionId = url.searchParams.get("sectionId");

    const db = getDb();
    const whereConditions = [eq(fieldEvidence.projectId, projectId)];
    if (sectionId) {
      whereConditions.push(eq(fieldEvidence.sectionId, sectionId));
    }

    const items = await db
      .select()
      .from(fieldEvidence)
      .where(and(...whereConditions))
      .orderBy(desc(fieldEvidence.createdAt));

    return jsonResponse({ evidence: items }, { status: 200 }, request);
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

    const sectionId = (body.sectionId || body.section_id || "problem").trim();
    const intervieweeName = (body.intervieweeName || body.interviewee_name || "").trim();
    const intervieweeRole = (body.intervieweeRole || body.interviewee_role || "").trim();
    const context = (body.context || "").trim();
    const directQuote = (body.directQuote || body.direct_quote || "").trim();
    const keyInsight = (body.keyInsight || body.key_insight || "").trim();
    const evidenceLink = (body.evidenceLink || body.evidence_link || "").trim() || null;

    if (!intervieweeName || !directQuote) {
      return jsonResponse(
        { error: "Vui lòng nhập tên người được phỏng vấn và trích dẫn nguyên văn câu nói." },
        { status: 422 },
        request,
      );
    }

    const db = getDb();
    const [created] = await db
      .insert(fieldEvidence)
      .values({
        projectId,
        sectionId,
        intervieweeName,
        intervieweeRole: intervieweeRole || "Khách hàng mục tiêu",
        context: context || "Khảo sát thực địa",
        directQuote,
        keyInsight: keyInsight || directQuote,
        evidenceLink,
      })
      .returning();

    return jsonResponse({ evidence: created }, { status: 201 }, request);
  } catch (err: any) {
    if (err.name === "UnauthorizedError") {
      return jsonResponse({ code: "UNAUTHENTICATED", message: "Chưa đăng nhập" }, { status: 401 }, request);
    }
    return jsonResponse({ error: err.message }, { status: 500 }, request);
  }
}

