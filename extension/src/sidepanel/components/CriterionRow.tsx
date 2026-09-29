import React, { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Sparkles } from "lucide-react";
import { GradedCriterion } from "../../lib/types";

export function CriterionRow({ criterion }: { criterion: GradedCriterion }) {
  const [expanded, setExpanded] = useState(false);

  const getBadge = () => {
    switch (criterion.level) {
      case "TOT":
        return (
          <span className="badge-tot inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            <Sparkles size={12} /> Tốt
          </span>
        );
      case "DAT":
        return (
          <span className="badge-dat inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            <CheckCircle2 size={12} /> Đạt
          </span>
        );
      default:
        return (
          <span className="badge-chua-dat inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
            <AlertCircle size={12} /> Chưa đạt
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-white/20">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="font-medium text-slate-200">{criterion.name}</span>
        <div className="flex items-center gap-2">
          {getBadge()}
          {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      <div className="mt-2 text-xs text-slate-300">
        <p className="leading-relaxed">{criterion.reason}</p>
        {criterion.evidence_quote && (
          <div className="mt-2 rounded-lg bg-black/40 p-2 text-slate-400 border-l-2 border-primary italic">
            &ldquo;{criterion.evidence_quote}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
