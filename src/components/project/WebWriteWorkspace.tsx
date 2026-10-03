"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  HelpCircle,
  Info,
  Loader2,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Wand2,
} from "lucide-react";

interface IntakeQuestion {
  id: string;
  question: string;
  type: "number" | "text" | "quote" | "single" | "multi";
  options?: string[];
  unknown_label?: string;
  if_unknown_task?: string;
  prompt_label?: string;
}

interface CriterionResult {
  id: string;
  name?: string;
  level: "CHUA_DAT" | "DAT" | "TOT";
  reason: string;
  evidence_quote: string;
}

interface GradeResponse {
  overall_status: "passed" | "needs_work";
  summary: string;
  criteria: CriterionResult[];
  unverified_numbers?: string[];
  fix_actions?: Array<{
    type: string;
    label: string;
    description: string;
  }>;
  grade_id?: string;
}

interface WebWriteWorkspaceProps {
  projectId: string;
  sectionId: string;
  projectName: string;
  oneLiner: string;
  niche: string;
  packId: string;
  sections: Array<{
    id: string;
    title: string;
    order: number;
    status?: string;
  }>;
  initialIntakeQuestions?: IntakeQuestion[];
  initialIntakeAnswers?: Record<string, any>;
  initialSavedText?: string;
  initialGradeResult?: any;
}

