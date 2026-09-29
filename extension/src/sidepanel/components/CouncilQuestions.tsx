import React from "react";
import { MessageSquareQuote } from "lucide-react";

export function CouncilQuestions({ questions }: { questions: string[] }) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Câu hỏi hội đồng có thể chất vấn
      </h4>
      <div className="space-y-2">
        {questions.map((q, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-xs text-purple-200"
          >
            <MessageSquareQuote size={15} className="shrink-0 text-purple-400 mt-0.5" />
            <p className="leading-relaxed font-medium">{q}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
