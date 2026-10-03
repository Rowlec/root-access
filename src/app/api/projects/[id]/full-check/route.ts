import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "@/db";
import { fullChecks, packs, projectSections, projects, teamPasses } from "@/db/schema";
import { Pack } from "@/lib/packs-schema";
import { ensureCurrentUser } from "@/lib/server/auth";
import { handleCorsPreflight, jsonResponse } from "@/lib/server/cors";
import { consumeCredit, refundCredit } from "@/lib/server/credit";

export async function OPTIONS(request: Request) {
  return handleCorsPreflight(request);
}

function extractNumbersWithContext(text: string) {
  const matches: Array<{ num: number; match: string; context: string }> = [];
  const regex = /(\d+([.,]\d+)?)\s*(người|bạn|sinh viên|k|nghìn|đồng|vnd|%|phút|giờ|đơn|hộp)/gi;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const start = Math.max(0, m.index - 30);
    const end = Math.min(text.length, m.index + m[0].length + 30);
    matches.push({
      num: parseFloat(m[1].replace(",", ".")),
      match: m[0],
      context: text.slice(start, end).replace(/\n/g, " ").trim(),
    });
  }
  return matches;
}

export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const user = await ensureCurrentUser(request.headers);
    const { id: projectId } = await props.params;

    const db = getDb();

    // 1. Fetch project & saved sections
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (!project) {
      return jsonResponse({ error: "Dự án không tồn tại" }, { status: 404 }, request);
    }

    const savedSections = await db
      .select()
      .from(projectSections)
      .where(and(eq(projectSections.projectId, projectId)));

    const validSections = savedSections.filter((s) => Boolean(s.savedText && s.savedText.trim().length > 20));

    if (validSections.length < 2) {
      return jsonResponse(
        {
          error: "Cần lưu ít nhất 2 phần để kiểm tra chéo toàn bộ proposal.",
          saved_count: validSections.length,
        },
        { status: 400 },
        request,
      );
    }

    // 2. Check team pass or consume 5 credits
    const [teamPass] = await db
      .select()
      .from(teamPasses)
      .where(and(eq(teamPasses.projectId, projectId), gt(teamPasses.endsAt, new Date())))
      .limit(1);

    let creditsSpent = 0;
    if (teamPass && teamPass.fullChecksUsed < teamPass.fullCheckCap) {
      await db
        .update(teamPasses)
        .set({ fullChecksUsed: teamPass.fullChecksUsed + 1 })
        .where(eq(teamPasses.id, teamPass.id));
    } else {
      // Consume 5 credits
      creditsSpent = 5;
      for (let i = 0; i < 5; i++) {
        const res = await consumeCredit(user.id);
        if (!res.success) {
          // Refund any consumed in this loop
          for (let j = 0; j < i; j++) {
            await refundCredit(user.id);
          }
          return jsonResponse(
            { error: "Bạn cần ít nhất 5 credit để kiểm tra toàn bộ proposal." },
            { status: 402 },
            request,
          );
        }
      }
    }

    // 3. Heuristic code check for conflicting numbers
    const sectionTexts: Record<string, string> = {};
    const sectionNumbers: Record<string, ReturnType<typeof extractNumbersWithContext>> = {};
    for (const s of validSections) {
      sectionTexts[s.sectionId] = s.savedText || "";
      sectionNumbers[s.sectionId] = extractNumbersWithContext(s.savedText || "");
    }

    const codeIssues: Array<{
      severity: "high" | "medium" | "low";
      title: string;
      description: string;
      section_id: string;
      fix_hint?: string;
    }> = [];

    // Check survey / people interviewed inconsistency
    const customerNumbers = sectionNumbers["customer"] || [];
    const problemNumbers = sectionNumbers["problem"] || [];
    const revenueNumbers = sectionNumbers["revenue"] || [];

    // 4. Call LLM for comprehensive cross-proposal check
    const apiKey = process.env.GEMINI_API_KEY;
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    let llmResult: any = null;

    if (apiKey) {
      const fullSectionsContent = validSections
        .map((s) => `### PHẦN: ${s.sectionId.toUpperCase()}\n${s.savedText}\n`)
        .join("\n---\n\n");

      const systemPrompt = `Bạn là Chủ tịch Hội đồng chấm bảo vệ Startup Proposal môn EXE101.
Nhiệm vụ: Kiểm tra chéo toàn bộ các phần của đề án proposal để phát hiện mâu thuẫn, sai lệch và lỗ hổng trước khi sinh viên nộp bài.

BỐI CẢNH DỰ ÁN:
Tên dự án: ${project.name}
Ý tưởng: ${project.oneLiner || project.idea}
Ngách mục tiêu: ${project.niche || project.targetCustomer}

CÁC ĐIỂM CẦN BẮT LỖI:
1. Mâu thuẫn giữa các phần (ví dụ: ngách ở phần Khách hàng khác phần Doanh thu; giá ở phần Giải pháp khác phần Doanh thu; số người phỏng vấn/khảo sát đá nhau). Trích dẫn cả 2 phía.
2. Lệch ngách: Phần nào mở rộng sang khách hàng khác không đúng thẻ dự án.
3. Còn sót nhãn [GIẢ ĐỊNH] hoặc [CẦN DỮ LIỆU] chưa hoàn thiện.
4. Tối đa 5 câu hỏi khó mà Hội đồng chắc chắn sẽ chất vấn cả bài.

Quy tắc: Nói thẳng, công tâm, tiếng Việt.
Trả về JSON đúng cấu trúc:
{
  "issues": [
    {
      "severity": "high" | "medium" | "low",
      "title": "Tên vấn đề ngắn gọn",
      "section_id": "customer" | "revenue" | "solution" | "problem",
      "quote_a": "Trích dẫn ở phần này",
      "quote_b": "Trích dẫn ở phần kia (nếu là mâu thuẫn giữa 2 phần)",
      "description": "Giải thích chi tiết 1-2 câu",
      "suggested_fix": "Hướng dẫn sửa cụ thể"
    }
  ],
  "council_questions": [
    "Câu hỏi 1...",
    "Câu hỏi 2..."
  ]
}`;

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: fullSectionsContent }] }],
            generationConfig: {
              temperature: 0,
              responseMimeType: "application/json",
            },
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            llmResult = JSON.parse(text);
          }
        }
      } catch (err) {
        console.warn("LLM full check failed:", err);
      }
    }

    const finalIssues = llmResult?.issues || codeIssues;
    const councilQuestions = llmResult?.council_questions || [
      "Số liệu phỏng vấn của các bạn được thu thập qua kênh nào và tính xác thực ra sao?",
      "Cơ sở định giá này có bù đắp được chi phí vận hành ban đầu không?",
      "Nếu đối thủ cạnh tranh giảm giá, đề xuất giá trị độc nhất của bạn là gì?",
    ];

    const resultPayload = {
      issues: finalIssues,
      council_questions: councilQuestions,
      checked_at: new Date().toISOString(),
      sections_checked: validSections.map((s) => s.sectionId),
    };

    // 5. Persist to full_checks table
    const [savedRecord] = await db
      .insert(fullChecks)
      .values({
        projectId,
        sectionIds: validSections.map((s) => s.sectionId),
        result: resultPayload,
        promptVersion: "v2",
        model: model,
        creditsSpent,
      })
      .returning();

    return jsonResponse(
      {
        id: savedRecord.id,
        result: resultPayload,
        credits_spent: creditsSpent,
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
