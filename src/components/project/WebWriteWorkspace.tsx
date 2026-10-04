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
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  HelpCircle,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Target,
  Wand2,
  X,
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
  status?: "below" | "met";
  priority?: number;
  reason: string;
  evidence_quote: string;
  gap?: {
    missing: string;
    quote: string;
    fix_kind: "auto" | "needs_input" | "self";
    input_question?: string;
    example_id?: string;
    example?: {
      excerpt: string;
      why_good: string;
    };
  };
  keep_quote?: string;
}

interface GradeResponse {
  grade_id: string;
  status: "ok" | "rejected";
  reject_reason?: string | null;
  section_id?: string;
  target_level?: "pass" | "good" | "excellent";
  met_count?: number;
  total?: number;
  criteria: CriterionResult[];
  gaps?: CriterionResult[];
  keep?: CriterionResult[];
  invented_numbers?: string[];
  warnings?: Array<{ type: string; message: string; quote?: string }>;
  fix_actions?: Array<{
    id: string;
    criterion_id: string;
    type: string;
    label: string;
    explanation: string;
  }>;
  likely_questions?: string[];
  credits_left?: number;
  summary?: string;
  overall_status?: "passed" | "needs_work";
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
  initialTargetLevel?: "pass" | "good" | "excellent" | null;
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
  initialTargetLevel = null,
}: WebWriteWorkspaceProps) {
  const currentSection = sections.find((s) => s.id === sectionId) || sections[0];

  // Target Level State (Qua môn, Khá 7-8, Xuất sắc 9-10)
  const [targetLevel, setTargetLevel] = useState<"pass" | "good" | "excellent">(
    initialTargetLevel || initialGradeResult?.target_level || "good"
  );
  const [showTargetModal, setShowTargetModal] = useState<boolean>(
    !initialTargetLevel && !initialGradeResult?.target_level
  );

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

  // View mode for answer: editor vs visual
  const [answerViewMode, setAnswerViewMode] = useState<"edit" | "preview">("edit");

  // Keep accordion state
  const [keepExpanded, setKeepExpanded] = useState(false);

  // Self-fix checklists open states: Record<criterionId, boolean>
  const [openSelfFixId, setOpenSelfFixId] = useState<string | null>(null);

  // Interactive Question Dialog State ("Trả lời 1 câu rồi sửa")
  const [questionModalState, setQuestionModalState] = useState<{
    open: boolean;
    criterionId: string;
    criterionName: string;
    question: string;
    userAnswer: string;
    submitting: boolean;
  } | null>(null);

  // Fix Prompt Modal / Display State
  const [fixPromptModal, setFixPromptModal] = useState<{
    open: boolean;
    promptText: string;
    criterionName: string;
    copied: boolean;
  } | null>(null);

  // Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load section intake questions and saved answers
  useEffect(() => {
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

  // Build Initial Prompt
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

  const handleCopyAndOpenChatGPT = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setPromptCopied(true);
    window.open("https://chatgpt.com", "_blank");
    setTimeout(() => setPromptCopied(false), 3000);
  };

  // Select target level & persist to project
  const handleSelectTargetLevel = async (level: "pass" | "good" | "excellent") => {
    setTargetLevel(level);
    setShowTargetModal(false);
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target_level: level }),
      });
    } catch (err) {
      console.error("Failed to persist target level", err);
    }
  };

  // Grade current draft
  const handleGrade = async () => {
    if (!answerText.trim()) return;
    setIsGrading(true);
    setGradeError(null);
    try {
      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          section_id: sectionId,
          output_text: answerText.trim(),
          target_level: targetLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGradeError(data.message || data.error || "Không thể chấm câu trả lời.");
      } else {
        setGradeResult(data);
        setAnswerViewMode("preview");
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

  // 1. "Sửa cho tôi": direct 1-click fix prompt
  const handleFixForMe = async (criterionId: string, criterionName: string) => {
    if (!gradeResult?.grade_id) return;
    try {
      const res = await fetch("/api/fix-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade_id: gradeResult.grade_id,
          criterion_key: criterionId,
        }),
      });
      if (res.ok) {
        const body = await res.json();
        navigator.clipboard.writeText(body.prompt_text);
        setFixPromptModal({
          open: true,
          promptText: body.prompt_text,
          criterionName,
          copied: true,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. "Trả lời 1 câu rồi sửa": open dialog with specific question
  const handleOpenQuestionModal = (gap: CriterionResult) => {
    const question =
      gap.gap?.input_question ||
      `Bạn có số liệu hoặc câu chuyện thực tế nào từ khảo sát/phỏng vấn để bổ sung cho tiêu chí "${gap.name || gap.id}" không?`;

    setQuestionModalState({
      open: true,
      criterionId: gap.id,
      criterionName: gap.name || gap.id,
      question,
      userAnswer: "",
      submitting: false,
    });
  };

  const handleSubmitQuestionAnswer = async (isMissingData: boolean = false) => {
    if (!questionModalState || !gradeResult?.grade_id) return;
    setQuestionModalState((prev) => (prev ? { ...prev, submitting: true } : null));

    const answer = isMissingData
      ? "[CẦN DỮ LIỆU]"
      : questionModalState.userAnswer.trim() || "[CẦN DỮ LIỆU]";

    try {
      const res = await fetch("/api/fix-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade_id: gradeResult.grade_id,
          criterion_key: questionModalState.criterionId,
          user_answer: answer,
          missing_data: isMissingData,
        }),
      });

      if (res.ok) {
        const body = await res.json();
        navigator.clipboard.writeText(body.prompt_text);
        setQuestionModalState(null);
        setFixPromptModal({
          open: true,
          promptText: body.prompt_text,
          criterionName: questionModalState.criterionName,
          copied: true,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Extract display gaps and keep lists
  const gapsList =
    gradeResult?.gaps && gradeResult.gaps.length > 0
      ? gradeResult.gaps
      : gradeResult?.criteria?.filter((c) => c.status === "below" || c.level === "CHUA_DAT")?.slice(0, 3) || [];

  const keepList =
    gradeResult?.keep && gradeResult.keep.length > 0
      ? gradeResult.keep
      : gradeResult?.criteria?.filter((c) => c.status === "met" || c.level === "TOT") || [];

  const metCount = gradeResult?.met_count ?? keepList.length;
  const totalCount = gradeResult?.total ?? (gradeResult?.criteria?.length || 0);
  const isGoalReached = totalCount > 0 && metCount >= totalCount;

  // Target Level meta for display
  const targetLabelMap: Record<string, { label: string; est: string; color: string }> = {
    pass: { label: "Qua môn", est: "Đạt chuẩn cơ bản", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    good: { label: "Khá (7–8)", est: "Trọng điểm đạt Tốt", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    excellent: { label: "Xuất sắc (9–10)", est: "Tất cả tiêu chí Tốt", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  };

  // Render 2-way colored text view
  const renderVisualAnswer = () => {
    if (!answerText) return null;

    // Gather weak quotes and keep quotes
    const weakQuotes = gapsList.map((g) => g.gap?.quote || g.evidence_quote).filter(Boolean);
    const goodQuotes = keepList.map((k) => k.keep_quote || k.evidence_quote).filter(Boolean);

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-[11px] text-[var(--muted)] border-b border-[var(--line-2)] pb-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-2 rounded-full bg-amber-500 inline-block" />
              Gạch chân vàng: Cần sửa
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <span className="size-2 rounded-full bg-emerald-500 inline-block" />
              Gạch chân xanh: Giữ nguyên (đã tốt)
            </span>
          </div>

          <button
            type="button"
            onClick={() => setAnswerViewMode("edit")}
            className="text-xs text-[var(--accent)] font-semibold hover:underline"
          >
            Chuyển sang ô chỉnh sửa
          </button>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-xs font-mono text-[var(--ink)] leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
          {/* Highlight render */}
          {answerText.split(/(?<=[.!?\n])\s+/).map((sentence, idx) => {
            const trimmed = sentence.trim();
            if (!trimmed) return null;

            const isWeak = weakQuotes.some((wq) => wq && trimmed.includes(wq.slice(0, 30)));
            const isGood = !isWeak && goodQuotes.some((gq) => gq && trimmed.includes(gq.slice(0, 30)));

            if (isWeak) {
              return (
                <mark
                  key={idx}
                  className="bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-100 border-b-2 border-amber-500 px-1 py-0.5 rounded-sm mx-0.5"
                  title="Cần sửa để tới mục tiêu"
                >
                  {sentence}{" "}
                </mark>
              );
            }

            if (isGood) {
              return (
                <mark
                  key={idx}
                  className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 border-b-2 border-emerald-500 px-1 py-0.5 rounded-sm mx-0.5"
                  title="Giữ nguyên · Đã đạt chuẩn (Khóa khi sửa)"
                >
                  {sentence}{" "}
                </mark>
              );
            }

            return <span key={idx}>{sentence} </span>;
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Target Level Modal (Prompt before first grade or upon request) */}
      {showTargetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Mục tiêu điểm đề án
                </span>
                <h3 className="text-lg font-serif font-bold text-[var(--ink)] mt-0.5">
                  Nhóm muốn đạt mức nào?
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                  RootAccess sẽ chỉ ra đúng những chỗ cần sửa để đạt mức điểm bạn chọn, không làm ngợp bạn với hàng tá góp ý thừa.
                </p>
              </div>
              <button
                onClick={() => setShowTargetModal(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* 3 Target Options */}
            <div className="space-y-3">
              {/* Option 1: Qua môn */}
              <button
                type="button"
                onClick={() => handleSelectTargetLevel("pass")}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  targetLevel === "pass"
                    ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500"
                    : "border-[var(--line)] bg-[var(--surface-2)] hover:border-blue-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-[var(--ink)]">Qua môn</span>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-100 dark:bg-blue-950 px-2 py-0.5 rounded-full">
                    Sửa ít nhất, nhanh nhất
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Mọi tiêu chí ở mức Đạt. Chỉ sửa các lỗi nghiêm trọng làm bài dưới chuẩn. Thường chỉ 1–2 chỗ cần sửa mỗi phần.
                </p>
              </button>

              {/* Option 2: Khá 7-8 */}
              <button
                type="button"
                onClick={() => handleSelectTargetLevel("good")}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  targetLevel === "good"
                    ? "border-amber-500 bg-amber-500/10 ring-1 ring-amber-500"
                    : "border-[var(--line)] bg-[var(--surface-2)] hover:border-amber-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-[var(--ink)]">
                    Khá · khoảng 7–8 điểm
                  </span>
                  <span className="text-[11px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                    Khuyên dùng cho kỳ này
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Các tiêu chí trọng điểm (ngách, số liệu, tính khả thi) lên mức Tốt, còn lại ở mức Đạt. Thường 2–3 chỗ cần sửa.
                </p>
              </button>

              {/* Option 3: Xuất sắc 9-10 */}
              <button
                type="button"
                onClick={() => handleSelectTargetLevel("excellent")}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  targetLevel === "excellent"
                    ? "border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500"
                    : "border-[var(--line)] bg-[var(--surface-2)] hover:border-emerald-300"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-[var(--ink)]">
                    Xuất sắc · khoảng 9–10 điểm
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                    So sánh với bài mẫu điểm cao
                  </span>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Tất cả tiêu chí đạt mức Tốt. 1 nhóm · 1 nơi · 1 hành vi đếm được. Bật mốc đối chiếu với bài mẫu đã được chấm thật.
                </p>
              </button>
            </div>

            <p className="text-[11px] text-[var(--muted)] italic text-center">
              * Mức điểm là ước lượng theo rubric chính thức, không phải điểm của giảng viên. Bạn có thể đổi mục tiêu bất cứ lúc nào.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Header */}
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

      {/* Main Workspace Grid */}
      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* Left Column: Intake & Prompt Builder */}
        <div className="space-y-6">
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
                  Để prompt có dữ liệu thật của nhóm, chống AI tự bịa số liệu. Câu nào chưa làm có thể bấm "Chưa biết".
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
                          <span className="rounded bg-amber-500/10 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 shrink-0">
                            Chưa có dữ liệu
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type={q.type === "number" ? "number" : "text"}
                          disabled={isUnknown}
                          value={isUnknown ? "" : currentVal || ""}
                          placeholder={isUnknown ? "AI sẽ ghi chú [CẦN DỮ LIỆU]" : "Nhập câu trả lời..."}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-40"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            handleAnswerChange(q.id, isUnknown ? "" : q.unknown_label || "Chưa biết")
                          }
                          className={`px-2.5 py-1.5 rounded-lg border text-[11px] whitespace-nowrap transition-colors ${
                            isUnknown
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 font-bold"
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
                    Đang dựng prompt...
                  </>
                ) : (
                  <>
                    <Wand2 className="size-3.5" />
                    Tạo prompt chuẩn
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

            {/* Prompt Preview */}
            {generatedPrompt && showPromptPreview && (
              <div className="space-y-3 pt-3 border-t border-[var(--line-2)]">
                <div className="flex items-center justify-between">
                  <span className="text-[2xs] font-bold text-[var(--muted)] uppercase">
                    Nội dung prompt:
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

        {/* Right Column: Paste & Goal-Oriented Grading */}
        <div className="space-y-6">
          <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm space-y-5">
            {/* Step 2 Header & Target Level Bar */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <span className="text-[2xs] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Bước 2 · Dán & Chấm theo mục tiêu
                </span>
                <h2 className="text-lg font-serif font-bold text-[var(--ink)] mt-0.5">
                  Đạt đúng điểm bạn muốn
                </h2>
              </div>

              {/* Target Level Pill */}
              <div className="flex items-center gap-2">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${
                    targetLabelMap[targetLevel]?.color || ""
                  }`}
                >
                  <Target className="size-3.5" />
                  Mục tiêu: {targetLabelMap[targetLevel]?.label}
                </div>
                <button
                  type="button"
                  onClick={() => setShowTargetModal(true)}
                  className="text-xs text-[var(--accent)] font-semibold hover:underline"
                >
                  Đổi
                </button>
              </div>
            </div>

            {/* Editor or Visual Review */}
            {answerViewMode === "preview" && gradeResult ? (
              renderVisualAnswer()
            ) : (
              <div className="space-y-2">
                <textarea
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  rows={10}
                  placeholder="Dán câu trả lời bạn nhận được từ ChatGPT vào đây để đối chiếu rubric..."
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-xs font-mono text-[var(--ink)] leading-relaxed focus:outline-none focus:border-[var(--accent)]"
                />
                {gradeResult && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setAnswerViewMode("preview")}
                      className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Xem đánh dấu 2 màu (chỗ sửa / chỗ giữ)
                    </button>
                  </div>
                )}
              </div>
            )}

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
                    Chấm theo mục tiêu này · 1 credit
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveSection}
                disabled={isSaving || !answerText.trim()}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  isGoalReached
                    ? "bg-[var(--ok-bg)] text-[var(--ok)] border-green-300"
                    : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--sunken)]"
                }`}
              >
                <Save className="size-3.5" />
                {isSaving
                  ? "Đang lưu..."
                  : saveSuccess
                  ? "Đã lưu bản này!"
                  : isGoalReached
                  ? "Lưu bản đạt mục tiêu"
                  : "Lưu bản nháp"}
              </button>
            </div>

            {/* Results Presentation (Chỉ sửa chỗ thiếu, giữ nguyên chỗ tốt) */}
            {gradeResult && (
              <div className="space-y-5 pt-4 border-t border-[var(--line-2)]">
                {/* Progress bar to target */}
                <div className="rounded-xl border border-[var(--line-2)] bg-[var(--surface-2)] p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--ink)]">
                      Tiến độ tới mục tiêu ({targetLabelMap[targetLevel]?.label})
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {metCount}/{totalCount} tiêu chí đã đạt
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--line)] overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${totalCount > 0 ? (metCount / totalCount) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Warning: Invented Numbers */}
                {gradeResult.invented_numbers && gradeResult.invented_numbers.length > 0 && (
                  <div className="rounded-xl border border-red-300/80 bg-red-500/10 p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400">
                      <AlertTriangle className="size-4 shrink-0" />
                      Cảnh báo: Phát hiện số liệu nghi vấn chưa có nguồn kiểm chứng
                    </div>
                    <ul className="text-xs text-red-900 dark:text-red-200 list-disc list-inside space-y-1 font-mono">
                      {gradeResult.invented_numbers.map((num, i) => (
                        <li key={i}>"{num}"</li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-red-700 dark:text-red-300">
                      Hội đồng sẽ hỏi nguồn các số liệu này. Hãy thay bằng số liệu phỏng vấn thật hoặc ghi [CẦN DỮ LIỆU].
                    </p>
                  </div>
                )}

                {/* Group 1: Cần sửa để tới mục tiêu (Max 3 items) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif font-bold text-sm text-[var(--ink)] flex items-center gap-2">
                      <span className="size-2 rounded-full bg-amber-500" />
                      Cần sửa để tới mục tiêu ({gapsList.length} việc)
                    </h3>
                    <span className="text-[11px] text-[var(--muted)]">
                      Ưu tiên việc quan trọng nhất
                    </span>
                  </div>

                  {gapsList.length === 0 ? (
                    <div className="rounded-xl border border-emerald-300/80 bg-emerald-500/10 p-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-3">
                      <CheckCircle2 className="size-5 shrink-0 text-emerald-600" />
                      <div>
                        <span className="font-bold block">Chúc mừng! Phần này đã đạt toàn bộ mục tiêu đề ra.</span>
                        <span>Bạn có thể bấm "Lưu bản đạt mục tiêu" và chuyển sang phần tiếp theo.</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {gapsList.map((gap, gIdx) => {
                        const isSelfFixOpen = openSelfFixId === gap.id;

                        return (
                          <div
                            key={gap.id}
                            className="rounded-2xl border border-amber-300/80 bg-amber-50/40 dark:bg-amber-950/20 p-4 sm:p-5 space-y-3.5 shadow-sm"
                          >
                            {/* Card Header: Name & Distance */}
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-white text-[11px] font-bold">
                                  {gIdx + 1}
                                </span>
                                <h4 className="font-bold text-sm text-[var(--ink)]">
                                  {gap.name || gap.id}
                                </h4>
                              </div>

                              <span className="rounded-md border border-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-200">
                                {gap.level === "CHUA_DAT" ? "Chưa đạt" : "Đạt"} → Tốt
                              </span>
                            </div>

                            {/* Thiếu gì */}
                            <div className="text-xs text-[var(--ink)] space-y-1">
                              <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--muted)] block">
                                Thiếu gì:
                              </span>
                              <p className="leading-relaxed font-medium">
                                {gap.gap?.missing || gap.reason}
                              </p>
                            </div>

                            {/* Weak Quote from draft */}
                            {(gap.gap?.quote || gap.evidence_quote) && (
                              <blockquote className="rounded-xl border border-amber-300/60 bg-amber-100/50 dark:bg-amber-900/30 p-2.5 text-xs text-[var(--ink)] font-mono italic">
                                "{gap.gap?.quote || gap.evidence_quote}"
                              </blockquote>
                            )}

                            {/* High-Scoring Example Box */}
                            {gap.gap?.example && (
                              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3.5 space-y-1.5 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400 text-[11px] uppercase">
                                  <Sparkles className="size-3.5 text-emerald-600" />
                                  Bài mẫu đạt Tốt · Dự án khác
                                </div>
                                <p className="italic text-emerald-950 dark:text-emerald-100 font-mono text-xs leading-relaxed">
                                  "{gap.gap.example.excerpt}"
                                </p>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                                  <span className="font-bold">Vì sao tốt: </span>
                                  {gap.gap.example.why_good}
                                </p>
                              </div>
                            )}

                            {/* 3 Fix Action Buttons */}
                            <div className="pt-2 border-t border-amber-200/80 dark:border-amber-900/40 flex flex-wrap items-center gap-2 justify-end">
                              {/* Action 1: Sửa cho tôi */}
                              <button
                                type="button"
                                onClick={() => handleFixForMe(gap.id, gap.name || gap.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
                              >
                                <Wand2 className="size-3" />
                                Sửa cho tôi
                              </button>

                              {/* Action 2: Trả lời 1 câu rồi sửa */}
                              <button
                                type="button"
                                onClick={() => handleOpenQuestionModal(gap)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] text-xs font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shadow-sm"
                              >
                                <MessageSquare className="size-3 text-amber-500" />
                                Trả lời 1 câu rồi sửa
                              </button>

                              {/* Action 3: Tự sửa */}
                              <button
                                type="button"
                                onClick={() => setOpenSelfFixId(isSelfFixOpen ? null : gap.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-[var(--line)] text-xs text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                              >
                                Tự sửa {isSelfFixOpen ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                              </button>
                            </div>

                            {/* Self-fix checklist expansion */}
                            {isSelfFixOpen && (
                              <div className="rounded-xl border border-[var(--line-2)] bg-[var(--surface)] p-3 text-xs space-y-2 animate-in fade-in duration-150">
                                <span className="font-bold text-[11px] text-[var(--muted)] uppercase block">
                                  Checklist cần có trong đoạn văn:
                                </span>
                                <ul className="space-y-1.5 text-[var(--ink)] text-[11px]">
                                  <li className="flex items-center gap-2">
                                    <Check className="size-3.5 text-emerald-500" />
                                    <span>Đúng 1 nhóm khách hàng cụ thể (không gộp đối tượng).</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <Check className="size-3.5 text-emerald-500" />
                                    <span>Có địa điểm / ngữ cảnh sinh sống rõ ràng.</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <Check className="size-3.5 text-emerald-500" />
                                    <span>Hành vi quan sát được hoặc đếm được tần suất.</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <Check className="size-3.5 text-emerald-500" />
                                    <span>Dẫn số liệu khảo sát thực tế (nếu chưa có thì ghi [CẦN DỮ LIỆU]).</span>
                                  </li>
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Group 2: Giữ nguyên (Collapsed Accordion) */}
                {keepList.length > 0 && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => setKeepExpanded(!keepExpanded)}
                      className="w-full flex items-center justify-between p-4 text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="size-3.5 text-emerald-600" />
                        <span>
                          Giữ nguyên · {keepList.length} tiêu chí đã đạt mục tiêu (Đã khóa)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 dark:text-emerald-400">
                        <span>{keepExpanded ? "Thu gọn" : "Xem các câu"}</span>
                        {keepExpanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                      </div>
                    </button>

                    {keepExpanded && (
                      <div className="p-4 pt-0 space-y-2.5 border-t border-emerald-500/20">
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400 italic">
                          Các câu dưới đây đã đạt chuẩn. Khi tạo prompt sửa, RootAccess tự động yêu cầu AI giữ nguyên các câu này để không làm hỏng bài.
                        </p>
                        {keepList.map((item) => (
                          <div
                            key={item.id}
                            className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-emerald-900 dark:text-emerald-100">
                                ✓ {item.name || item.id}
                              </span>
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-200/50 dark:bg-emerald-900/50 px-1.5 py-0.5 rounded">
                                Đã khóa
                              </span>
                            </div>
                            {(item.keep_quote || item.evidence_quote) && (
                              <blockquote className="text-[11px] font-mono text-emerald-950 dark:text-emerald-200 italic">
                                "{item.keep_quote || item.evidence_quote}"
                              </blockquote>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Interactive Modal: "Trả lời 1 câu rồi sửa" */}
      {questionModalState && questionModalState.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Bổ sung số liệu thực tế · {questionModalState.criterionName}
                </span>
                <h3 className="text-base font-serif font-bold text-[var(--ink)] mt-0.5">
                  Trả lời 1 câu rồi sửa
                </h3>
              </div>
              <button
                onClick={() => setQuestionModalState(null)}
                className="text-[var(--muted)] hover:text-[var(--ink)] p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="rounded-xl bg-amber-500/10 border border-amber-300 p-3.5 text-xs text-amber-950 dark:text-amber-100 leading-relaxed font-medium">
              "{questionModalState.question}"
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase mb-1.5">
                Câu trả lời của bạn:
              </label>
              <textarea
                rows={3}
                value={questionModalState.userAnswer}
                onChange={(e) =>
                  setQuestionModalState((prev) =>
                    prev ? { ...prev, userAnswer: e.target.value } : null
                  )
                }
                placeholder="Ví dụ: 'Trong 6 người phỏng vấn, có 5 người bỏ bữa tối ít nhất 3 lần/tuần vì bận học...'"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] leading-relaxed"
              />
            </div>

            <p className="text-[11px] text-[var(--muted)] italic">
              * Nếu nhóm chưa có số liệu, bấm nút bên dưới. RootAccess sẽ ghi [CẦN DỮ LIỆU] và thêm vào danh sách to-do của bạn, tuyệt đối không để AI tự bịa số.
            </p>

            <div className="pt-2 border-t border-[var(--line-2)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleSubmitQuestionAnswer(true)}
                disabled={questionModalState.submitting}
                className="text-xs text-[var(--muted)] hover:text-amber-600 font-semibold"
              >
                Chưa có dữ liệu (Ghi [CẦN DỮ LIỆU])
              </button>

              <button
                type="button"
                onClick={() => handleSubmitQuestionAnswer(false)}
                disabled={questionModalState.submitting || !questionModalState.userAnswer.trim()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 py-2 text-xs font-bold text-white shadow-sm hover:opacity-90 disabled:opacity-50"
              >
                {questionModalState.submitting ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Wand2 className="size-3.5" />
                )}
                Tạo prompt sửa với dữ liệu này
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fix Prompt Modal / Viewer */}
      {fixPromptModal && fixPromptModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                  Prompt sửa chuẩn · {fixPromptModal.criterionName}
                </span>
                <h3 className="text-base font-serif font-bold text-[var(--ink)] mt-0.5">
                  Đã chép prompt vào bộ nhớ tạm!
                </h3>
                <p className="text-xs text-[var(--muted)] mt-1">
                  Chỉ cần dán vào ô chat ChatGPT và bấm Gửi. Prompt đã có lệnh khóa toàn bộ các câu đạt chuẩn khác.
                </p>
              </div>
              <button
                onClick={() => setFixPromptModal(null)}
                className="text-[var(--muted)] hover:text-[var(--ink)] p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            <pre className="rounded-xl border border-[var(--line-2)] bg-[var(--surface-2)] p-4 text-xs font-mono text-[var(--ink)] leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
              {fixPromptModal.promptText}
            </pre>

            <div className="pt-2 border-t border-[var(--line-2)] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(fixPromptModal.promptText);
                  setFixPromptModal((prev) => (prev ? { ...prev, copied: true } : null));
                  setTimeout(() => {
                    setFixPromptModal((prev) => (prev ? { ...prev, copied: false } : null));
                  }, 2000);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--accent)] font-semibold hover:underline"
              >
                <Copy className="size-3.5" />
                {fixPromptModal.copied ? "Đã chép lại!" : "Sao chép lại"}
              </button>

              <button
                type="button"
                onClick={() => {
                  window.open("https://chatgpt.com", "_blank");
                  setFixPromptModal(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--ink)] px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-black"
              >
                <ExternalLink className="size-3.5" />
                Mở ChatGPT & Dán
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
