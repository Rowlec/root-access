import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { examples, fixActionsUsed, grades, packs, projects, promptInsertions, tasks } from "@/db/schema";
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
    const criterionKey = body.criterion_key ?? body.criterionKey ?? body.criterion_id ?? body.criterionId;
    const userAnswer = body.user_answer ?? body.userAnswer;
    const userInput = body.user_input ?? body.userInput ?? null;

    if (!gradeId || (!actionId && !criterionKey)) {
      return jsonResponse(
        { code: "INVALID_INPUT", message: "grade_id và (action_id hoặc criterion_key) là bắt buộc." },
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
    const fixAction = actionId ? gradeResult.fix_actions?.find((fa) => fa.id === actionId) : undefined;

    const targetCriterionId = criterionKey || fixAction?.criterion_id || section.criteria[0]?.id;
    const criterionDef = section.criteria.find((c) => c.id === targetCriterionId) ?? section.criteria[0];
    const gradedCriterion = gradeResult.criteria?.find((c) => c.id === targetCriterionId);

    // Format user input / user answer if provided
    let userInputText = "";
    if (userAnswer) {
      userInputText = String(userAnswer).trim();
    } else if (userInput) {
      if (typeof userInput === "string") {
        userInputText = userInput;
      } else if (typeof userInput === "object") {
        userInputText = Object.entries(userInput)
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n");
      }
    }

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, gradeRow.projectId))
      .limit(1);

    // Target level
    const targetLevel = (gradeResult.target_level || project?.targetLevel || "good") as "pass" | "good" | "excellent";

    // Gather kept quotes (criteria that reached "met" or "TOT")
    const keptQuotes: string[] = [];
    if (gradeResult.criteria && Array.isArray(gradeResult.criteria)) {
      for (const c of gradeResult.criteria) {
        if (c.id !== targetCriterionId && (c.status === "met" || c.level === "TOT")) {
          const quote = c.keep_quote || c.evidence_quote;
          if (quote && quote.trim().length > 0 && !keptQuotes.includes(quote.trim())) {
            keptQuotes.push(quote.trim());
          }
        }
      }
    }

    // High-scoring example formula
    let exampleFormula = gradedCriterion?.gap?.example?.why_good;
    if (!exampleFormula) {
      // Check database examples table
      const [exRow] = await db
        .select()
        .from(examples)
        .where(eq(examples.criterionKey, targetCriterionId))
        .limit(1);
      if (exRow) {
        exampleFormula = `${exRow.whyGood} (Ví dụ mẫu: "${exRow.excerpt}")`;
      }
    }

    // Rubric requirement for target level
    let rubricRequirement = criterionDef.levels.TOT;
    if (targetLevel === "pass") {
      rubricRequirement = criterionDef.levels.DAT;
    }

    const promptText = buildFixPrompt({
      sectionTitle: section.title,
      criterionName: criterionDef.name,
      targetLevel,
      rubricRequirement,
      totDescription: criterionDef.levels.TOT,
      currentReason: gradedCriterion?.reason ?? fixAction?.explanation ?? "Chưa đạt yêu cầu tối đa của tiêu chí.",
      missing: gradedCriterion?.gap?.missing,
      evidenceQuote: gradedCriterion?.gap?.quote || gradedCriterion?.evidence_quote,
      exampleFormula,
      userInputText,
      keptQuotes,
      actionType: fixAction?.type,
      niche: project?.niche || project?.targetCustomer,
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
      actionId: actionId || `fix_${targetCriterionId}`,
      type: fixAction?.type ?? (userAnswer ? "NEED_DATA" : "FOCUS_REWRITE"),
      userInput: typeof userInput === "object" ? userInput : { raw: userInput || userAnswer },
      promptText,
    });

    // 3. If action is TASK or user indicated missing data, add to tasks table
    if (fixAction?.type === "TASK" && fixAction.label) {
      await db.insert(tasks).values({
        projectId: gradeRow.projectId,
        sectionId: gradeRow.sectionId,
        title: fixAction.label,
        source: "fix_action",
        done: false,
      });
    } else if (userInputText.includes("[CẦN DỮ LIỆU]") || body.missing_data === true) {
      await db.insert(tasks).values({
        projectId: gradeRow.projectId,
        sectionId: gradeRow.sectionId,
        title: `Thu thập dữ liệu cho tiêu chí: ${criterionDef.name}`,
        source: "fix_action",
        done: false,
      });
    }

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
