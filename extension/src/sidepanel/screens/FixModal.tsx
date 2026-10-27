import React, { useState } from "react";
import { ArrowLeft, Check, Copy, Loader2, Send, Sparkles } from "lucide-react";
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
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Find related criterion for quote and detailed guidance
  const relatedCrit = gradeResult.criteria.find((c) => c.id === action.criterion_id);
  const weakQuote = relatedCrit?.evidence_quote?.trim() || "";
  const directExplanation = action.explanation || relatedCrit?.reason || "Cần hoàn thiện tiêu chí theo đúng rubric.";

  const handleApplyFix = async () => {
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
        }, 1200);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(res.prompt_text);
        setCopiedPrompt(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err: any) {
      alert(err.message || "Tạo prompt sửa thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyFixPrompt = async () => {
    setSubmitting(true);
    try {
      const res = await api.fixPrompt({
        grade_id: gradeResult.grade_id,
        action_id: action.id,
        user_input: {
          answer: userAnswer.trim(),
        },
      });

      await navigator.clipboard.writeText(res.prompt_text);
      setCopiedPrompt(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: any) {
      alert(err.message || "Sao chép prompt thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

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
        <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
          Gợi ý sửa thẳng
        </span>
      </div>

      {/* Title */}
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles size={16} className="text-blue-400 shrink-0" />
          {action.label}
        </h3>
        <p className="text-[11px] text-slate-400">
          Đề xuất khắc phục trực tiếp tiêu chí này vào bài làm.
        </p>
      </div>

      {/* 1. Chỗ nào: Đoạn văn đang yếu */}
      {weakQuote ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
            Đoạn văn cần sửa (trích bài làm):
          </span>
          <p className="text-xs text-amber-100 font-mono italic underline decoration-amber-400/60 decoration-wavy leading-relaxed">
            &ldquo;{weakQuote}&rdquo;
          </p>
        </div>
      ) : null}

      {/* 2. Gợi ý sửa thẳng */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 space-y-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">
          Vấn đề & Đề xuất sửa thẳng:
        </span>
        <p className="text-xs text-blue-100 font-medium leading-relaxed">
          {directExplanation}
        </p>
      </div>

      {/* 3. Dữ liệu bổ sung (Tùy chọn) */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-200">
            Số liệu hoặc ghi chú của nhóm (Tùy chọn):
          </label>
          <span className="text-[10px] text-slate-400">Không bắt buộc</span>
        </div>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          placeholder="Nếu có số liệu khảo sát thật hoặc lưu ý riêng, bạn có thể điền vào đây (hoặc để trống để AI tự tối ưu)..."
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-black/60 p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed"
        />
      </div>

      {/* Buttons */}
      <div className="mt-auto pt-3 border-t border-white/10 space-y-2">
        <button
          onClick={handleApplyFix}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 cursor-pointer disabled:opacity-50 transition-all"
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
              Tạo & Chèn prompt sửa vào ChatGPT
            </>
          )}
        </button>

        <button
          onClick={handleCopyFixPrompt}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 cursor-pointer disabled:opacity-50 transition-all"
        >
          {copiedPrompt ? (
            <>
              <Check size={14} className="text-green-400" />
              Đã sao chép prompt sửa!
            </>
          ) : (
            <>
              <Copy size={14} />
              Sao chép prompt sửa
            </>
          )}
        </button>

        <p className="text-[10px] text-slate-400 text-center pt-1">
          Prompt yêu cầu AI sửa trực tiếp đoạn văn trên và giữ nguyên toàn bộ các câu đã đạt.
        </p>
      </div>
    </div>
  );
}
