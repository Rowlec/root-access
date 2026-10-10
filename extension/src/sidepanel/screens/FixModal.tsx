import React, { useState } from "react";
import { ArrowLeft, Check, HelpCircle, Loader2, Send, Sparkles, AlertTriangle } from "lucide-react";
import { api } from "../../lib/api";
import { insertPromptToTab } from "../../lib/messages";
import { track } from "../../lib/tracking";
import { FixAction, GradeResult } from "../../lib/types";

export function FixModal({
  action,
  gradeResult,
  siteId,
  onClose,
  onSuccess,
}: {
  action: FixAction;
  gradeResult: GradeResult;
  siteId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [insertSuccess, setInsertSuccess] = useState(false);

  // Find related criterion for quote and detailed guidance
  const relatedCrit = gradeResult.criteria.find((c) => c.id === action.criterion_id);

  // 1-2 guiding questions
  const guidingQuestions =
    (action.guiding_questions && action.guiding_questions.length > 0)
      ? action.guiding_questions
      : (relatedCrit?.guiding_questions && relatedCrit.guiding_questions.length > 0)
      ? relatedCrit.guiding_questions
      : [
          `Nhóm đã phỏng vấn hoặc khảo sát bao nhiêu người về tiêu chí "${relatedCrit?.name || action.label}"? Họ trả lời ra sao?`,
        ];

  const whyImportant =
    action.why_important ||
    relatedCrit?.why_important ||
    "Giảng viên và hội đồng bảo vệ sẽ trừ điểm ở tiêu chí này nếu bài viết thiếu dữ liệu thực tế kiểm chứng.";

  const weakQuote = relatedCrit?.evidence_quote?.trim() || "";

  const handleApplyFix = async () => {
    if (!userAnswer.trim()) return;

    setSubmitting(true);
    try {
      track("fix_action_clicked", { type: action.type, criterion_id: action.criterion_id });

      const res = await api.fixPrompt({
        grade_id: gradeResult.grade_id,
        action_id: action.id,
        user_input: {
          answer: userAnswer.trim(),
        },
      });

      const insertRes = await insertPromptToTab(res.prompt_text, false);
      if (insertRes.ok) {
        setInsertSuccess(true);
        track("prompt_inserted", { site: siteId, section_id: gradeResult.section_id, kind: "fix" });
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(res.prompt_text);
        alert("Đã tự động sao chép prompt sửa vào clipboard! Vui lòng dán vào ô chat.");
        onSuccess();
      }
    } catch (err: any) {
      alert(err.message || "Tạo prompt sửa thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const isAnswerValid = userAnswer.trim().length >= 5;

  return (
    <div className="flex h-screen flex-col overflow-y-auto p-4 space-y-4 bg-[#090d16] text-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại kết quả chấm
        </button>
        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
          Sửa có hướng dẫn
        </span>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles size={16} className="text-blue-400" />
          {action.label}
        </h3>
        <p className="text-[11px] text-slate-400">
          RootAccess hướng dẫn bạn tự trả lời để hiểu sâu bài đề án, không sửa thay.
        </p>
      </div>

      {/* 1. Chỗ nào: Đoạn văn đang yếu */}
      {weakQuote ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            1. Chỗ nào đang yếu (Trích bài làm):
          </span>
          <p className="text-xs text-amber-100 font-mono italic underline decoration-amber-400/60 decoration-wavy">
            &ldquo;{weakQuote}&rdquo;
          </p>
        </div>
      ) : null}

      {/* 2. Thiếu gì: Tiêu chí rubric */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
          2. Thiếu gì (Theo Rubric):
        </span>
        <p className="text-xs text-slate-200 font-medium leading-relaxed">
          {action.explanation || relatedCrit?.reason}
        </p>
      </div>

      {/* 3. Vì sao quan trọng: Rủi ro trừ điểm */}
      <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
          <AlertTriangle size={12} />
          3. Vì sao quan trọng (Rủi ro bảo vệ):
        </span>
        <p className="text-xs text-rose-200 leading-relaxed">
          {whyImportant}
        </p>
      </div>

      {/* 4. Câu hỏi gợi mở & Ô trả lời của sinh viên */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 space-y-2.5">
        <div className="flex items-start gap-1.5">
          <HelpCircle size={15} className="text-blue-400 shrink-0 mt-0.5" />
          <span className="text-xs font-bold text-blue-200">
            4. Câu hỏi gợi mở (Sinh viên tự trả lời):
          </span>
        </div>

        <ul className="text-xs text-blue-100/90 list-disc list-inside space-y-1 pl-1">
          {guidingQuestions.map((q, idx) => (
            <li key={idx} className="leading-relaxed">
              <strong className="text-white">{q}</strong>
            </li>
          ))}
        </ul>

        <div className="pt-1 space-y-1">
          <label className="block text-[11px] font-semibold text-slate-300">
            Điền câu trả lời thực tế của nhóm:
          </label>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Nhập thông tin hoặc số liệu thực tế của nhóm (ví dụ: 'Nhóm đã phỏng vấn 15 bạn sinh viên, 11 bạn chia sẻ rằng mỗi tuần tốn ít nhất 4 giờ tự sơ chế đồ ăn...')"
            rows={4}
            className="w-full rounded-xl border border-white/10 bg-black/60 p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed"
          />
        </div>

        {!isAnswerValid ? (
          <p className="text-[11px] text-amber-300/90 flex items-center gap-1.5 pt-0.5">
            <span>ℹ️ Hãy điền câu trả lời thật ở trên để bật nút tạo prompt sửa.</span>
          </p>
        ) : (
          <p className="text-[11px] text-emerald-400 flex items-center gap-1.5 pt-0.5">
            <span>✓ Đã có thông tin nhóm! Bạn có thể bấm tạo prompt sửa bên dưới.</span>
          </p>
        )}
      </div>

      {/* Button: Tạo prompt từ câu trả lời của tôi (Chỉ bật khi đã điền câu trả lời) */}
      <div className="mt-auto pt-3 border-t border-white/10 space-y-2">
        <button
          onClick={handleApplyFix}
          disabled={submitting || !isAnswerValid}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-bold transition-all shadow-lg ${
            isAnswerValid
              ? "bg-blue-600 text-white shadow-blue-500/25 hover:bg-blue-500 cursor-pointer"
              : "bg-white/10 text-slate-500 cursor-not-allowed border border-white/5"
          }`}
        >
          {submitting ? (
            <>
              <Loader2 className="animate-spin size-4" />
              Đang tạo prompt sửa...
            </>
          ) : insertSuccess ? (
            <>
              <Check size={16} className="text-green-300" />
              Đã chèn prompt sửa vào ô chat!
            </>
          ) : (
            <>
              <Send size={15} />
              Tạo prompt từ câu trả lời của tôi
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-400 text-center">
          Prompt chỉ sử dụng dữ liệu bạn nhập ở trên và yêu cầu AI giữ nguyên các câu đã đạt.
        </p>
      </div>
    </div>
  );
}
