import React from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  Info,
  Minus,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { GradeResult, Section } from "../../lib/types";

export function CompareModal({
  newResult,
  section,
  onContinue,
}: {
  newResult: GradeResult;
  section: Section;
  onContinue: () => void;
}) {
  const comp = newResult.compare_with_parent;

  const improvedCount = comp?.improved?.length ?? 0;
  const worseCount = comp?.worse?.length ?? 0;
  const sameCount = comp?.same?.length ?? 0;

  const summaryReason =
    comp?.summary_reason ||
    (improvedCount > 0
      ? `Bạn đã nâng cấp thành công ${improvedCount} tiêu chí nhờ bổ sung dữ liệu bám sát rubric!`
      : "Điểm số giữ nguyên. Có thể bạn đã sửa đúng chỗ nhưng chưa đủ dẫn chứng thực tế, hoặc sửa chưa trúng điểm yếu rubric chỉ ra.");

  const getLevelLabel = (level?: string) => {
    switch (level) {
      case "TOT":
        return "Tốt";
      case "DAT":
        return "Đạt";
      default:
        return "Chưa đạt";
    }
  };

  const getStatusBadge = (status: "improved" | "worse" | "same") => {
    switch (status) {
      case "improved":
        return (
          <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
            <ArrowUp size={13} /> Tiến bộ
          </span>
        );
      case "worse":
        return (
          <span className="flex items-center gap-1 text-rose-400 font-bold text-xs bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
            <ArrowDown size={13} /> Giảm
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-slate-400 font-medium text-xs bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
            <Minus size={13} /> Giữ nguyên
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-y-auto p-4 space-y-4 bg-[#090d16] text-slate-100">
      {/* Header */}
      <div className="border-b border-white/10 pb-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-400" />
            Bạn đã sửa gì sau khi chấm lại
          </h2>
          <span className="text-[11px] text-blue-400 font-medium">{section.title}</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Đối chiếu trực tiếp bản trước và bản sau theo từng tiêu chí Rubric.
        </p>
      </div>

      {/* Summary Explanation Banner */}
      <div
        className={`rounded-xl border p-3.5 space-y-1 ${
          improvedCount > 0 && worseCount === 0
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
            : worseCount > 0
            ? "border-rose-500/40 bg-rose-500/10 text-rose-200"
            : "border-amber-500/40 bg-amber-500/10 text-amber-200"
        }`}
      >
        <div className="flex items-start gap-2">
          <Info size={16} className="shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-xs">
            <p className="font-bold">
              {improvedCount > 0
                ? "Ghi nhận tiến bộ sau lần sửa!"
                : "Phân tích vì sao điểm chưa thay đổi:"}
            </p>
            <p className="leading-relaxed opacity-95">{summaryReason}</p>
          </div>
        </div>
      </div>

      {/* Delta Counts */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-center">
          <span className="text-lg font-bold text-emerald-400">+{improvedCount}</span>
          <p className="text-[10px] text-emerald-200 mt-0.5">Tiêu chí lên mức</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 text-center">
          <span className="text-lg font-bold text-slate-300">{sameCount}</span>
          <p className="text-[10px] text-slate-400 mt-0.5">Giữ nguyên</p>
        </div>
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-2.5 text-center">
          <span className="text-lg font-bold text-rose-400">-{worseCount}</span>
          <p className="text-[10px] text-rose-200 mt-0.5">Bị giảm</p>
        </div>
      </div>

      {/* Detailed Breakdown with specific reasons */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Chi tiết từng tiêu chí (Đã sửa gì & vì sao điểm đổi):
        </h4>

        <div className="space-y-2.5">
          {comp?.details && comp.details.length > 0 ? (
            comp.details.map((detail) => (
              <div
                key={detail.criterion_id}
                className={`rounded-xl border p-3 space-y-2 transition-all ${
                  detail.status === "improved"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : detail.status === "worse"
                    ? "border-rose-500/30 bg-rose-500/5"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">
                    {detail.criterion_name || detail.criterion_id}
                  </span>
                  {getStatusBadge(detail.status)}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Trước: <strong className="text-slate-300">{getLevelLabel(detail.previous_level)}</strong></span>
                  <ArrowRight size={12} className="text-slate-500" />
                  <span>Sau: <strong className="text-white">{getLevelLabel(detail.current_level)}</strong></span>
                </div>

                <p className="text-xs leading-relaxed text-slate-200 bg-black/30 p-2 rounded-lg border border-white/5">
                  {detail.reason}
                </p>
              </div>
            ))
          ) : (
            // Fallback to basic criteria list if details not present
            newResult.criteria.map((c) => {
              const isImp = comp?.improved.includes(c.id);
              const isWor = comp?.worse.includes(c.id);
              const status = isImp ? "improved" : isWor ? "worse" : "same";

              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200">{c.name}</span>
                    {getStatusBadge(status)}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Mức hiện tại: <strong className="text-white">{getLevelLabel(c.level)}</strong>.{" "}
                    {isImp
                      ? "Tiêu chí đã được cải thiện so với lần chấm trước."
                      : isWor
                      ? "Tiêu chí bị giảm mức."
                      : "Mức điểm được giữ nguyên."}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Button to continue */}
      <div className="mt-auto pt-3 border-t border-white/10">
        <button
          onClick={onContinue}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500"
        >
          <CheckCircle2 size={15} /> Xem toàn bộ kết quả chấm mới
        </button>
      </div>
    </div>
  );
}
