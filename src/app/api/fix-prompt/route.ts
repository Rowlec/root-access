import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { fixActionsUsed, grades, packs, promptInsertions } from "@/db/schema";
import { GradeResult } from "@/lib/grader/types";
import { Pack } from "@/lib/packs-schema";
import { buildFixPrompt } from "@/lib/prompts/builder";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(request: Request) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const body = await request.json();

    const gradeId = body.grade_id ?? body.gradeId;
    const actionId = body.action_id ?? body.actionId;
    const userInput = body.user_input ?? body.userInput ?? null;

    if (!gradeId || !actionId) {
      return jsonResponse(
        { code: "INVALID_INPUT", message: "grade_id và action_id là bắt buộc." },
        { status: 422 },
        request,
      );
    }

    const db = getDb();
    const [gradeRow] = await db
      .select()
      .from(grades)
      .where(eq(grades.id, gradeId))
      .limit(1);

    if (!gradeRow) {
      return jsonResponse({ code: "NOT_FOUND", message: "Kết quả chấm không tồn tại." }, { status: 404 }, request);
    }

    const [packRow] = await db
      .select()
      .from(packs)
      .where(eq(packs.id, gradeRow.packId))
      .limit(1);

    if (!packRow) {
      return jsonResponse({ code: "NOT_FOUND", message: "Gói checkpoint không tồn tại." }, { status: 404 }, request);
    }

    const packContent = packRow.content as unknown as Pack;
    const section = packContent.sections.find((s) => s.id === gradeRow.sectionId);
    if (!section) {
      return jsonResponse({ code: "NOT_FOUND", message: "Phần không tồn tại trong gói." }, { status: 404 }, request);
    }

    const gradeResult = gradeRow.result as unknown as GradeResult;
    const fixAction = gradeResult.fix_actions?.find((fa) => fa.id === actionId);

    const criterionId = fixAction?.criterion_id ?? section.criteria[0]?.id;
    const criterionDef = section.criteria.find((c) => c.id === criterionId) ?? section.criteria[0];
    const gradedCriterion = gradeResult.criteria?.find((c) => c.id === criterionId);

    // Format user input if object provided
    let userInputText = "";
    if (userInput) {
      if (typeof userInput === "string") {
        userInputText = userInput;
      } else if (typeof userInput === "object") {
        userInputText = Object.entries(userInput)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n");
      }
    }

    const promptText = buildFixPrompt({
      sectionTitle: section.title,
      criterionName: criterionDef.name,
      totDescription: criterionDef.levels.TOT,
      currentReason: gradedCriterion?.reason ?? fixAction?.explanation ?? "Chưa đạt yêu cầu tối đa của tiêu chí.",
      userInputText,
      actionType: fixAction?.type,
    });

    // 1. Insert prompt_insertions (kind: 'fix')
    const [insertion] = await db
      .insert(promptInsertions)
      .values({
        userId: user.id,
        projectId: gradeRow.projectId,
        sectionId: gradeRow.sectionId,
        kind: "fix",
        promptText,
        site: gradeRow.site,
      })
      .returning();

    // 2. Insert fix_actions_used
    await db.insert(fixActionsUsed).values({
      gradeId: gradeRow.id,
      actionId,
      type: fixAction?.type ?? "NEED_DATA",
      userInput: typeof userInput === "object" ? userInput : { raw: userInput },
      promptText,
    });

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
