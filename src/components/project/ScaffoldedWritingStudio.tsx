"use client";

import React, { useState } from "react";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  Lightbulb,
  PenTool,
  Sparkles,
} from "lucide-react";

interface ScaffoldField {
  id: string;
  label: string;
  placeholder: string;
  hint: string;
  prefix?: string;
  example: string;
}

interface ScaffoldSectionConfig {
  title: string;
  description: string;
  fields: ScaffoldField[];
  composerTemplate: (answers: Record<string, string>) => string;
}

const SECTION_CONFIGS: Record<string, ScaffoldSectionConfig> = {
  problem: {
    title: "Công thức viết Vấn đề (Problem Statement)",
    description: "Tự viết vấn đề chuẩn rubric EXE101 bằng cách trả lời 5 thành tố logic bên dưới.",
    fields: [
      {
        id: "context",
        label: "1. Bối cảnh & Nhóm khách hàng cụ thể",
        placeholder: "Vd: Sinh viên năm cuối các trường đại học khối kỹ thuật và kinh tế tại TP.HCM đang ở trọ xung quanh trường...",
        hint: "Nêu rõ ai, ở đâu, trong tình huống cụ thể nào. Tránh nói chung chung 'mọi người' hoặc 'giới trẻ'.",
        example: "Sinh viên năm cuối ĐH Bách Khoa và Kinh Tế tại TP.HCM đang làm đồ án tốt nghiệp và đi thực tập...",
      },
      {
        id: "pain",
        label: "2. Nỗi đau & Tổn thất đo lường được (Số giờ, số tiền, sức khỏe)",
        placeholder: "Vd: Tốn hơn 2 giờ mỗi ngày để đi chợ và sơ chế, chi phí đặt app từ 50.000đ - 70.000đ/bữa quá đắt, thường xuyên phải bỏ bữa hoặc ăn mì tôm...",
        hint: "Càng có con số đo đếm được (thời gian, chi phí, tần suất) thì điểm rubric càng cao.",
        example: "Mỗi ngày tốn ít nhất 90 phút đi chợ và nấu nướng, hoặc phải chi 60.000đ/bữa cho đồ ăn ngoài, dẫn đến đau dạ dày và tốn 30% ngân sách sinh hoạt...",
      },
      {
        id: "evidence",
        label: "3. Bằng chứng từ phỏng vấn & số liệu thực tế của nhóm",
        placeholder: "Vd: Qua phỏng vấn sâu 12 sinh viên ở trọ khu vực Dĩ An, 10/12 bạn chia sẻ rằng...",
        hint: "Đưa số người nhóm đã hỏi thật và trích dẫn câu nói của họ để không bị coi là bịa số liệu.",
        example: "Khảo sát 15 sinh viên năm cuối khu vực trọ quanh trường: 11 bạn thừa nhận phải bỏ bữa ít nhất 3 lần/tuần vì deadline dồn dập...",
      },
      {
        id: "alternatives",
        label: "4. Giải pháp thay thế hiện tại & Lý do họ chưa hài lòng",
        placeholder: "Vd: Hiện tại họ chọn ăn cơm tiệm hoặc đặt app, nhưng cơm tiệm không đảm bảo vệ sinh còn app thì phí ship quá cao...",
        hint: "Chỉ ra vì sao các cách họ đang tự khắc phục vẫn chưa giải quyết triệt để nỗi đau.",
        example: "Họ thường đặt đồ ăn qua các ứng dụng giao hàng hoặc ăn cơm tiệm bình dân, nhưng chi phí vượt quá ngân sách và không đảm bảo vệ sinh an toàn thực phẩm...",
      },
      {
        id: "urgency",
        label: "5. Tính cấp bách: Tại sao họ cần giải pháp ngay bây giờ?",
        placeholder: "Vd: Kỳ làm đồ án chỉ kéo dài 4 tháng với áp lực lớn, nếu không có giải pháp dinh dưỡng nhanh gọn họ sẽ kiệt sức...",
        hint: "Chứng minh đây là nỗi đau nhức nhối khiến họ sẵn sàng thử giải pháp mới ngay lập tức.",
        example: "Giai đoạn tốt nghiệp đòi hỏi năng lượng và sự tập trung cao độ, việc ăn uống kém chất lượng kéo dài khiến sức khỏe giảm sút rõ rệt trước kỳ bảo vệ...",
      },
    ],
    composerTemplate: (answers) => {
      const parts: string[] = [];
      if (answers.context) {
        parts.push(`Phân khúc và bối cảnh xuất hiện vấn đề:\n${answers.context}`);
      }
      if (answers.pain) {
        parts.push(`Nỗi đau và tổn thất cụ thể:\n${answers.pain}`);
      }
      if (answers.evidence) {
        parts.push(`Minh chứng từ nghiên cứu thực tế của nhóm:\n${answers.evidence}`);
      }
      if (answers.alternatives) {
        parts.push(`Các giải pháp thay thế hiện tại và hạn chế:\n${answers.alternatives}`);
      }
      if (answers.urgency) {
        parts.push(`Tính cấp bách cần giải quyết:\n${answers.urgency}`);
      }
      return parts.join("\n\n");
    },
  },
  customer: {
    title: "Công thức viết Khách hàng mục tiêu & Early Adopters",
    description: "Xác định rõ ràng chân dung khách hàng và nhóm tiên phong dùng thử giải pháp.",
    fields: [
      {
        id: "demographics",
        label: "1. Chân dung nhân khẩu học & địa bàn cụ thể",
        placeholder: "Vd: Sinh viên năm 3-4, độ tuổi 21-23, đang thuê trọ bán kính 2km quanh trường...",
        hint: "Tiêu chí rõ ràng: độ tuổi, trường học, khu vực sinh sống, khả năng chi trả.",
        example: "Sinh viên năm 3-4 các trường Đại học tại khu đô thị ĐHQG TP.HCM, ở trọ tự lập, ngân sách ăn uống 2.5 - 3.5 triệu/tháng...",
      },
      {
        id: "behavior",
        label: "2. Hành vi & thói quen sinh hoạt",
        placeholder: "Vd: Có thói quen thức khuya làm bài, chỉ có thời gian rảnh dưới 20 phút cho bữa tối...",
        hint: "Mô tả sinh hoạt thực tế của họ dẫn tới nhu cầu về sản phẩm.",
        example: "Lịch học và thực tập dày đặc, thường về phòng sau 19h, quen sử dụng điện thoại thông minh để đặt dịch vụ...",
      },
      {
        id: "early_adopters",
        label: "3. Nhóm khách hàng tiên phong (Early Adopters)",
        placeholder: "Vd: Các bạn sinh viên năm cuối đang làm đồ án tốt nghiệp tại KTX khu B...",
        hint: "Nhóm chịu đau đớn nhất và sẵn sàng bỏ tiền trải nghiệm sản phẩm đầu tiên của nhóm.",
        example: "Nhóm sinh viên năm 4 chuẩn bị nộp đồ án tốt nghiệp, có nhu cầu ăn uống nhanh gọn nhưng muốn đồ ăn tự nấu nóng hổi...",
      },
      {
        id: "reach_channel",
        label: "4. Kênh tiếp cận trực tiếp ngoài đời",
        placeholder: "Vd: Tiếp cận trực tiếp qua các hội nhóm trọ sinh viên, phát tờ rơi tại cổng KTX, qua bạn bè cùng lớp...",
        hint: "Kênh thực tế nhóm có thể ra quân gặp mặt ngay tuần này.",
        example: "Trực tiếp tại sảnh KTX, các quán cà phê tự học quanh trường và cộng đồng sinh viên khóa tốt nghiệp trên mạng xã hội...",
      },
    ],
    composerTemplate: (answers) => {
      const parts: string[] = [];
      if (answers.demographics) {
        parts.push(`1. Chân dung khách hàng mục tiêu:\n${answers.demographics}`);
      }
      if (answers.behavior) {
        parts.push(`2. Đặc điểm hành vi và bối cảnh sử dụng:\n${answers.behavior}`);
      }
      if (answers.early_adopters) {
        parts.push(`3. Nhóm khách hàng tiên phong (Early Adopters):\n${answers.early_adopters}`);
      }
      if (answers.reach_channel) {
        parts.push(`4. Kênh tiếp cận thực tế giai đoạn đầu:\n${answers.reach_channel}`);
      }
      return parts.join("\n\n");
    },
  },
};

