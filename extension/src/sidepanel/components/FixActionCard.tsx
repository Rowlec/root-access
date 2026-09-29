import React from "react";
import { ArrowRight, Database, CheckSquare, ShieldAlert, Edit3 } from "lucide-react";
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
    }
  };

  return (
    <div
      onClick={() => onSelect(action)}
      className="group flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5 transition hover:border-blue-500/50 hover:bg-blue-500/10"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-lg bg-white/5 p-1.5">{getIcon()}</div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-slate-100 group-hover:text-blue-400">
            {action.label}
          </p>
          <p className="text-[11px] leading-relaxed text-slate-400">
            {action.explanation}
          </p>
        </div>
      </div>
      <ArrowRight
        size={15}
        className="mt-1 shrink-0 text-slate-500 transition-transform group-hover:translate-x-1 group-hover:text-blue-400"
      />
    </div>
  );
}
