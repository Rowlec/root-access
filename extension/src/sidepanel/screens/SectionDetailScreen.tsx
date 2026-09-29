import React, { useEffect, useState } from "react";
import { ArrowLeft, Check, Copy, ExternalLink, HelpCircle, Loader2, Send, Sparkles } from "lucide-react";
import { api } from "../../lib/api";
import {
  checkIsGenerating,
  insertPromptToTab,
  readLastAnswerFromTab,
} from "../../lib/messages";
import { track } from "../../lib/tracking";
import { GradeResult, Pack, Project, Section } from "../../lib/types";
import {
  ManualFallbackAnswerInput,
  ManualFallbackPrompt,
} from "../components/ManualFallback";

export function SectionDetailScreen({
  section,
  project,
  pack,
  siteId,
  creditsLeft,
  onBack,
  onGradeComplete,
  onOutOfCredits,
}: {
  section: Section;
  project: Project;
  pack: Pack;
  siteId: string;
  creditsLeft: number;
  onBack: () => void;
  onGradeComplete: (result: GradeResult) => void;
  onOutOfCredits: () => void;
}) {
  const [promptText, setPromptText] = useState("");
  const [insertionId, setInsertionId] = useState<string | null>(null);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [inserting, setInserting] = useState(false);
  const [insertSuccess, setInsertSuccess] = useState(false);
  const [insertError, setInsertError] = useState(false);

  const [grading, setGrading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [copied, setCopied] = useState(false);

  // 1. Fetch generated prompt from backend API
  useEffect(() => {
    let isMounted = true;
    async function loadPrompt() {
      setLoadingPrompt(true);
      try {
        const res = await api.buildPrompt(project.id, section.id, siteId);
        if (isMounted) {
          setPromptText(res.prompt_text);
          setInsertionId(res.insertion_id);
        }
      } catch (err) {
        console.error("Failed to build prompt:", err);
      } finally {
        if (isMounted) setLoadingPrompt(false);
      }
    }
    loadPrompt();
    return () => {
      isMounted = false;
    };
  }, [project.id, section.id, siteId]);

  // 2. Poll isGenerating every 1s when in view (Mục 5.5)
  useEffect(() => {
    const interval = setInterval(async () => {
      const generating = await checkIsGenerating();
      setIsGenerating(generating);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleInsertPrompt = async () => {
    if (!promptText) return;
    setInserting(true);
    setInsertError(false);

    try {
      const res = await insertPromptToTab(promptText, false);
      if (res.ok) {
        setInsertSuccess(true);
        track("prompt_inserted", { site: siteId, section_id: section.id, kind: "initial" });
        setTimeout(() => setInsertSuccess(false), 2500);
      } else {
        setInsertError(true);
        track("manual_fallback_used", { site: siteId, action: "insert_prompt" });
      }
    } catch {
      setInsertError(true);
      track("manual_fallback_used", { site: siteId, action: "insert_prompt" });
    } finally {
      setInserting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGrade = async (customAnswerText?: string) => {
    if (creditsLeft <= 0) {
      onOutOfCredits();
      return;
    }

    setGrading(true);

    let answerText = customAnswerText;
    if (!answerText) {
      try {
        const answerRes = await readLastAnswerFromTab();
        if (answerRes.ok && answerRes.text) {
          answerText = answerRes.text;
        } else {
          // Fallback to manual paste answer
          setShowManualPaste(true);
          setGrading(false);
          track("manual_fallback_used", { site: siteId, action: "read_answer" });
          return;
        }
      } catch {
        setShowManualPaste(true);
        setGrading(false);
        track("manual_fallback_used", { site: siteId, action: "read_answer" });
        return;
      }
    }

    try {
      const gradeResult = await api.gradeAnswer({
        project_id: project.id,
        section_id: section.id,
        output_text: answerText,
        insertion_id: insertionId,
        site: siteId,
      });

      track("grade_completed", {
        section_id: section.id,
        n_warnings: gradeResult.warnings?.length ?? 0,
      });

      onGradeComplete(gradeResult);
    } catch (err: any) {
      if (err.code === "NO_CREDIT") {
        onOutOfCredits();
      } else if (err.result && err.result.status === "rejected") {
        alert(`Bị từ chối: ${err.message}`);
        track("grade_rejected", { reason: err.code });
      } else {
        alert(err.message || "Chấm bài thất bại, vui lòng thử lại.");
      }
    } finally {
      setGrading(false);
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
          <ArrowLeft size={16} /> Quay lại
        </button>
        <span className="text-[11px] text-blue-400 font-medium">
          {pack.checkpoint}
        </span>
      </div>

      {/* Section Requirement */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 space-y-1">
        <h3 className="text-xs font-bold text-white">{section.title}</h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          {section.requirement}
        </p>
      </div>

      {/* Prompt Editor & Inserter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">
            Prompt được dựng tự động:
          </label>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
          >
            {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
            {copied ? "Đã chép" : "Sao chép"}
          </button>
        </div>

        {loadingPrompt ? (
          <div className="flex h-36 items-center justify-center rounded-xl border border-white/10 bg-black/40">
            <Loader2 className="animate-spin text-blue-400 size-5" />
          </div>
        ) : (
          <textarea
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={7}
            className="w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-slate-200 focus:border-blue-500 focus:outline-none"
          />
        )}

        {/* Insert Prompt Button */}
        <button
          onClick={handleInsertPrompt}
          disabled={inserting || loadingPrompt || !promptText}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50"
        >
          {inserting ? (
            <Loader2 className="animate-spin size-4" />
          ) : insertSuccess ? (
            <Check size={15} className="text-green-300" />
          ) : (
            <Sparkles size={15} />
          )}
          {insertSuccess ? "Đã điền vào ô chat! Bạn hãy tự bấm gửi." : "Chèn vào ô chat"}
        </button>

        {insertError && <ManualFallbackPrompt promptText={promptText} />}
      </div>

      {/* Manual Answer Fallback if reading failed */}
      {showManualPaste && (
        <ManualFallbackAnswerInput
          onSubmitAnswer={(text) => handleGrade(text)}
          loading={grading}
        />
      )}

      {/* Grade Button Section */}
      <div className="mt-auto pt-2 space-y-2">
        {isGenerating && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-2 text-center text-[11px] text-amber-300 flex items-center justify-center gap-1.5">
            <Loader2 size={12} className="animate-spin" />
            AI đang trả lời... Nút chấm tạm khóa.
          </div>
        )}

        <button
          onClick={() => handleGrade()}
          disabled={grading || isGenerating || loadingPrompt}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
        >
          {grading ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            <Send size={15} />
          )}
          {grading
            ? "Đang chấm bài..."
            : `Chấm câu trả lời này (còn ${creditsLeft} credit)`}
        </button>

        <p className="text-center text-[10px] text-slate-500">
          Chỉ tốn 1 credit khi chấm bài thành công. Chèn prompt hoàn toàn miễn phí.
        </p>
      </div>
    </div>
  );
}
