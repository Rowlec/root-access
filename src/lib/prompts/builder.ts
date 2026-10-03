import { Criterion, Pack, Section } from "../packs-schema";

export interface ProjectPromptInput {
  name: string;
  idea?: string;
  one_liner?: string;
  targetCustomer?: string;
  niche?: string;
  domain?: string;
  saved_summary?: string;
  intake_answers?: Record<string, any>;
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
  if (data.keyFindings && String(data.keyFindings).trim()) {
    parts.push(`Kết quả chính: ${String(data.keyFindings).trim()}`);
  }
  if (data.freeText && String(data.freeText).trim()) {
    parts.push(`Ghi chú khác: ${String(data.freeText).trim()}`);
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
  const name = project.name?.trim() || "Dự án";
  const oneLiner = (project.one_liner || project.idea || "").trim();
  const niche = (project.niche || project.targetCustomer || "").trim();

  // Process intake questions into known / unknown blocks
  const knownItems: string[] = [];
  const unknownItems: string[] = [];

  const answers = project.intake_answers || {};

  if (section.intake && section.intake.length > 0) {
    for (const q of section.intake) {
      const val = answers[q.id];
      const isUnknown =
        val === undefined ||
        val === null ||
        val === "" ||
        val === q.unknown_label ||
        (Array.isArray(val) && val.length === 0);

      if (isUnknown) {
        unknownItems.push(`- ${q.prompt_label || q.question}`);
      } else {
        const displayVal = Array.isArray(val) ? val.join(", ") : String(val);
        knownItems.push(`- ${q.prompt_label || q.question}: ${displayVal}`);
      }
    }
  } else if (project.availableData) {
    const data = project.availableData;
    if (data.surveyCount && Number(data.surveyCount) > 0) {
      knownItems.push(`- Khảo sát: ${data.surveyCount} người tham gia`);
    }
    if (data.interviewCount && Number(data.interviewCount) > 0) {
      knownItems.push(`- Phỏng vấn sâu: ${data.interviewCount} người`);
    }
    if (data.keyFindings && String(data.keyFindings).trim()) {
      knownItems.push(`- Kết quả chính: ${String(data.keyFindings).trim()}`);
    }
    if (data.freeText && String(data.freeText).trim()) {
      knownItems.push(`- Ghi chú: ${String(data.freeText).trim()}`);
    }
  }

  const parts: string[] = [];

  parts.push(
    `Bạn là trợ lý giúp nhóm sinh viên viết phần "${section.title}" trong Startup Proposal môn ${pack.course} (${pack.checkpoint}).`,
  );

  // <the_du_an>
  const theDuAnLines: string[] = [];
  theDuAnLines.push(`${name}: ${oneLiner}`);
  if (niche) {
    theDuAnLines.push(`Ngách: ${niche}`);
  }
  if (project.saved_summary && project.saved_summary.trim()) {
    theDuAnLines.push(`Đã chốt ở các phần trước: ${project.saved_summary.trim()}`);
  }
  parts.push(`<the_du_an>\n${theDuAnLines.join("\n")}\n</the_du_an>`);

  // <du_lieu_nhom>
  if (knownItems.length > 0) {
    parts.push(`<du_lieu_nhom>\n${knownItems.join("\n")}\n</du_lieu_nhom>`);
  }

  // <chua_co_du_lieu>
  if (unknownItems.length > 0) {
    parts.push(`<chua_co_du_lieu>\n${unknownItems.join("\n")}\n</chua_co_du_lieu>`);
  }

  // Tiêu chí tốt
  const criteriaText = section.criteria
    .map((c) => `- ${c.name}: ${c.levels.TOT}`)
    .join("\n");
  parts.push(`Một phần "${section.title}" tốt cần:\n${criteriaText}`);

  // Cách viết
  const rules = [
    `- Chỉ dùng số liệu và lời khách hàng có trong <du_lieu_nhom>, vì hội đồng sẽ hỏi nguồn.`,
    `- Chỗ cần dữ liệu mà chưa có, ghi [CẦN DỮ LIỆU: cần thu thập gì].`,
    `- Nhận định chưa kiểm chứng thì đánh dấu [GIẢ ĐỊNH].`,
    `- Giữ đúng ngách ở trên, không mở rộng sang nhóm khách hàng khác.`,
  ];
  if (unknownItems.length >= 2) {
    rules.push(`- Nếu thiếu thông tin quan trọng, hãy hỏi tôi tối đa 2 câu trước khi viết.`);
  }
  parts.push(`Cách viết:\n${rules.join("\n")}`);

  // Cấu trúc đầu ra
  const headings = section.criteria.map((c) => `### ${c.name}`).join("\n");
  parts.push(`Trình bày bằng tiếng Việt, mỗi tiêu chí là một tiêu đề nhỏ:\n${headings}`);

  return parts.join("\n\n");
}

export function buildFixPrompt(params: {
  sectionTitle: string;
  criterionName: string;
  totDescription?: string;
  currentReason: string;
  evidenceQuote?: string;
  userInputText?: string | null;
  actionType?: string;
  niche?: string;
}): string {
  const {
    sectionTitle,
    criterionName,
    currentReason,
    evidenceQuote,
    userInputText,
    actionType,
    niche,
  } = params;

  const lines: string[] = [];
  lines.push(`Sửa lại phần "${sectionTitle}" cho tiêu chí "${criterionName}".`);

  if (evidenceQuote && evidenceQuote.trim()) {
    lines.push(`Câu có vấn đề: "${evidenceQuote.trim()}".`);
  }
  lines.push(`Lý do: ${currentReason.trim()}`);

  if (userInputText && userInputText.trim()) {
    lines.push(`Dữ liệu bổ sung từ nhóm: ${userInputText.trim()}`);
  }

  if (actionType === "MARK_ASSUMPTIONS") {
    lines.push(`Đánh dấu [GIẢ ĐỊNH] cho mọi nhận định chưa kiểm chứng và thay số liệu thiếu nguồn bằng [CẦN DỮ LIỆU: ...].`);
  } else if (actionType === "FOCUS_REWRITE" && niche) {
    lines.push(`Viết lại chỉ tập trung cho ngách "${niche}", không lan man sang đối tượng khác.`);
  } else if (actionType === "NEED_DATA") {
    lines.push(`Chèn chính xác dữ liệu nhóm vừa cung cấp vào đúng ngữ cảnh.`);
  }

  lines.push(`Trả lại toàn bộ phần ${sectionTitle} sau khi sửa, giữ nguyên các ý khác.`);

  return lines.join("\n");
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