export function WebWriteWorkspace({
  projectId,
  sectionId,
  projectName,
  oneLiner,
  niche,
  packId,
  sections,
  initialIntakeQuestions = [],
  initialIntakeAnswers = {},
  initialSavedText = "",
  initialGradeResult = null,
}: WebWriteWorkspaceProps) {
  const currentSection = sections.find((s) => s.id === sectionId) || sections[0];

  // Intake State
  const [intakeQuestions, setIntakeQuestions] = useState<IntakeQuestion[]>(initialIntakeQuestions);
  const [intakeAnswers, setIntakeAnswers] = useState<Record<string, any>>(initialIntakeAnswers);
  const [loadingIntake, setLoadingIntake] = useState(
    !(initialIntakeQuestions && initialIntakeQuestions.length > 0)
  );

  // Prompt State
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  // Answer & Grade State
  const [answerText, setAnswerText] = useState(initialSavedText);
  const [isGrading, setIsGrading] = useState(false);
  const [gradeResult, setGradeResult] = useState<GradeResponse | null>(initialGradeResult);
  const [gradeError, setGradeError] = useState<string | null>(null);

  // Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fix Prompt State
  const [fixPromptText, setFixPromptText] = useState<string | null>(null);
  const [fixPromptCopied, setFixPromptCopied] = useState(false);

  // Load section intake questions and saved answers
  useEffect(() => {
    // If SSR already supplied intake questions, initialize them and bypass client fetch waterfall
    if (initialIntakeQuestions && initialIntakeQuestions.length > 0) {
      setIntakeQuestions(initialIntakeQuestions);
      setIntakeAnswers(initialIntakeAnswers || {});
      if (initialSavedText !== undefined && initialSavedText !== "") {
        setAnswerText(initialSavedText);
      }
      if (initialGradeResult) {
        setGradeResult(initialGradeResult);
      }
      setLoadingIntake(false);
      return;
    }

    let isMounted = true;
    async function loadData() {
      try {
        setLoadingIntake(true);
        // Parallel requests instead of sequential waterfall
        const [packRes, intakeRes, overviewRes] = await Promise.allSettled([
          fetch(`/api/packs/${packId}`),
          fetch(`/api/projects/${projectId}/sections/${sectionId}/intake`),
          fetch(`/api/projects/${projectId}/overview`),
        ]);

        if (!isMounted) return;

        if (packRes.status === "fulfilled" && packRes.value.ok) {
          const packData = await packRes.value.json();
          const sec = packData.sections?.find((s: any) => s.id === sectionId);
          if (sec?.intake && isMounted) {
            setIntakeQuestions(sec.intake);
          }
        }

        if (intakeRes.status === "fulfilled" && intakeRes.value.ok) {
          const resJson = await intakeRes.value.json();
          if (resJson.answers && isMounted) {
            setIntakeAnswers(resJson.answers);
          }
        }

        if (overviewRes.status === "fulfilled" && overviewRes.value.ok) {
          const overview = await overviewRes.value.json();
          const secOverview = overview.sections?.find((s: any) => s.id === sectionId);
          if (secOverview?.saved_text && isMounted) {
            setAnswerText(secOverview.saved_text);
            if (secOverview.latest_grade) {
              setGradeResult(secOverview.latest_grade);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) setLoadingIntake(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [projectId, sectionId, packId, initialIntakeQuestions, initialIntakeAnswers, initialSavedText, initialGradeResult]);

  // Handle answering an intake question
  const handleAnswerChange = async (qId: string, value: any) => {
    const updated = { ...intakeAnswers, [qId]: value };
    setIntakeAnswers(updated);

    // Save to server
    try {
      await fetch(`/api/projects/${projectId}/sections/${sectionId}/intake`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: updated }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Build the Prompt v2
  const handleBuildPrompt = async () => {
    setGeneratingPrompt(true);
    try {
      const res = await fetch("/api/prompts/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          sectionId,
          packId,
        }),
      });
      if (res.ok) {
        const body = await res.json();
        setGeneratedPrompt(body.prompt);
        setShowPromptPreview(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingPrompt(false);
    }
  };

  // Copy Prompt & Open ChatGPT
  const handleCopyAndOpenChatGPT = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setPromptCopied(true);
    window.open("https://chatgpt.com", "_blank");
    setTimeout(() => setPromptCopied(false), 3000);
  };

  // Grade the answer
  const handleGrade = async () => {
    if (!answerText.trim()) return;
    setIsGrading(true);
    setGradeError(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          sectionId,
          packId,
          answerText: answerText.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGradeError(data.message || data.error || "Không thể chấm câu trả lời.");
      } else {
        setGradeResult(data);
      }
    } catch (err: any) {
      setGradeError(err.message || "Lỗi kết nối khi chấm.");
    } finally {
      setIsGrading(false);
    }
  };

  // Save current version
  const handleSaveSection = async () => {
    if (!answerText.trim()) return;
    setIsSaving(true);
    try {
      const hasUnpassed = gradeResult?.criteria.some((c) => c.level === "CHUA_DAT");
      const status = hasUnpassed ? "drafting" : "passed";

      const res = await fetch(`/api/projects/${projectId}/sections/${sectionId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          savedText: answerText.trim(),
          gradeId: gradeResult?.grade_id,
          status,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate fix prompt
  const handleRequestFix = async (fixType: string, evidenceQuote?: string) => {
    try {
      const res = await fetch("/api/fix-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          sectionId,
          fixType,
          evidenceQuote,
        }),
      });
      if (res.ok) {
        const body = await res.json();
        setFixPromptText(body.fix_prompt);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Render highlighted text with <mark> tags matching Figure 5
  const renderHighlightedText = () => {
    if (!gradeResult || !gradeResult.criteria) {
      return (
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          rows={12}
          placeholder="Dán câu trả lời bạn nhận được từ ChatGPT vào đây để chấm..."
          className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-xs font-mono text-[var(--ink)] leading-relaxed focus:outline-none focus:border-[var(--accent)]"
        />
      );
    }

    // Build highlighted segments
    let content = answerText;
    const quotesToHighlight: Array<{ quote: string; level: string; reason: string }> = [];

    gradeResult.criteria.forEach((c) => {
      if (c.evidence_quote && c.evidence_quote.trim().length > 5) {
        quotesToHighlight.push({
          quote: c.evidence_quote.trim(),
          level: c.level,
          reason: c.reason,
        });
      }
    });

    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-xs font-mono text-[var(--ink)] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
          {quotesToHighlight.length === 0 ? (
            answerText
          ) : (
            // Simple visual indicator of highlights
            <div>
              <p className="text-[2xs] text-[var(--muted)] mb-2 uppercase font-sans font-bold">
                Văn bản đã phân tích và đối chiếu rubric:
              </p>
              {answerText}
            </div>
          )}
        </div>

        <button
          onClick={() => {
            // Allow editing again
            setGradeResult(null);
          }}
          className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1"
        >
          <RefreshCw className="size-3" /> Chỉnh sửa hoặc dán câu trả lời mới
        </button>
      </div>
    );
  };

  const allPassed =
    gradeResult?.criteria &&
    gradeResult.criteria.length > 0 &&
    !gradeResult.criteria.some((c) => c.level === "CHUA_DAT");

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--line-2)] pb-4">
        <Link
          href={`/app/projects/${projectId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Về sổ dự án ({projectName})
        </Link>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {sections.map((sec) => (
            <Link
              key={sec.id}
              href={`/app/projects/${projectId}/write/${sec.id}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                sec.id === sectionId
                  ? "bg-[var(--ink)] text-white"
                  : "bg-[var(--sunken)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              {sec.title}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Column: Intake & Prompt */}
        <div className="space-y-6">
          {/* Section 1: Hỏi nhanh trước khi viết (Spec Mục 4) */}
          <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[2xs] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Bước 1 · Hỏi nhanh 2–4 câu
                </span>
                <h2 className="text-lg font-serif font-bold text-[var(--ink)] mt-0.5">
                  Lấy dữ liệu thực tế cho phần {currentSection.title}
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                  Để prompt có dữ liệu thật của nhóm, chống AI tự bịa số liệu. Câu nào chưa làm có thể bấm "Chưa biết" hoặc "Chưa hỏi ai".
                </p>
              </div>
            </div>

            {loadingIntake ? (
              <div className="py-8 text-center text-xs text-[var(--muted)] flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin text-[var(--accent)]" /> Đang tải câu hỏi...
              </div>
            ) : intakeQuestions.length === 0 ? (
              <p className="text-xs text-[var(--muted)] italic">
                Phần này không yêu cầu câu hỏi phụ. Bạn có thể tạo prompt ngay.
              </p>
            ) : (
              <div className="space-y-4 pt-2">
                {intakeQuestions.map((q, qIndex) => {
                  const currentVal = intakeAnswers[q.id];
                  const isUnknown =
                    currentVal === "Chưa hỏi ai" ||
                    currentVal === "Chưa biết" ||
                    currentVal === "Chưa có";

                  return (
                    <div
                      key={q.id}
                      className="rounded-lg border border-[var(--line-2)] bg-[var(--surface-2)] p-3.5 space-y-2.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <label className="font-semibold text-[var(--ink)] leading-snug">
                          {qIndex + 1}. {q.question}
                        </label>
                        {isUnknown && (
                          <span className="shrink-0 text-[2xs] px-2 py-0.5 rounded bg-[var(--mid-bg)] text-[var(--mid)] font-medium">
                            Sẽ ghi [CẦN DỮ LIỆU]
                          </span>
                        )}
                      </div>

                      {/* Chips / Options */}
                      {q.options && q.options.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {q.options.map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleAnswerChange(q.id, opt)}
                              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                currentVal === opt
                                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                                  : "bg-[var(--surface)] text-[var(--ink-2)] border-[var(--line-2)] hover:border-[var(--accent)]"
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Custom Input or Quote Input */}
                      <div className="flex gap-2">
                        <input
                          type={q.type === "number" ? "text" : "text"}
                          value={isUnknown ? "" : currentVal || ""}
                          placeholder={
                            q.type === "quote"
                              ? 'Trích lời nói (ví dụ: "Về tới phòng 8h, mở tủ lạnh thấy trống...")'
                              : q.type === "number"
                              ? "Nhập số lượng người..."
                              : "Nhập câu trả lời cụ thể..."
                          }
                          disabled={isUnknown}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] p-2 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleAnswerChange(q.id, isUnknown ? "" : q.unknown_label || "Chưa biết")
                          }
                          className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                            isUnknown
                              ? "bg-[var(--mid-bg)] text-[var(--mid)] border-amber-300 font-bold"
                              : "bg-[var(--surface)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]"
                          }`}
                        >
                          {q.unknown_label || "Chưa biết"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Prompt Builder Action */}
            <div className="pt-2 border-t border-[var(--line-2)] flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleBuildPrompt}
                disabled={generatingPrompt}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium text-xs hover:opacity-90 transition-opacity shadow-sm"
              >
                {generatingPrompt ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Đang dựng prompt v2...
                  </>
                ) : (
                  <>
                    <Wand2 className="size-3.5" />
                    Tạo prompt chuẩn v2
                  </>
                )}
              </button>

              {generatedPrompt && (
                <button
                  type="button"
                  onClick={() => setShowPromptPreview(!showPromptPreview)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--ink)] font-medium"
                >
                  {showPromptPreview ? "Ẩn prompt" : "Xem prompt sẽ chèn"}
                </button>
              )}
            </div>

            {/* Generated Prompt Preview (Spec B7: Hidden by default) */}
            {generatedPrompt && showPromptPreview && (
              <div className="space-y-3 pt-3 border-t border-[var(--line-2)]">
                <div className="flex items-center justify-between">
                  <span className="text-[2xs] font-bold text-[var(--muted)] uppercase">
                    Nội dung prompt v2 (&le; 25 dòng):
                  </span>
                  <button
                    onClick={handleCopyAndOpenChatGPT}
                    className="inline-flex items-center gap-1 text-xs text-[var(--accent)] font-semibold hover:underline"
                  >
                    <Copy className="size-3" />
                    {promptCopied ? "Đã chép!" : "Sao chép & Mở ChatGPT"}
                  </button>
                </div>
                <pre className="rounded-xl border border-[var(--line-2)] bg-[var(--surface-2)] p-4 text-xs font-mono text-[var(--ink)] leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {generatedPrompt}
                </pre>
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Paste Answer & Grading */}
        <div className="space-y-6">
          <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[2xs] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Bước 2 · Dán & Chấm bài
                </span>
                <h2 className="text-lg font-serif font-bold text-[var(--ink)] mt-0.5">
                  Chấm chuẩn rubric môn EXE
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Dán câu trả lời bạn nhận được từ ChatGPT vào ô bên dưới để đối chiếu theo rubric và tìm lỗi câu từ.
                </p>
              </div>
            </div>

            {/* Textarea or Highlighted Text */}
            {renderHighlightedText()}

            {/* Grade Error */}
            {gradeError && (
              <div className="rounded-lg bg-[var(--bad-bg)] p-3 text-xs text-[var(--bad)] border border-red-200">
                {gradeError}
              </div>
            )}

            {/* Actions: Chấm & Lưu */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--line-2)]">
              <button
                type="button"
                onClick={handleGrade}
                disabled={isGrading || !answerText.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--ink)] text-white text-xs font-bold hover:bg-black transition-colors disabled:opacity-50 shadow-sm"
              >
                {isGrading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Đang đối chiếu rubric...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                    Chấm câu trả lời · 1 credit
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveSection}
                disabled={isSaving || !answerText.trim()}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  allPassed
                    ? "bg-[var(--ok-bg)] text-[var(--ok)] border-green-300"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--sunken)]"
                }`}
              >
                <Save className="size-3.5" />
                {isSaving
                  ? "Đang lưu..."
                  : saveSuccess
                  ? "Đã lưu bản này!"
                  : allPassed
                  ? "Lưu bản đạt"
                  : "Lưu bản nháp"}
              </button>
            </div>

            {/* Celebration message if all passed (Spec Mục 8) */}
            {allPassed && (
              <div className="rounded-lg bg-[var(--ok-bg)] p-3 text-xs text-[var(--ok)] border border-green-200 flex items-center gap-2 font-medium">
                <Check className="size-4 shrink-0" />
                <span>
                  Phần {currentSection.title} đã đạt tất cả tiêu chí! Hãy bấm "Lưu bản đạt" để cập nhật tiến độ đề án.
                </span>
              </div>
            )}

            {/* Evaluation Results Breakdown (Spec 6.5 & Figure 5) */}
            {gradeResult && (
              <div className="space-y-4 pt-4 border-t border-[var(--line-2)]">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm text-[var(--ink)]">
                    Kết quả chấm chi tiết
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--ok)] font-medium">
                      ✓ {gradeResult.criteria.filter((c) => c.level === "TOT").length} Tốt
                    </span>
                    <span className="text-[var(--mid)] font-medium">
                      ⊖ {gradeResult.criteria.filter((c) => c.level === "DAT").length} Đạt
                    </span>
                    <span className="text-[var(--bad)] font-medium">
                      ⊗ {gradeResult.criteria.filter((c) => c.level === "CHUA_DAT").length} Chưa đạt
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[var(--ink-2)] italic bg-[var(--surface-2)] p-3 rounded-lg border border-[var(--line-2)] leading-relaxed">
                  {gradeResult.summary}
                </p>

                {/* Criteria Cards */}
                <div className="space-y-2.5">
                  {gradeResult.criteria.map((c) => (
                    <div
                      key={c.id}
                      className={`rounded-xl border p-3.5 text-xs space-y-2 ${
                        c.level === "TOT"
                          ? "border-green-200 bg-[var(--ok-bg)]/40 text-[var(--ink)]"
                          : c.level === "DAT"
                          ? "border-amber-200 bg-[var(--mid-bg)]/40 text-[var(--ink)]"
                          : "border-red-200 bg-[var(--bad-bg)]/40 text-[var(--ink)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-sm text-[var(--ink)]">
                          {c.name || c.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[2xs] ${
                            c.level === "TOT"
                              ? "bg-[var(--ok-bg)] text-[var(--ok)]"
                              : c.level === "DAT"
                              ? "bg-[var(--mid-bg)] text-[var(--mid)]"
                              : "bg-[var(--bad-bg)] text-[var(--bad)]"
                          }`}
                        >
                          {c.level === "TOT"
                            ? "✓ Tốt"
                            : c.level === "DAT"
                            ? "⊖ Đạt"
                            : "⊗ Chưa đạt"}
                        </span>
                      </div>

                      <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                        {c.reason}
                      </p>

                      {c.evidence_quote && (
                        <blockquote className="rounded bg-[var(--surface)] p-2 text-[2xs] text-[var(--muted)] font-mono italic border border-[var(--line-2)]">
                          "{c.evidence_quote}"
                        </blockquote>
                      )}

                      {/* Fix Button if not TOT */}
                      {c.level !== "TOT" && (
                        <div className="pt-1 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              handleRequestFix(
                                c.level === "CHUA_DAT" ? "FOCUS_REWRITE" : "NEED_DATA",
                                c.evidence_quote
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--surface)] border border-[var(--line)] text-xs font-medium text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                          >
                            <Sparkles className="size-3 text-[var(--accent)]" />
                            Tạo prompt sửa câu này
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Fix Prompt Box */}
                {fixPromptText && (
                  <div className="mt-4 rounded-xl border border-[var(--accent)] bg-[var(--accent-weak)] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[var(--accent)]">
                        Prompt sửa câu (&le; 10 dòng):
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(fixPromptText);
                          setFixPromptCopied(true);
                          setTimeout(() => setFixPromptCopied(false), 2000);
                        }}
                        className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1"
                      >
                        <Copy className="size-3" />
                        {fixPromptCopied ? "Đã chép!" : "Chép prompt sửa"}
                      </button>
                    </div>
                    <pre className="text-xs font-mono text-[var(--ink)] whitespace-pre-wrap bg-[var(--surface)] p-3 rounded-lg border border-purple-200">
                      {fixPromptText}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