const DEFAULT_CONFIG: ScaffoldSectionConfig = {
  title: "Giàn giáo soạn thảo đề án Khởi nghiệp",
  description: "Điền các luận điểm cốt lõi để hệ thống tự ghép thành bài viết hoàn chỉnh bằng chính ngôn từ của bạn.",
  fields: [
    {
      id: "part1",
      label: "1. Luận điểm trọng tâm",
      placeholder: "Trình bày luận điểm chính của phần này...",
      hint: "Gắn liền với ngách và khách hàng mục tiêu của dự án.",
      example: "Nêu rõ nhóm khách hàng và bối cảnh...",
    },
    {
      id: "part2",
      label: "2. Dữ liệu & Bằng chứng thực tế",
      placeholder: "Nhóm đã thu thập được dữ liệu, số liệu hay phỏng vấn gì...",
      hint: "Đưa ra bằng chứng cụ thể để chứng minh luận điểm.",
      example: "Khảo sát và phỏng vấn trực tiếp...",
    },
    {
      id: "part3",
      label: "3. Kế hoạch triển khai & Tính khả thi",
      placeholder: "Cách nhóm sẽ thực hiện như thế nào trong thực tế...",
      hint: "Nêu rõ nguồn lực và tính khả thi của nhóm.",
      example: "Phương án thử nghiệm trong 2 tuần tới...",
    },
  ],
  composerTemplate: (answers) => {
    return Object.values(answers).filter(Boolean).join("\n\n");
  },
};

