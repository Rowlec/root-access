import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { packs, projects, promptInsertions, sectionIntakes, projectSections } from "@/db/schema";
import { Pack } from "@/lib/packs-schema";
import { buildInitialPrompt } from "@/lib/prompts/builder";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const body = await request.json();

    const projectId = body.project_id ?? body.projectId;
    const sectionId = body.section_id ?? body.sectionId;
    const site = body.site ?? "chatgpt";

    if (!projectId || !sectionId) {
      return jsonResponse(
        { code: "INVALID_INPUT", message: "project_id và section_id là bắt buộc." },
        { status: 422 },
        request,
      );
    }

    const db = getDb();
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return jsonResponse({ code: "NOT_FOUND", message: "Dự án không tồn tại" }, { status: 404 }, request);
    }

    const [packRow] = await db
      .select()
      .from(packs)
      .where(eq(packs.id, project.packId))
      .limit(1);

    if (!packRow) {
      return jsonResponse({ code: "NOT_FOUND", message: "Gói checkpoint không tồn tại" }, { status: 404 }, request);
    }

    const packContent = packRow.content as unknown as Pack;
    const section = packContent.sections.find((s) => s.id === sectionId);
    if (!section) {
      return jsonResponse(
        { code: "NOT_FOUND", message: `Phần "${sectionId}" không thuộc gói này.` },
        { status: 404 },
        request,
      );
    }

    const [intakeRow] = await db
      .select()
      .from(sectionIntakes)
      .where(and(eq(sectionIntakes.projectId, projectId), eq(sectionIntakes.sectionId, sectionId)))
      .limit(1);

    const savedSections = await db
      .select({
        sectionId: projectSections.sectionId,
        savedText: projectSections.savedText,
      })
      .from(projectSections)
      .where(and(eq(projectSections.projectId, projectId), eq(projectSections.status, "passed")));

    const savedSummary = savedSections
      .filter((s) => s.sectionId !== sectionId && s.savedText)
      .map((s) => `${s.sectionId}: ${s.savedText?.slice(0, 100)}...`)
      .join("; ");

    const intakeAnswers = body.intake_answers ?? intakeRow?.answers ?? {};

    const promptText = buildInitialPrompt(packContent, section, {
      name: project.name,
      idea: project.idea,
      one_liner: project.oneLiner || project.idea,
      targetCustomer: project.targetCustomer,
      niche: project.niche || project.targetCustomer,
      domain: project.domain || project.industry,
      intake_answers: intakeAnswers,
      saved_summary: savedSummary,
      availableData: project.availableData,
    });

    const [insertion] = await db
      .insert(promptInsertions)
      .values({
        userId: user.id,
        projectId,
        sectionId,
        kind: "initial",
        promptText,
        site,
      })
      .returning();

    return jsonResponse(
      {
        prompt_text: promptText,
        insertion_id: insertion.id,
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
