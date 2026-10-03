import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  Lock,
  Send,
  Sparkles,
} from "lucide-react";
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
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  // Intake state (Spec Mục 4)
  const [intakeQuestions, setIntakeQuestions] = useState<any[]>(section.intake || []);
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, any>>({});
  const [loadingIntake, setLoadingIntake] = useState(true);

  // Insertion state
  const [inserting, setInserting] = useState(false);
  const [insertSuccess, setInsertSuccess] = useState(false);
  const [insertError, setInsertError] = useState(false);
  const [hasInsertedPrompt, setHasInsertedPrompt] = useState(false);

  // Generating & stop button tracking (Spec Mục 5)
  const [isGenerating, setIsGenerating] = useState(false);
  const [answerFinished, setAnswerFinished] = useState(false);
  const wasGeneratingRef = useRef(false);

  // Grading state
  const [grading, setGrading] = useState(false);
  const [showManualPaste, setShowManualPaste] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check if project is incomplete (B1: Lock button)
  const isProjectIncomplete =
    !project.name ||
    !(project.oneLiner || project.startupIdea) ||
    !(project.niche || project.targetCustomer);

  // 1. Load intake answers and build prompt
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoadingIntake(true);
        // Load answered intake
        const intakeRes = await api.getIntake(project.id, section.id).catch(() => null);
        if (intakeRes?.answers && isMounted) {
          setIntakeAnswers(intakeRes.answers);
        }

        // Build prompt v2
        setLoadingPrompt(true);
        const res = await api.buildPrompt(project.id, section.id, siteId);
        if (isMounted) {
          setPromptText(res.prompt_text);
          setInsertionId(res.insertion_id);
        }
      } catch (err) {
        console.error("Failed to load prompt/intake:", err);
      } finally {
        if (isMounted) {
          setLoadingIntake(false);
          setLoadingPrompt(false);
        }
      }
    }

    if (!isProjectIncomplete) {
      loadData();
    }
    return () => {
      isMounted = false;
    };
  }, [project.id, section.id, siteId, isProjectIncomplete]);

  // 2. Track stop button & generating status
  useEffect(() => {
    const interval = setInterval(async () => {
      const generating = await checkIsGenerating();
      setIsGenerating(generating);

      if (wasGeneratingRef.current && !generating && hasInsertedPrompt) {
        // AI finished generating!
        setAnswerFinished(true);
      }
      wasGeneratingRef.current = generating;
    }, 800);

    return () => clearInterval(interval);
  }, [hasInsertedPrompt]);

  // Handle answering intake
  const handleIntakeChange = async (qId: string, value: any) => {
    const updated = { ...intakeAnswers, [qId]: value };
    setIntakeAnswers(updated);

    try {
      await api.saveIntake(project.id, section.id, updated);
      // Rebuild prompt with new intake
      const res = await api.buildPrompt(project.id, section.id, siteId);
      setPromptText(res.prompt_text);
      setInsertionId(res.insertion_id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleInsertPrompt = async () => {
    if (!promptText || isProjectIncomplete) return;
    setInserting(true);
    setInsertError(false);

    try {
      const res = await insertPromptToTab(promptText, false);
      if (res.ok) {
        setInsertSuccess(true);
        setHasInsertedPrompt(true);
        setAnswerFinished(false);
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

      // Highlight quotes on the page via content script message
      if (chrome?.tabs?.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]?.id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              type: "HIGHLIGHT_QUOTES",
              items: gradeResult.criteria,
            });
          }
        });
      }

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
      <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)]"
        >
          <ArrowLeft size={16} /> Quay lại
        </button>
        <span className="text-[11px] text-[var(--accent)] font-medium">
          {pack.checkpoint}
        </span>
      </div>

      {/* Project info header */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs space-y-1">
        <span className="text-[2xs] font-bold text-[var(--muted)] uppercase">Dự án đang chọn:</span>
        <h3 className="font-bold text-[var(--ink)] truncate">{project.name}</h3>
        {project.niche && (
          <span className="inline-block text-[2xs] px-2 py-0.5 rounded bg-[var(--mark)] text-[var(--ink)] font-semibold border border-amber-300">
            Ngách: {project.niche}
          </span>
        )}
      </div>

      {/* Check Incomplete Project Lock (B1) */}
      {isProjectIncomplete ? (
        <div className="rounded-xl border border-red-300 bg-[var(--bad-bg)] p-4 text-xs text-[var(--bad)] space-y-3">
          <div className="flex items-start gap-2">
            <Lock className="size-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Thẻ dự án chưa đầy đủ</strong>
              Dự án thiếu ý tưởng hoặc ngách khách hàng. Cần hoàn thành thông tin trước khi chèn prompt.
            </div>
          </div>
          <a
            href="https://root-access.site/app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--ink)] text-white text-xs font-semibold hover:opacity-90"
          >
            Tạo dự án trên web <ExternalLink className="size-3" />
          </a>
        </div>
      ) : null}

      {/* Section Requirement */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 space-y-1">
        <h3 className="text-xs font-bold text-[var(--ink)]">{section.title}</h3>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          {section.requirement}
        </p>
      </div>

      {/* Step 1: Hỏi nhanh 2-4 câu (Spec Mục 4) */}
      {intakeQuestions.length > 0 && !isProjectIncomplete && (
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--accent)] flex items-center gap-1">
              Hỏi nhanh: {intakeQuestions.length} câu
            </span>
            <span className="text-[2xs] text-[var(--muted)]">Dữ liệu thật của nhóm</span>
          </div>

          <div className="space-y-3">
            {intakeQuestions.map((q, idx) => {
              const currentVal = intakeAnswers[q.id];
              const isUnknown =
                currentVal === "Chưa hỏi ai" ||
                currentVal === "Chưa biết" ||
                currentVal === "Chưa có";

              return (
                <div
                  key={q.id}
                  className="rounded-lg border border-[var(--line-2)] bg-[var(--surface-2)] p-2.5 space-y-2 text-xs"
                >
                  <label className="font-semibold text-[var(--ink)] block leading-snug">
                    {idx + 1}. {q.question}
                  </label>

                  {q.options && q.options.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      {q.options.map((opt: string) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleIntakeChange(q.id, opt)}
                          className={`px-2 py-0.5 rounded-full text-[11px] border transition-colors ${
                            currentVal === opt
                              ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                              : "bg-[var(--surface)] text-[var(--ink-2)] border-[var(--line)]"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={isUnknown ? "" : currentVal || ""}
                      placeholder="Nhập thông tin thật..."
                      disabled={isUnknown}
                      onChange={(e) => handleIntakeChange(q.id, e.target.value)}
                      className="flex-1 rounded-md border border-[var(--line)] bg-[var(--surface)] p-1.5 text-xs text-[var(--ink)]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleIntakeChange(q.id, isUnknown ? "" : q.unknown_label || "Chưa biết")
                      }
                      className={`px-2 py-1 rounded-md border text-[11px] ${
                        isUnknown
                          ? "bg-[var(--mid-bg)] text-[var(--mid)] border-amber-300 font-bold"
                          : "bg-[var(--surface)] text-[var(--muted)] border-[var(--line)]"
                      }`}
                    >
                      {q.unknown_label || "Chưa biết"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Prompt v2 & Insert (Spec B7: Preview hidden by default) */}
      {!isProjectIncomplete && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="text-xs text-[var(--muted)] hover:text-[var(--ink)] font-semibold inline-flex items-center gap-1"
            >
              {showPromptPreview ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              Xem prompt sẽ chèn
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline font-medium"
            >
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
              {copied ? "Đã chép" : "Sao chép"}
            </button>
          </div>

          {showPromptPreview && (
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-2.5 font-mono text-[11px] leading-relaxed text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
            />
          )}

          {/* Insert Prompt Button */}
          <button
            onClick={handleInsertPrompt}
            disabled={inserting || loadingPrompt || !promptText || isProjectIncomplete}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all shadow-sm ${
              insertSuccess
                ? "bg-[var(--ok-bg)] text-[var(--ok)] border border-green-300"
                : "bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50"
            }`}
          >
            {inserting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Đang chèn vào ô chat...
              </>
            ) : insertSuccess ? (
              <>
                <CheckCircle2 size={14} />
                Đã chèn prompt! Hãy bấm Gửi trên ChatGPT
              </>
            ) : (
              <>
                <Send size={14} />
                Chèn prompt vào ô chat
              </>
            )}
          </button>
        </div>
      )}

      {insertError && <ManualFallbackPrompt promptText={promptText} />}

      {/* Step 3: Nút Chấm "sáng lên" khi AI trả lời xong (Spec Mục 5) */}
      {!isProjectIncomplete && (
        <div className="space-y-2 pt-2 border-t border-[var(--line-2)]">
          <button
            onClick={() => handleGrade()}
            disabled={grading || isGenerating}
            className={`w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all shadow-sm ${
              isGenerating
                ? "bg-[var(--sunken)] text-[var(--muted)] cursor-not-allowed border border-[var(--line)]"
                : answerFinished
                ? "bg-[var(--ink)] text-white animate-pulse"
                : "bg-[var(--ink)] text-white hover:bg-black"
            }`}
          >
            {grading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Đang chấm bài...
              </>
            ) : isGenerating ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                AI đang trả lời, vui lòng chờ...
              </>
            ) : answerFinished ? (
              <>
                <CheckCircle2 size={15} className="text-emerald-400" />
                Câu trả lời đã xong · Bấm để chấm
              </>
            ) : (
              <>
                <CheckCircle2 size={15} className="text-emerald-400" />
                Chấm câu trả lời này (1 credit)
              </>
            )}
          </button>

          {showManualPaste && (
            <ManualFallbackAnswerInput
              loading={grading}
              onSubmitAnswer={(text) => handleGrade(text)}
            />
          )}
        </div>
      )}
    </div>
  );
}
