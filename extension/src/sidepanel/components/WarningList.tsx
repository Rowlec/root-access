import React from "react";
import { AlertTriangle, Info, HelpCircle } from "lucide-react";
import { WarningItem } from "../../lib/types";

export function WarningList({ warnings }: { warnings: WarningItem[] }) {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Cảnh báo dữ liệu & Số liệu
      </h4>
      <div className="space-y-1.5">
        {warnings.map((w, idx) => {
          const isCaution =
            w.type === "POSSIBLY_INVENTED_NUMBER" || w.type === "UNSOURCED_NUMBER";

          return (
            <div
              key={idx}
              className={`flex items-start gap-2.5 rounded-lg p-2.5 text-xs ${
                isCaution
                  ? "bg-amber-500/10 border border-amber-500/30 text-amber-200"
                  : "bg-blue-500/10 border border-blue-500/30 text-blue-200"
              }`}
            >
              {isCaution ? (
                <AlertTriangle size={15} className="shrink-0 text-amber-400 mt-0.5" />
              ) : (
                <Info size={15} className="shrink-0 text-blue-400 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="font-medium leading-tight">{w.message}</p>
                {w.quote && (
                  <p className="text-[11px] text-slate-400 italic">
                    Trích đoạn: &ldquo;{w.quote}&rdquo;
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
