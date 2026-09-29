import React from "react";
import { ArrowDown, ArrowRight, ArrowUp, CheckCircle2, Minus, Sparkles } from "lucide-react";
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

  const getLevelLabel = (level: string) => {
    switch (level) {
      case "TOT":
        return "Tốt";
      case "DAT":
        return "Đạt";
      default:
        return "Chưa đạt";
    }
  };

  const getStatusIcon = (criterionId: string) => {
    if (comp?.improved.includes(criterionId)) {
      return (
        <span className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
          <ArrowUp size={14} /> Tiến bộ
        </span>
      );
    }
    if (comp?.worse.includes(criterionId)) {
      return (
        <span className="flex items-center gap-1 text-red-400 font-bold text-xs">
          <ArrowDown size={14} /> Giảm
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-slate-400 text-xs">
        <Minus size={14} /> Giữ nguyên
      </span>
    );
  };

  return (
    <div className="flex h-screen flex-col overflow-y-auto p-4 space-y-4">
      <div className="border-b border-white/10 pb-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles size={18} className="text-emerald-400" />
          Tiến bộ sau khi chấm lại
        </h2>
        <p className="text-[11px] text-slate-400">
          So sánh kết quả giữa lần chấm trước và lần chấm này.
        </p>
      </div>

      {/* Summary Delta Card */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
          <span className="text-lg font-bold text-emerald-400">+{improvedCount}</span>
          <p className="text-[10px] text-emerald-200 mt-0.5">Tiêu chí lên mức</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-center">
          <span className="text-lg font-bold text-slate-300">{sameCount}</span>
          <p className="text-[10px] text-slate-400 mt-0.5">Giữ nguyên</p>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center">
          <span className="text-lg font-bold text-red-400">-{worseCount}</span>
          <p className="text-[10px] text-red-200 mt-0.5">Bị giảm</p>
        </div>
      </div>

      {/* Criteria Changes */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Chi tiết từng tiêu chí
        </h4>

        <div className="space-y-2">
          {newResult.criteria.map((c) => {
            return (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    {c.name}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Mức hiện tại: <strong className="text-white">{getLevelLabel(c.level)}</strong>
                  </span>
                </div>
                <div>{getStatusIcon(c.id)}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto pt-3">
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
