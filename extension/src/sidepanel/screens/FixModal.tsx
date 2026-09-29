import React, { useState } from "react";
import { ArrowLeft, Check, Loader2, Send, Sparkles } from "lucide-react";
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
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [insertSuccess, setInsertSuccess] = useState(false);

  const inputs = action.inputs || [];

  const handleInputChange = (key: string, val: string) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleApplyFix = async () => {
    setSubmitting(true);
    try {
      track("fix_action_clicked", { type: action.type, criterion_id: action.criterion_id });

      const res = await api.fixPrompt({
        grade_id: gradeResult.grade_id,
        action_id: action.id,
        user_input: Object.keys(formData).length > 0 ? formData : null,
      });

      const insertRes = await insertPromptToTab(res.prompt_text, false);
      if (insertRes.ok) {
        setInsertSuccess(true);
        track("prompt_inserted", { site: siteId, section_id: gradeResult.section_id, kind: "fix" });
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        alert("Không thể tự điền vào ô chat. Vui lòng kiểm tra tab chat.");
      }
    } catch (err: any) {
      alert(err.message || "Tạo prompt sửa thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft size={16} /> Quay lại kết quả
        </button>
      </div>

      <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 space-y-1.5">
        <h3 className="text-xs font-bold text-white flex items-center gap-2">
          <Sparkles size={15} className="text-blue-400" />
          {action.label}
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {action.explanation}
        </p>
      </div>

      {inputs.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Dữ liệu thật nhóm vừa cung cấp:
          </h4>
          {inputs.map((inp) => (
            <div key={inp.key}>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {inp.label}
              </label>
              <textarea
                value={formData[inp.key] || ""}
                onChange={(e) => handleInputChange(inp.key, e.target.value)}
                placeholder={inp.placeholder || "Nhập thông tin thực tế..."}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-black/40 p-2.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-slate-300">
          Hành động này sẽ chèn một prompt sửa chuyên biệt vào ô chat của bạn nhằm hoàn thiện tiêu chí này mà không bịa thêm số liệu mới.
        </div>
      )}

      <div className="mt-auto pt-3">
        <button
          onClick={handleApplyFix}
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? (
            <Loader2 className="animate-spin size-4" />
          ) : insertSuccess ? (
            <Check size={16} className="text-green-300" />
          ) : (
            <Send size={15} />
          )}
          {insertSuccess
            ? "Đã điền prompt sửa! Bạn hãy tự bấm gửi."
            : "Chèn prompt sửa vào ô chat"}
        </button>
      </div>
    </div>
  );
}
