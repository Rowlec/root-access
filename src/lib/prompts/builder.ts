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
  targetLevel?: "pass" | "good" | "excellent";
  rubricRequirement?: string;
  totDescription?: string;
  currentReason?: string;
  missing?: string;
  whyImportant?: string;
  evidenceQuote?: string;
  exampleFormula?: string;
  userInputText?: string | null;
  keptQuotes?: string[];
  actionType?: string;
  niche?: string;
}): string {
  const {
    sectionTitle,
    criterionName,
    targetLevel = "good",
    rubricRequirement,
    totDescription,
    currentReason,
    missing,
    whyImportant,
    evidenceQuote,
    exampleFormula,
    userInputText,
    keptQuotes = [],
    actionType,
    niche,
  } = params;

  const targetLabelMap: Record<string, string> = {
    pass: "Qua môn (Đạt tiêu chí cơ bản)",
    good: "Khá (Khoảng 7–8 điểm)",
    excellent: "Xuất sắc (Khoảng 9–10 điểm)",
  };

  const lines: string[] = [];
  lines.push(`Hãy sửa lại nội dung phần "${sectionTitle}" cho tiêu chí "${criterionName}" dựa trên câu trả lời thực tế của nhóm theo đúng các yêu cầu sau:`);

  // (1) Câu yếu, trích nguyên văn
  if (evidenceQuote && evidenceQuote.trim()) {
    lines.push(`1. ĐOẠN VĂN CẦN SỬA (trích nguyên văn từ bài làm):\n"${evidenceQuote.trim()}"`);
  } else {
    lines.push(`1. VẤN ĐỀ CẦN SỬA:\n${missing || currentReason || "Nội dung hiện tại chưa đáp ứng đủ tiêu chí."}`);
  }

  // (2) Điểm còn thiếu & Vì sao quan trọng
  const whyImportantText = whyImportant?.trim() || "";
  lines.push(
    `2. YÊU CẦU THEO RUBRIC [Mục tiêu: ${targetLabelMap[targetLevel] || targetLevel}]:\n- Điểm còn thiếu: ${missing || currentReason || "Chưa hoàn thiện tiêu chuẩn rubric."}${
      whyImportantText ? `\n- Vì sao quan trọng: ${whyImportantText}` : ""
    }${rubricRequirement ? `\n- Tiêu chuẩn cần đạt: ${rubricRequirement.trim()}` : ""}`,
  );

  // (3) Cách viết lấy từ bài mẫu (công thức hành văn, không chép chữ)
  if (exampleFormula && exampleFormula.trim()) {
    lines.push(`3. CÁCH VIẾT THAM KHẢO (áp dụng công thức hành văn, không sao chép nguyên văn):\n${exampleFormula.trim()}`);
  }

  // (4) Dữ liệu sinh viên vừa nhập từ câu trả lời gợi mở
  if (userInputText && userInputText.trim()) {
    lines.push(`4. THÔNG TIN THẬT DO NHÓM CUNG CẤP (Câu trả lời của sinh viên):\n${userInputText.trim()}`);
  }

  // Action type specific notes
  if (actionType === "FOCUS_REWRITE" && niche) {
    lines.push(`LƯU Ý ĐẶC BIỆT: Viết lại chỉ tập trung cho đúng ngách "${niche}", không lan man sang đối tượng khác.`);
  }

  // (5) Khóa phần tốt & Nguyên tắc chống bịa số
  const rules: string[] = [
    "DÙNG ĐÚNG THÔNG TIN THẬT SINH VIÊN ĐÃ ĐIỀN Ở MỤC 4. TUYỆT ĐỐI KHÔNG BỊA ĐẶT THÊM SỐ LIỆU HAY BẰNG CHỨNG GIẢ TẠO.",
    "CHỈ SỬA CÂU CẦN SỬA Ở MỤC 1. GIỮ NGUYÊN TOÀN BỘ CÁC CÂU KHÁC TRONG ĐOẠN VĂN.",
  ];

  if (keptQuotes && keptQuotes.length > 0) {
    rules.push("Các câu sau đây đã đạt yêu cầu, TUYỆT ĐỐI KHÔNG ĐƯỢC THAY ĐỔI:\n" + keptQuotes.map((q) => `  - "${q}"`).join("\n"));
  }

  rules.push("Nếu thiếu thông tin, hãy ghi [CẦN DỮ LIỆU: cần thu thập gì], không tự ý suy đoán số liệu cho sinh viên.");

  lines.push(`5. NGUYÊN TẮC BẮT BUỘC:\n` + rules.map((r, i) => `${i + 1}) ${r}`).join("\n"));

  lines.push(`Trả lại đoạn văn hoàn chỉnh sau khi sửa.`);

  return lines.join("\n\n");
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
