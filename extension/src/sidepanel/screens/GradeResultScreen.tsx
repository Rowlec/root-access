import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { api } from "../../lib/api";
import { readLastAnswerFromTab } from "../../lib/messages";
import { track } from "../../lib/tracking";
import { FixAction, GradeResult, Pack, Project, Section } from "../../lib/types";
import { CouncilQuestions } from "../components/CouncilQuestions";
import { CriterionRow } from "../components/CriterionRow";
import { FixActionCard } from "../components/FixActionCard";
import { WarningList } from "../components/WarningList";

export function GradeResultScreen({
  result,
  section,
  project,
  pack,
  siteId,
  creditsLeft,
  onBack,
  onSelectFixAction,
  onRegradeComplete,
  onOutOfCredits,
}: {
  result: GradeResult;
  section: Section;
  project: Project;
  pack: Pack;
  siteId: string;
  creditsLeft: number;
  onBack: () => void;
  onSelectFixAction: (action: FixAction) => void;
  onRegradeComplete: (newResult: GradeResult) => void;
  onOutOfCredits: () => void;
}) {
  const [regrading, setRegrading] = useState(false);

  const passingCount = result.criteria.filter(
    (c) => c.level === "DAT" || c.level === "TOT",
  ).length;
  const totalCriteria = result.criteria.length;
  const isAllPassed = passingCount === totalCriteria && totalCriteria > 0;

  const handleRegrade = async () => {
    if (creditsLeft <= 0) {
      onOutOfCredits();
      return;
    }

    setRegrading(true);
    try {
      const answerRes = await readLastAnswerFromTab();
      if (!answerRes.ok || !answerRes.text) {
        alert("Không tìm thấy câu trả lời AI mới trên trang để chấm lại.");
        setRegrading(false);
        return;
      }

      const newResult = await api.gradeAnswer({
        project_id: project.id,
        section_id: section.id,
        output_text: answerRes.text,
        parent_grade_id: result.grade_id,
        site: siteId,
      });

      track("regrade_completed", {
        n_improved: newResult.compare_with_parent?.improved?.length ?? 0,
        n_worse: newResult.compare_with_parent?.worse?.length ?? 0,
      });

      onRegradeComplete(newResult);
    } catch (err: any) {
      if (err.code === "NO_CREDIT") {
        onOutOfCredits();
      } else {
        alert(err.message || "Chấm lại thất bại, vui lòng thử lại.");
      }
    } finally {
      setRegrading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <ArrowLeft size={16} /> Danh sách phần
        </button>
        <span className="text-[11px] text-slate-400 font-medium">
          {section.title}
        </span>
      </div>

      {/* Summary Card */}
      <div
        className={`rounded-2xl border p-4 space-y-2 ${
          isAllPassed
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            : "border-blue-500/30 bg-blue-500/10 text-blue-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isAllPassed ? (
              <CheckCircle2 className="size-5 text-emerald-400" />
            ) : (
              <Sparkles className="size-5 text-blue-400" />
            )}
            <h3 className="text-sm font-bold text-white">
              {isAllPassed ? "Phần này đã Đạt chuẩn!" : "Kết quả đánh giá theo Rubric"}
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-black/30 border border-white/10">
            {passingCount}/{totalCriteria} Tiêu chí Đạt
          </span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {isAllPassed
            ? "Tuyệt vời! Không còn tiêu chí nào Chưa đạt. Bạn có thể chuyển sang phần tiếp theo hoặc hoàn thiện thêm."
            : "Dưới đây là chi tiết từng tiêu chí và các nút sửa cụ thể giúp bài viết hoàn thiện hơn."}
        </p>
      </div>

      {/* Criteria Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Chi tiết từng tiêu chí
        </h4>
        <div className="space-y-2">
          {result.criteria.map((c) => (
            <CriterionRow key={c.id} criterion={c} />
          ))}
        </div>
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <WarningList warnings={result.warnings} />
      )}

      {/* Fix Actions */}
      {result.fix_actions && result.fix_actions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Gợi ý hành động sửa (Chọn để chèn prompt sửa)
          </h4>
          <div className="space-y-2">
            {result.fix_actions.map((fa) => (
              <FixActionCard
                key={fa.id}
                action={fa}
                onSelect={(action) => onSelectFixAction(action)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Council Questions */}
      {result.likely_questions && result.likely_questions.length > 0 && (
        <CouncilQuestions questions={result.likely_questions} />
      )}

      {/* Regrade Button */}
      <div className="mt-auto pt-3 border-t border-white/10 space-y-2">
        <button
          onClick={handleRegrade}
          disabled={regrading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50"
        >
          {regrading ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            <RotateCcw size={15} />
          )}
          {regrading
            ? "Đang chấm lại..."
            : `Chấm lại câu trả lời mới (còn ${creditsLeft} credit)`}
        </button>
      </div>
    </div>
  );
}