interface ScaffoldedWritingStudioProps {
  sectionId: string;
  initialAnswers: Record<string, string>;
  onApplyDraft: (draftText: string, answers: Record<string, string>) => void;
}

export function ScaffoldedWritingStudio({
  sectionId,
  initialAnswers,
  onApplyDraft,
}: ScaffoldedWritingStudioProps) {
  const config = SECTION_CONFIGS[sectionId] || DEFAULT_CONFIG;
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers || {});
  const [showExamples, setShowExamples] = useState<Record<string, boolean>>({});
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  const handleFieldChange = (fieldId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [fieldId]: value }));
  };

  const toggleExample = (fieldId: string) => {
    setShowExamples((prev) => ({ ...prev, [fieldId]: !prev[fieldId] }));
  };

  const composedDraft = config.composerTemplate(answers);
  const filledCount = config.fields.filter((f) => !!answers[f.id]?.trim()).length;
  const isComplete = filledCount === config.fields.length;

  const handleApply = () => {
    if (!composedDraft.trim()) return;
    onApplyDraft(composedDraft, answers);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="space-y-5">
      {/* Header Info */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 dark:bg-blue-950/30 p-4 space-y-1.5">
        <div className="flex items-center gap-2">
          <PenTool className="size-4 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-xs text-blue-950 dark:text-blue-100">
            {config.title}
          </h3>
        </div>
        <p className="text-[11px] text-blue-900/80 dark:text-blue-200/80 leading-relaxed">
          {config.description} Hệ thống sẽ tự ghép thành bài viết hoàn chỉnh từ chính câu trả lời của nhóm, <strong>không dùng AI sinh văn bản hộ</strong>.
        </p>

        <div className="flex items-center justify-between text-[11px] pt-1 font-semibold text-blue-800 dark:text-blue-300">
          <span>Tiến độ hoàn thành khung:</span>
          <span>
            {filledCount}/{config.fields.length} mục ({Math.round((filledCount / config.fields.length) * 100)}%)
          </span>
        </div>
      </div>

      {/* Structured Fields */}
      <div className="space-y-4">
        {config.fields.map((field, idx) => {
          const value = answers[field.id] || "";
          const hasVal = !!value.trim();

          return (
            <div
              key={field.id}
              className={`rounded-xl border p-4 space-y-2 transition-all ${
                hasVal
                  ? "border-emerald-300/80 bg-emerald-50/20 dark:border-emerald-900/40"
                  : "border-[var(--line)] bg-[var(--surface)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <label className="font-bold text-xs text-[var(--ink)] flex items-center gap-1.5">
                  {hasVal && <Check className="size-3.5 text-emerald-600" />}
                  {field.label}
                </label>
                <button
                  type="button"
                  onClick={() => toggleExample(field.id)}
                  className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Lightbulb className="size-3" />
                  {showExamples[field.id] ? "Ẩn bài mẫu" : "Xem ví dụ chuẩn"}
                </button>
              </div>

              <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                💡 <strong>Gợi ý:</strong> {field.hint}
              </p>

              {showExamples[field.id] && (
                <div className="rounded-lg bg-blue-50/80 dark:bg-blue-950/50 p-2.5 text-[11px] text-blue-900 dark:text-blue-200 border-l-2 border-blue-500 italic">
                  <strong>Ví dụ đạt điểm Tốt:</strong> "{field.example}"
                </div>
              )}

              <textarea
                rows={3}
                placeholder={field.placeholder}
                value={value}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--ink)] leading-relaxed focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          );
        })}
      </div>

      {/* Draft Composer Box */}
      {composedDraft.trim() && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--ink)] flex items-center gap-1.5">
              <FileText className="size-4 text-[var(--accent)]" />
              Bản ghép hoàn chỉnh từ tư duy của nhóm:
            </span>
            <span className="text-[10px] font-semibold text-emerald-600">
              ✓ 100% Tự Lực (Không AI sinh bài)
            </span>
          </div>

          <pre className="rounded-lg border border-[var(--line)] bg-[var(--surface)] p-3 text-xs font-sans text-[var(--ink)] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
            {composedDraft}
          </pre>

          <button
            type="button"
            onClick={handleApply}
            className="inline-flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-sm"
          >
            {copiedSuccess ? (
              <>
                <CheckCircle2 className="size-4" />
                Đã chuyển sang Bài làm chính!
              </>
            ) : (
              <>
                <FileText className="size-4" />
                Áp dụng bản này vào Bài làm chính để Chấm Rubric ➔
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

