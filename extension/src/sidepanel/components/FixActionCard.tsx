import React from "react";
import { ArrowRight, Database, CheckSquare, ShieldAlert, Edit3, HelpCircle } from "lucide-react";
import { FixAction } from "../../lib/types";

export function FixActionCard({
  action,
  onSelect,
}: {
  action: FixAction;
  onSelect: (action: FixAction) => void;
}) {
  const getIcon = () => {
    switch (action.type) {
      case "NEED_DATA":
        return <Database size={15} className="text-blue-400" />;
      case "TASK":
        return <CheckSquare size={15} className="text-green-400" />;
      case "MARK_ASSUMPTIONS":
        return <ShieldAlert size={15} className="text-amber-400" />;
      case "FOCUS_REWRITE":
        return <Edit3 size={15} className="text-purple-400" />;
      default:
        return <Edit3 size={15} className="text-blue-400" />;
    }
  };

  return (
    <div
      onClick={() => onSelect(action)}
      className="group flex cursor-pointer flex-col gap-2 rounded-xl border border-white/10 bg-white/5 p-3.5 transition hover:border-blue-500/50 hover:bg-blue-500/10 shadow-xs"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 rounded-lg bg-white/5 p-1.5 shrink-0">{getIcon()}</div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
              {action.label}
            </p>
            <p className="text-[11px] leading-relaxed text-slate-300">
              <span className="font-semibold text-slate-400">Thiếu gì: </span>
              {action.explanation}
            </p>
          </div>
        </div>
        <ArrowRight
          size={15}
          className="mt-1 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-blue-400"
        />
      </div>

      {action.why_important && (
        <p className="text-[10px] text-amber-300/80 bg-amber-500/10 rounded-lg p-2 border border-amber-500/20 leading-relaxed">
          <span className="font-bold">⚠️ Vì sao quan trọng: </span>
          {action.why_important}
        </p>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-white/5 text-[10px] text-blue-400 font-semibold">
        <span className="flex items-center gap-1">
          <HelpCircle size={11} /> Có câu hỏi gợi mở cho sinh viên
        </span>
        <span className="group-hover:underline">Tự trả lời để sửa ➔</span>
      </div>
    </div>
  );
}
