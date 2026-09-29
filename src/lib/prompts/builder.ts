import { Criterion, Pack, Section } from "../packs-schema";

export interface ProjectPromptInput {
  name: string;
  idea: string;
  targetCustomer: string;
  availableData?: {
    surveyCount?: number;
    interviewCount?: number;
    keyFindings?: string;
    freeText?: string;
    [key: string]: unknown;
  } | null;
}

export function formatAvailableData(data?: ProjectPromptInput["availableData"]): string {
  if (!data || Object.keys(data).length === 0) {
    return "(Nhóm chưa có dữ liệu thực tế, cần đánh dấu [CẦN DỮ LIỆU] khi viết)";
  }

  const parts: string[] = [];
  if (data.surveyCount && Number(data.surveyCount) > 0) {
    parts.push(`Khảo sát: ${data.surveyCount} người tham gia`);
  }
  if (data.interviewCount && Number(data.interviewCount) > 0) {
    parts.push(`Phỏng vấn sâu: ${data.interviewCount} người`);
  }
  if (data.keyFindings && data.keyFindings.trim()) {
    parts.push(`Kết quả chính: ${data.keyFindings.trim()}`);
  }
  if (data.freeText && data.freeText.trim()) {
    parts.push(`Ghi chú khác: ${data.freeText.trim()}`);
  }

  return parts.length > 0
    ? parts.join("\n- ")
    : "(Nhóm chưa có dữ liệu thực tế, cần đánh dấu [CẦN DỮ LIỆU] khi viết)";
}

export function buildInitialPrompt(
  pack: Pack,
  section: Section,
  project: ProjectPromptInput,
): string {
  const criteriaText = section.criteria
    .map((c) => `- ${c.name}: ${c.levels.TOT}`)
    .join("\n");

  const commonMistakesText = section.common_mistakes
    .map((m) => `- ${m}`)
    .join("\n");

  const availableDataText = formatAvailableData(project.availableData);

  return `Bạn đang giúp một nhóm sinh viên viết phần "${section.title}" trong Startup Proposal cho môn ${pack.course} – ${pack.checkpoint}.

THÔNG TIN DỰ ÁN (do nhóm cung cấp):
- Tên dự án: ${project.name}
- Ý tưởng: ${project.idea}
- Khách hàng mục tiêu: ${project.targetCustomer}
- Dữ liệu nhóm đã có:
- ${availableDataText}

YÊU CẦU CỦA PHẦN NÀY:
${section.requirement}

BÀI VIẾT CẦN ĐẠT CÁC TIÊU CHÍ SAU:
${criteriaText}

TRÁNH CÁC LỖI HAY GẶP:
${commonMistakesText}

QUY TẮC BẮT BUỘC:
1. Chỉ dùng số liệu có trong "Dữ liệu nhóm đã có". KHÔNG tự tạo số liệu, khảo sát, phỏng vấn, trích dẫn hay nguồn mới.
2. Chỗ nào cần số liệu mà nhóm chưa có, ghi rõ: [CẦN DỮ LIỆU: mô tả dữ liệu cần thu thập].
3. Mọi nhận định chưa được kiểm chứng phải đánh dấu [GIẢ ĐỊNH].
4. Viết bằng tiếng Việt, ngắn gọn, đúng trọng tâm phần "${section.title}".`;
}

export function buildFixPrompt(params: {
  sectionTitle: string;
  criterionName: string;
  totDescription: string;
  currentReason: string;
  userInputText?: string | null;
  actionType?: string;
}): string {
  const {
    sectionTitle,
    criterionName,
    totDescription,
    currentReason,
    userInputText,
    actionType,
  } = params;

  let actionSpecificInstruction = "";
  if (actionType === "MARK_ASSUMPTIONS") {
    actionSpecificInstruction = "\n- Rà soát toàn bộ bài viết, đánh dấu [GIẢ ĐỊNH] cho mọi nhận định chưa kiểm chứng và gỡ bỏ các số liệu bịa đặt không có nguồn.";
  } else if (actionType === "FOCUS_REWRITE") {
    actionSpecificInstruction = "\n- Viết lại thật súc tích, đi thẳng vào trọng tâm vấn đề của khách hàng, lược bỏ hoàn toàn các câu văn sáo rỗng hoặc lan man.";
  } else if (actionType === "TASK") {
    actionSpecificInstruction = "\n- Đánh dấu rõ các lỗ hổng thông tin bằng [CẦN DỮ LIỆU: ...] để nhóm thực hiện khảo sát bổ sung.";
  }

  const userInputBlock = userInputText && userInputText.trim()
    ? `\nDỮ LIỆU THẬT NHÓM VỪA CUNG CẤP:\n${userInputText.trim()}\n`
    : "";

  return `Sửa lại phần "${sectionTitle}" trong câu trả lời trước của bạn.
Chỉ tập trung cải thiện tiêu chí: ${criterionName} – ${totDescription}.
Vấn đề hiện tại: ${currentReason}
${userInputBlock}
QUY TẮC:
- Giữ nguyên các ý đã tốt, chỉ sửa phần liên quan tới tiêu chí trên.${actionSpecificInstruction}
- Chỉ dùng số liệu có trong dữ liệu nhóm cung cấp hoặc đã có trong câu trả lời trước.
- KHÔNG tạo số liệu, khảo sát, trích dẫn mới. Thiếu thì ghi [CẦN DỮ LIỆU: ...].
- Trả về toàn bộ phần "${sectionTitle}" sau khi sửa.`;
}

export interface ValidationIssue {
  field: "idea" | "targetCustomer" | "availableData";
  message: string;
  severity: "error" | "warning";
}

export function validateProjectProfile(input: {
  idea?: string;
  targetCustomer?: string;
  availableData?: Record<string, unknown> | null;
}): { ok: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];

  const idea = (input.idea ?? "").trim();
  const targetCustomer = (input.targetCustomer ?? "").trim().toLowerCase();

  // 1. Idea check (< 40 chars or < 8 words)
  const wordCount = idea.split(/\s+/).filter(Boolean).length;
  if (idea.length < 40 || wordCount < 8) {
    issues.push({
      field: "idea",
      severity: "warning",
      message: "Mô tả ý tưởng trong 2–3 câu: làm gì, cho ai, giải quyết chuyện gì.",
    });
  }

  // 2. Target customer check (too broad)
  const broadTerms = [
    "sinh viên",
    "mọi người",
    "giới trẻ",
    "người dùng",
    "học sinh",
    "khách hàng",
    "tất cả mọi người",
  ];
  const isTooBroad =
    targetCustomer.length > 0 &&
    broadTerms.some((t) => targetCustomer === t || targetCustomer === `${t} việt nam`);

  if (isTooBroad || targetCustomer.length < 10) {
    issues.push({
      field: "targetCustomer",
      severity: "warning",
      message:
        "Khách hàng mục tiêu quá rộng: cụ thể hơn là năm mấy, ở đâu, đang gặp tình huống gì?",
    });
  }

  // 3. Available data check
  const data = input.availableData ?? {};
  const hasData =
    Boolean(data.surveyCount && Number(data.surveyCount) > 0) ||
    Boolean(data.interviewCount && Number(data.interviewCount) > 0) ||
    Boolean(data.keyFindings && String(data.keyFindings).trim().length > 0) ||
    Boolean(data.freeText && String(data.freeText).trim().length > 0);

  if (!hasData) {
    issues.push({
      field: "availableData",
      severity: "warning",
      message:
        "Chưa có dữ liệu thật, AI sẽ đánh dấu [CẦN DỮ LIỆU] ở các chỗ cần số liệu.",
    });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
