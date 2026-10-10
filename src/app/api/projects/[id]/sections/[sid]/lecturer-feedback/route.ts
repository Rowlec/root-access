import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { packs, projectSections, projects, realResults } from "@/db/schema";
import { Pack } from "@/lib/packs-schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string; sid: string }> },
) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const { id: projectId, sid: sectionId } = await props.params;
    const body = await request.json();

    const feedbackText = (body.feedback ?? body.lecturer_feedback ?? "").trim();
    const actualScore = (body.score ?? body.actual_score ?? "").trim();

    if (!feedbackText) {
      return jsonResponse(
        { error: "Vui lòng nhập nội dung nhận xét của giảng viên/mentor." },
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
      return jsonResponse({ error: "Dự án không tồn tại." }, { status: 404 }, request);
    }

    // Load pack & criteria to map feedback
    const effectivePackId = project.packId || "exe101-cp2";
    const [packRow] = await db
      .select()
      .from(packs)
      .where(eq(packs.id, effectivePackId))
      .orderBy(desc(packs.version))
      .limit(1);

    const packContent = (packRow?.content ?? {}) as unknown as Pack;
    const section = packContent.sections?.find((s) => s.id === sectionId);

    // Call LLM to map feedback to rubric criteria and generate guiding questions
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    let analysis = {
      related_criteria: section?.criteria?.map((c) => c.name) || [],
      summary_meaning: feedbackText,
      why_important: "Giảng viên trực tiếp chỉ ra điểm yếu cần khắc phục trước buổi chấm chính thức.",
      guiding_questions: [
        "Giảng viên đang muốn nhóm bổ sung thêm số liệu thực tế hay làm rõ nhóm đối tượng nào?",
        "Nhóm có thể thu thập thông tin gì trong 24 giờ tới để giải quyết đúng nhận xét này?",
      ],
      suggested_action: "Bổ sung thông tin thật vào câu trả lời để tạo prompt sửa.",
    };

    if (apiKey && section) {
      const criteriaList = section.criteria.map((c) => `[${c.id}] ${c.name}: ${c.description}`).join("\n");
      const systemPrompt = `Bạn là trợ lý học tập phân tích nhận xét của giảng viên môn ${packContent.course || "EXE101"}.
NHIỆM VỤ: Phân tích nhận xét của giảng viên/mentor, ánh xạ nhận xét này vào tiêu chí Rubric liên quan của phần "${section.title}", và đưa ra 1-2 câu hỏi gợi mở để sinh viên TỰ TRẢ LỜI dữ liệu thật của nhóm. KHÔNG viết bài thay sinh viên.

TIÊU CHÍ RUBRIC CỦA PHẦN:
${criteriaList}

YÊU CẦU ĐẦU RA JSON:
{
  "related_criteria": ["Tên tiêu chí 1 liên quan nhất", "Tên tiêu chí 2"],
  "summary_meaning": "Tóm tắt ngắn gọn 1 câu: Thầy/Cô đang muốn gì ở phần này",
  "why_important": "1 câu: Vì sao nhận xét này quyết định điểm số bảo vệ",
  "guiding_questions": [
    "Câu hỏi gợi mở 1 để sinh viên tự điền thông tin thật của nhóm...",
    "Câu hỏi gợi mở 2..."
  ],
  "suggested_action": "Gợi ý hành động thực tế tiếp theo cho nhóm"
}`;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const resp = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: `NHẬN XÉT CỦA GIẢNG VIÊN:\n"${feedbackText}"` }] }],
            generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
            systemInstruction: { parts: [{ text: systemPrompt }] },
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            analysis = JSON.parse(text);
          }
        }
      } catch (err) {
        console.warn("LLM feedback analysis failed:", err);
      }
    }

    // Save feedback to project_sections
    const [existing] = await db
      .select()
      .from(projectSections)
      .where(and(eq(projectSections.projectId, projectId), eq(projectSections.sectionId, sectionId)))
      .limit(1);

    if (existing) {
      await db
        .update(projectSections)
        .set({
          lecturerFeedback: feedbackText,
          actualScore: actualScore || existing.actualScore,
          updatedAt: new Date(),
        })
        .where(and(eq(projectSections.projectId, projectId), eq(projectSections.sectionId, sectionId)));
    } else {
      await db.insert(projectSections).values({
        projectId,
        sectionId,
        status: "drafting",
        lecturerFeedback: feedbackText,
        actualScore: actualScore || null,
      });
    }

    // Optionally save to realResults for validation benchmark
    await db.insert(realResults).values({
      userId: user.id,
      projectId,
      checkpoint: packContent.checkpoint || "Checkpoint 2",
      lecturerFeedback: `[Phần ${section?.title || sectionId}]: ${feedbackText}`,
      actualScore: actualScore || null,
      questionsAsked: analysis.guiding_questions || [],
    });

    return jsonResponse(
      {
        ok: true,
        feedback: feedbackText,
        actual_score: actualScore,
        analysis,
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
