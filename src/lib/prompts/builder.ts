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
    return "(Nhóm chưa có dữ liệu thực tế, AI sẽ tự đề xuất số liệu mẫu phù hợp)";
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
    : "(Nhóm chưa có dữ liệu thực tế, AI sẽ tự đề xuất số liệu mẫu phù hợp)";
}

export function buildInitialPrompt(
  pack: Pack,
  section: Section,
  project: ProjectPromptInput,
): string {
  const name = project.name?.trim() || "Dự án";
  const oneLiner = (project.one_liner || project.idea || "").trim();
  const niche = (project.niche || project.targetCustomer || "").trim();

  // Process intake questions into known items
  const knownItems: string[] = [];
  const answers = project.intake_answers || {};

  if (section.intake && section.intake.length > 0) {
    for (const q of section.intake) {
      const val = answers[q.id];
      const isKnown =
        val !== undefined &&
        val !== null &&
        val !== "" &&
        val !== q.unknown_label &&
        (!Array.isArray(val) || val.length > 0);

      if (isKnown) {
        const displayVal = Array.isArray(val) ? val.join(", ") : String(val);
        knownItems.push(`${q.prompt_label || q.question}: ${displayVal}`);
      }
    }
  } else if (project.availableData) {
    const data = project.availableData;
    if (data.surveyCount && Number(data.surveyCount) > 0) {
      knownItems.push(`Khảo sát: ${data.surveyCount} người tham gia`);
    }
    if (data.interviewCount && Number(data.interviewCount) > 0) {
      knownItems.push(`Phỏng vấn sâu: ${data.interviewCount} người`);
    }
    if (data.keyFindings && String(data.keyFindings).trim()) {
      knownItems.push(`Kết quả chính: ${String(data.keyFindings).trim()}`);
    }
    if (data.freeText && String(data.freeText).trim()) {
      knownItems.push(`Ghi chú: ${String(data.freeText).trim()}`);
    }
  }

  const parts: string[] = [];

  parts.push(
    `Bạn là chuyên gia cố vấn khởi nghiệp. Hãy viết hoàn chỉnh nội dung phần "${section.title}" cho đề án khởi nghiệp của nhóm sinh viên.`
  );

  // Project Information
  const projectLines: string[] = [
    `THÔNG TIN DỰ ÁN:`,
    `- Tên dự án: ${name}`,
  ];
  if (oneLiner) {
    projectLines.push(`- Ý tưởng cốt lõi: ${oneLiner}`);
  }
  if (niche) {
    projectLines.push(`- Khách hàng mục tiêu và ngách: ${niche}`);
  }
  if (project.domain) {
    projectLines.push(`- Lĩnh vực: ${project.domain}`);
  }
  if (project.saved_summary && project.saved_summary.trim()) {
    projectLines.push(`- Nội dung đã chốt ở phần trước: ${project.saved_summary.trim()}`);
  }
  if (knownItems.length > 0) {
    projectLines.push(`- Dữ liệu thực tế nhóm đã có:`);
    for (const item of knownItems) {
      projectLines.push(`  + ${item}`);
    }
  }
  parts.push(projectLines.join("\n"));

  // Rubric Criteria
  const criteriaLines: string[] = [
    `TIÊU CHUẨN CẦN ĐẠT ĐƯỢC CHO PHẦN "${section.title}":`,
  ];
  section.criteria.forEach((c, index) => {
    criteriaLines.push(`${index + 1}. ${c.name}: ${c.levels.TOT}`);
  });
  parts.push(criteriaLines.join("\n"));

  // Writing rules
  const rulesLines: string[] = [
    `YÊU CẦU KHI VIẾT:`,
    `- Hãy viết và sinh ra kết quả hoàn chỉnh ngay lập tức trong câu trả lời đầu tiên, tuyệt đối không đặt câu hỏi lại người dùng.`,
    `- Nếu nhóm chưa có đủ số liệu thực tế, hãy chủ động đưa ra các ví dụ, tình huống và số liệu mẫu hợp lý bám sát ngách khách hàng để bài viết thuyết phục nhất.`,
    `- Không sử dụng các ký hiệu ghi chú như cần dữ liệu hay giả định. Viết như một bản đề án hoàn chỉnh, chuyên nghiệp.`,
    `- Bám sát ngách khách hàng đã nêu, lập luận chặt chẽ và mạch lạc bằng tiếng Việt.`,
  ];
  parts.push(rulesLines.join("\n"));

  // Output structure
  const structureLines: string[] = [
    `BỐ CỤC BÀI VIẾT:`,
    `Trình bày rõ ràng theo từng phần sau:`,
  ];
  section.criteria.forEach((c, index) => {
    structureLines.push(`${index + 1}. ${c.name}`);
  });
  parts.push(structureLines.join("\n"));

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
    pass: "Qua môn (Đạt tiêu chuẩn)",
    good: "Khá (Khoảng 7-8 điểm)",
    excellent: "Xuất sắc (Khoảng 9-10 điểm)",
  };

  const sections: string[] = [];

  sections.push(
    `Bạn là chuyên gia cố vấn khởi nghiệp. Hãy sửa lại và hoàn thiện nội dung cho phần "${sectionTitle}" thuộc tiêu chí "${criterionName}".`
  );

  const fixDetails: string[] = [
    `CHI TIẾT CẦN KHẮC PHỤC:`,
  ];
  if (evidenceQuote && evidenceQuote.trim()) {
    fixDetails.push(`- Đoạn văn đang cần sửa: "${evidenceQuote.trim()}"`);
  }
  fixDetails.push(`- Vấn đề cần khắc phục: ${missing || currentReason || "Nội dung hiện tại chưa đáp ứng đủ tiêu chí."}`);
  if (whyImportant?.trim()) {
    fixDetails.push(`- Lý do cần sửa: ${whyImportant.trim()}`);
  }
  fixDetails.push(`- Tiêu chuẩn mục tiêu (${targetLabelMap[targetLevel] || targetLevel}): ${rubricRequirement || totDescription || "Đạt chuẩn cao nhất"}`);
  sections.push(fixDetails.join("\n"));

  if (exampleFormula && exampleFormula.trim()) {
    sections.push(`CÁCH VIẾT THAM KHẢO:\n${exampleFormula.trim()}`);
  }

  if (userInputText && userInputText.trim()) {
    sections.push(`THÔNG TIN BỔ SUNG CỦA NHÓM:\n${userInputText.trim()}`);
  }

  const rules: string[] = [
    `NGUYÊN TẮC VIẾT:`,
    `- Hãy sinh ra đoạn văn hoàn chỉnh đã sửa ngay lập tức, không dừng lại hỏi người dùng.`,
    `- Giữ đúng ngách khách hàng${niche ? ` ("${niche}")` : ""}, không lan man sang đối tượng khác.`,
    `- Nếu thiếu số liệu khảo sát cụ thể, hãy tự bổ sung số liệu và dẫn chứng mẫu hợp lý, không dùng các ký hiệu ghi chú như cần dữ liệu hay giả định.`,
  ];

  if (keptQuotes && keptQuotes.length > 0) {
    rules.push(`- Giữ nguyên các câu đã đạt sau đây trong bài viết:`);
    for (const q of keptQuotes) {
      rules.push(`  + "${q}"`);
    }
  }

  rules.push(`- Trình bày mạch lạc, tự nhiên bằng tiếng Việt và trả lại đoạn văn hoàn chỉnh sau khi sửa.`);
  sections.push(rules.join("\n"));

  return sections.join("\n\n");
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
        "Chưa có dữ liệu thật, AI sẽ tự đề xuất số liệu và tình huống mẫu phù hợp.",
    });
  }

  return {
    ok: issues.length === 0,
    issues,
  };
}
