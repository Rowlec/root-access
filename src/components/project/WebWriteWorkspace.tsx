"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  HelpCircle,
  History,
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
  why_important?: string;
  guiding_questions?: string[];
  gap?: {
    missing: string;
    quote: string;
    why_important?: string;
    guiding_questions?: string[];
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
    why_important?: string;
    guiding_questions?: string[];
  }>;
  likely_questions?: string[];
  compare_with_parent?: {
    delta?: number;
    improved: string[];
    worse: string[];
    same: string[];
    details?: Array<{
      criterion_id: string;
      criterion_name?: string;
      previous_level?: string;
      current_level: string;
      status: "improved" | "worse" | "same";
      reason: string;
      diff_snippet?: string;
    }>;
    summary_reason?: string;
  } | null;
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

  // In-Card Answers for Guided Fix ("Tạo prompt từ câu trả lời của tôi")
  const [inCardAnswers, setInCardAnswers] = useState<Record<string, string>>({});
  const [submittingGapPromptId, setSubmittingGapPromptId] = useState<string | null>(null);

  // Onboarding Modal State
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  // Contextual Help (?) State for Step 1 & Step 2
  const [showStepHelp, setShowStepHelp] = useState<1 | 2 | null>(null);

  // Lecturer Feedback State
  const [showLecturerBox, setShowLecturerBox] = useState(false);
  const [lecturerFeedbackText, setLecturerFeedbackText] = useState("");
  const [lecturerActualScore, setLecturerActualScore] = useState("");
  const [isAnalyzingFeedback, setIsAnalyzingFeedback] = useState(false);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<any>(null);

  // Full-check Cross-Section Proposal Review State
  const [showFullCheckModal, setShowFullCheckModal] = useState(false);
  const [isRunningFullCheck, setIsRunningFullCheck] = useState(false);
  const [fullCheckResult, setFullCheckResult] = useState<any>(null);

  // Saving State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Check if first time user to trigger onboarding
  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("ra_guided_onboarding_seen");
      if (!seen) {
        setShowOnboarding(true);
      }
    }
  }, []);

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

  // Grade current draft (Supports Regrade with parent comparison)
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
          parent_grade_id: gradeResult?.grade_id,
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
          lecturerFeedback: lecturerFeedbackText.trim() || undefined,
          actualScore: lecturerActualScore.trim() || undefined,
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

  // "Tạo prompt từ câu trả lời của tôi" (Thay cho "sửa một cú bấm")
  const handleGeneratePromptFromAnswer = async (
    criterionId: string,
    criterionName: string,
    customAnswer?: string
  ) => {
    if (!gradeResult?.grade_id) return;
    const answerToUse = (customAnswer ?? inCardAnswers[criterionId] ?? "").trim();
    if (!answerToUse) return;

    setSubmittingGapPromptId(criterionId);
    try {
      const res = await fetch("/api/fix-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade_id: gradeResult.grade_id,
          criterion_key: criterionId,
          user_answer: answerToUse,
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
    } finally {
      setSubmittingGapPromptId(null);
    }
  };

  // Open dialog with specific question
  const handleOpenQuestionModal = (gap: CriterionResult) => {
    const question =
      gap.guiding_questions?.[0] ||
      gap.gap?.guiding_questions?.[0] ||
      gap.gap?.input_question ||
      `Bạn có số liệu hoặc câu chuyện thực tế nào từ khảo sát/phỏng vấn để bổ sung cho tiêu chí "${gap.name || gap.id}" không?`;

    setQuestionModalState({
      open: true,
      criterionId: gap.id,
      criterionName: gap.name || gap.id,
      question,
      userAnswer: inCardAnswers[gap.id] || "",
      submitting: false,
    });
  };

  const handleSubmitQuestionAnswer = async (isMissingData: boolean = false) => {
    if (!questionModalState || !gradeResult?.grade_id) return;
    setQuestionModalState((prev) => (prev ? { ...prev, submitting: true } : null));

    const answer = isMissingData
      ? "[CẦN DỮ LIỆU]"
      : questionModalState.userAnswer.trim() || "[CẦN DỮ LIỆU]";

    // Update in-card answer cache
    setInCardAnswers((prev) => ({ ...prev, [questionModalState.criterionId]: answer }));

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

  // Analyze lecturer feedback with rubric mapping
  const handleAnalyzeLecturerFeedback = async () => {
    if (!lecturerFeedbackText.trim()) return;
    setIsAnalyzingFeedback(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/sections/${sectionId}/lecturer-feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedback: lecturerFeedbackText.trim(),
          score: lecturerActualScore.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setFeedbackAnalysis(data.analysis);
      }
    } catch (err) {
      console.error("Failed to analyze lecturer feedback", err);
    } finally {
      setIsAnalyzingFeedback(false);
    }
  };

  // Run full cross-section proposal check
  const handleRunFullCheck = async () => {
    setIsRunningFullCheck(true);
    setShowFullCheckModal(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/full-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (res.ok) {
        setFullCheckResult(data.result);
      } else {
        alert(data.error || "Cần lưu ít nhất 2 phần để kiểm tra chéo toàn bộ proposal.");
      }
    } catch (err) {
      console.error("Full check failed", err);
    } finally {
      setIsRunningFullCheck(false);
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
        <div className="flex items-center gap-3">
          <Link
            href={`/app/projects/${projectId}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Về sổ dự án ({projectName})
          </Link>

          <button
            type="button"
            onClick={() => {
              setOnboardingStep(0);
              setShowOnboarding(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] text-[11px] text-[var(--ink)] font-semibold hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors shadow-2xs"
          >
            <HelpCircle className="size-3.5 text-blue-500" />
            <span>Hướng dẫn quy trình</span>
          </button>

          <button
            type="button"
            onClick={handleRunFullCheck}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-[11px] text-amber-800 dark:text-amber-200 font-semibold hover:opacity-90 transition-opacity shadow-2xs"
          >
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Kiểm tra chéo toàn bài</span>
          </button>
        </div>

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
        {/* Left Column: Intake & Prompt Builder & Lecturer Feedback */}
        <div className="space-y-6">
          <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[2xs] font-bold uppercase tracking-wider text-[var(--accent)]">
                    Bước 1 · Hỏi nhanh 2–4 câu
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowStepHelp(showStepHelp === 1 ? null : 1)}
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                    title="Giải thích bước này"
                  >
                    <HelpCircle className="size-3.5" />
                  </button>
                </div>
                <h2 className="text-lg font-serif font-bold text-[var(--ink)] mt-0.5">
                  Lấy dữ liệu thực tế cho phần {currentSection.title}
                </h2>
                <p className="text-xs text-[var(--muted)] mt-1 leading-relaxed">
                  Để prompt có dữ liệu thật của nhóm, chống AI tự bịa số liệu. Câu nào chưa làm có thể bấm "Chưa biết".
                </p>
              </div>
            </div>

            {showStepHelp === 1 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 dark:bg-blue-950/40 p-3.5 text-xs text-blue-900 dark:text-blue-200 space-y-1.5 animate-in fade-in duration-150">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="size-3.5 text-blue-600" />
                  Mục đích của Bước 1:
                </p>
                <p className="text-[11px] leading-relaxed">
                  Thu thập các dữ kiện thực tế của nhóm bạn để chuẩn bị prompt chuẩn. Prompt này sẽ yêu cầu ChatGPT bám sát ngách của bạn và <strong>không tự bịa số liệu</strong>.
                </p>
                <p className="text-[11px] leading-relaxed font-semibold text-blue-800 dark:text-blue-300">
                  ➔ Bước tiếp theo: Bấm "Tạo prompt chuẩn", sao chép prompt sang ChatGPT để nhận câu trả lời bản nháp đầu tiên.
                </p>
              </div>
            )}

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

          {/* Lecturer / Mentor Feedback Section */}
          <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="size-4 text-purple-600" />
                <h3 className="font-serif font-bold text-sm text-[var(--ink)]">
                  Nhận xét từ Giảng viên / Mentor
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLecturerBox(!showLecturerBox)}
                className="text-xs text-[var(--accent)] font-semibold hover:underline"
              >
                {showLecturerBox ? "Thu gọn" : "Mở ô dán"}
              </button>
            </div>

            {showLecturerBox && (
              <div className="space-y-3 pt-2 border-t border-[var(--line-2)] animate-in fade-in duration-150">
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Dán nhận xét thực tế của thầy/cô sau buổi review. Tool sẽ phân tích tiêu chí rubric liên quan và đưa ra câu hỏi gợi mở để bạn sửa.
                </p>
                <textarea
                  rows={3}
                  value={lecturerFeedbackText}
                  onChange={(e) => setLecturerFeedbackText(e.target.value)}
                  placeholder="Ví dụ: 'Thầy thấy phần khách hàng mục tiêu còn chung chung quá, chưa có số liệu khảo sát chứng minh nỗi đau...'"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-3 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] leading-relaxed"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={lecturerActualScore}
                    onChange={(e) => setLecturerActualScore(e.target.value)}
                    placeholder="Điểm thật GV chấm (nếu có, vd: 7.5)"
                    className="w-48 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyzeLecturerFeedback}
                    disabled={isAnalyzingFeedback || !lecturerFeedbackText.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors shadow-xs"
                  >
                    {isAnalyzingFeedback ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5" />
                    )}
                    Phân tích & Hướng dẫn sửa
                  </button>
                </div>

                {feedbackAnalysis && (
                  <div className="rounded-xl border border-purple-200 bg-purple-50/70 dark:bg-purple-950/30 p-4 space-y-3 text-xs text-purple-950 dark:text-purple-100">
                    <div className="font-bold flex items-center gap-2 flex-wrap">
                      <span>Tiêu chí liên quan:</span>
                      <span className="px-2 py-0.5 rounded bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-bold">
                        {feedbackAnalysis.criterion_name}
                      </span>
                    </div>
                    <div>
                      <span className="font-bold block uppercase text-[10px] text-purple-800 dark:text-purple-300">
                        Vì sao GV trừ điểm:
                      </span>
                      <p className="leading-relaxed">{feedbackAnalysis.why_important}</p>
                    </div>
                    <div className="space-y-1">
                      <span className="font-bold block uppercase text-[10px] text-purple-800 dark:text-purple-300">
                        Câu hỏi gợi mở để sửa theo ý GV:
                      </span>
                      {feedbackAnalysis.guiding_questions?.map((q: string, i: number) => (
                        <p key={i} className="font-medium">
                          • {q}
                        </p>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-purple-200/60 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const q =
                            feedbackAnalysis.guiding_questions?.[0] ||
                            "Bạn muốn bổ sung dữ liệu gì để trả lời nhận xét của giảng viên?";
                          setQuestionModalState({
                            open: true,
                            criterionId: feedbackAnalysis.criterion_key,
                            criterionName: `Theo nhận xét GV: ${feedbackAnalysis.criterion_name}`,
                            question: q,
                            userAnswer: inCardAnswers[feedbackAnalysis.criterion_key] || "",
                            submitting: false,
                          });
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-700 text-white font-bold text-xs hover:bg-purple-800 shadow-xs"
                      >
                        <Wand2 className="size-3" />
                        Trả lời & Tạo prompt sửa theo GV
                      </button>
                    </div>
                  </div>
                )}
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
                <div className="flex items-center gap-2">
                  <span className="text-[2xs] font-bold uppercase tracking-wider text-[var(--accent)]">
                    Bước 2 · Dán & Chấm theo mục tiêu
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowStepHelp(showStepHelp === 2 ? null : 2)}
                    className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
                    title="Giải thích bước này"
                  >
                    <HelpCircle className="size-3.5" />
                  </button>
                </div>
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

            {/* Contextual Help for Step 2 */}
            {showStepHelp === 2 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 dark:bg-blue-950/40 p-3.5 text-xs text-blue-900 dark:text-blue-200 space-y-1.5 animate-in fade-in duration-150">
                <p className="font-bold flex items-center gap-1.5">
                  <Info className="size-3.5 text-blue-600" />
                  Mục đích của Bước 2:
                </p>
                <p className="text-[11px] leading-relaxed">
                  Đối chiếu câu trả lời với rubric chính thức theo mức điểm bạn đã chọn. Tool <strong>không sửa thay</strong> mà chỉ ra chính xác chỗ nào cần sửa, thiếu gì, vì sao quan trọng và đưa câu hỏi gợi mở để bạn tự sửa.
                </p>
                <p className="text-[11px] leading-relaxed font-semibold text-blue-800 dark:text-blue-300">
                  ➔ Sau khi sửa: Bấm "Chấm theo mục tiêu này" lần nữa để xem bảng <em>"Bạn đã sửa gì"</em> và giải thích vì sao điểm đổi.
                </p>
              </div>
            )}

            {/* Visual Copy Guidance */}
            <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)] bg-[var(--surface-2)] p-3 rounded-xl border border-[var(--line-2)]">
              <div className="flex items-center gap-2">
                <Copy className="size-4 text-[var(--accent)] shrink-0" />
                <span>
                  <strong>Chỉ dẫn:</strong> Sau khi ChatGPT sinh câu trả lời ở tab bên cạnh, hãy sao chép văn bản và dán vào ô bên dưới.
                </span>
              </div>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 whitespace-nowrap">
                Tip: Extension tự nhận diện
              </span>
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

            {/* Empty State when no draft pasted yet */}
            {!answerText.trim() && !gradeResult && (
              <div className="rounded-xl border border-dashed border-[var(--line)] p-6 text-center space-y-2 bg-[var(--surface-2)]/50">
                <p className="text-xs font-semibold text-[var(--ink)]">Chưa có bài để chấm</p>
                <p className="text-[11px] text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
                  Hãy hoàn thành Bước 1 ở bên trái, sao chép prompt sang ChatGPT, sau đó dán nội dung câu trả lời nhận được vào ô trên và bấm "Chấm theo mục tiêu này".
                </p>
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
                {/* "Bạn đã sửa gì" sau mỗi lần chấm lại (compare_with_parent) */}
                {gradeResult.compare_with_parent && (
                  <div className="rounded-2xl border border-blue-300/80 bg-blue-50/50 dark:bg-blue-950/20 p-4 sm:p-5 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <History className="size-4 text-blue-600" />
                        <h4 className="font-bold text-xs text-blue-950 dark:text-blue-100">
                          Bạn đã sửa gì sau khi chấm lại
                        </h4>
                      </div>
                      {(() => {
                        const delta =
                          gradeResult.compare_with_parent.delta ??
                          (gradeResult.compare_with_parent.improved.length -
                            gradeResult.compare_with_parent.worse.length);
                        return (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                            {delta > 0
                              ? `+${delta} tiêu chí đạt`
                              : delta === 0
                              ? "Điểm chưa đổi"
                              : `${delta} tiêu chí`}
                          </span>
                        );
                      })()}
                    </div>

                    {gradeResult.compare_with_parent.summary_reason && (
                      <div className="rounded-xl bg-blue-100/60 dark:bg-blue-900/30 p-3 text-xs text-blue-950 dark:text-blue-200 leading-relaxed font-medium">
                        {gradeResult.compare_with_parent.summary_reason}
                      </div>
                    )}

                    {gradeResult.compare_with_parent.details &&
                      gradeResult.compare_with_parent.details.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 block">
                            Chi tiết thay đổi theo từng tiêu chí:
                          </span>
                          <div className="space-y-2">
                            {gradeResult.compare_with_parent.details.map((d, dIdx) => (
                              <div
                                key={dIdx}
                                className="flex items-start gap-2.5 text-xs bg-white/80 dark:bg-neutral-900/80 p-3 rounded-xl border border-blue-200/60 dark:border-blue-900/40"
                              >
                                <span
                                  className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                    d.status === "improved"
                                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                      : d.status === "worse"
                                      ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                                      : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
                                  }`}
                                >
                                  {d.previous_level || "Chưa đạt"} → {d.current_level}
                                </span>
                                <div className="space-y-0.5 min-w-0 flex-1">
                                  <p className="font-bold text-[var(--ink)] text-[11px]">
                                    {d.criterion_name || d.criterion_id}
                                  </p>
                                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                                    {d.reason}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
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
                        const guidingQuestions: string[] =
                          gap.guiding_questions && gap.guiding_questions.length > 0
                            ? gap.guiding_questions
                            : gap.gap?.guiding_questions && gap.gap.guiding_questions.length > 0
                            ? gap.gap.guiding_questions
                            : [
                                gap.gap?.input_question ||
                                  `Nhóm đã khảo sát bao nhiêu người hoặc có dữ liệu thực tế nào chứng minh tiêu chí "${gap.name || gap.id}" không?`,
                              ];

                        const whyImportantText =
                          gap.why_important ||
                          gap.gap?.why_important ||
                          "Hội đồng và giảng viên sẽ trừ điểm ở phần này nếu thấy bài viết thiếu số liệu chứng minh thực tế hoặc chỉ nói chung chung.";

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

                            {/* 1. Chỗ nào: Weak Quote */}
                            {(gap.gap?.quote || gap.evidence_quote) && (
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                                  1. Chỗ nào (Đoạn cần sửa):
                                </span>
                                <blockquote className="rounded-xl border border-amber-300 bg-amber-100/60 dark:bg-amber-900/40 p-2.5 text-xs text-amber-950 dark:text-amber-100 font-mono italic leading-relaxed">
                                  "{gap.gap?.quote || gap.evidence_quote}"
                                </blockquote>
                              </div>
                            )}

                            {/* 2. Thiếu gì: Missing criteria */}
                            <div className="text-xs text-[var(--ink)] space-y-1">
                              <span className="font-bold text-[10px] uppercase tracking-wider text-[var(--muted)] block">
                                2. Thiếu gì (Theo rubric):
                              </span>
                              <p className="leading-relaxed font-medium">
                                {gap.gap?.missing || gap.reason}
                              </p>
                            </div>

                            {/* 3. Vì sao quan trọng: Why important */}
                            <div className="rounded-xl border border-red-200/80 bg-red-50/70 dark:bg-red-950/30 p-3 text-xs space-y-1">
                              <span className="font-bold text-[10px] uppercase tracking-wider text-red-800 dark:text-red-300 flex items-center gap-1.5">
                                <AlertTriangle className="size-3 text-red-600" />
                                3. Vì sao quan trọng (Giảng viên sẽ trừ điểm ở đâu):
                              </span>
                              <p className="text-[11px] text-red-900 dark:text-red-200 leading-relaxed font-medium">
                                {whyImportantText}
                              </p>
                            </div>

                            {/* High-Scoring Example Box if available */}
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

                            {/* 4. Câu hỏi gợi mở & Trả lời để tạo prompt */}
                            <div className="rounded-xl border border-amber-300 bg-[var(--surface)] p-3.5 space-y-2.5">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                                  <MessageSquare className="size-3 text-amber-600" />
                                  4. Câu hỏi gợi mở (Để nhóm tự trả lời):
                                </span>
                                {guidingQuestions.map((q, qIdx) => (
                                  <p
                                    key={qIdx}
                                    className="text-xs text-[var(--ink)] font-semibold leading-relaxed"
                                  >
                                    • {q}
                                  </p>
                                ))}
                              </div>

                              <div>
                                <textarea
                                  rows={2}
                                  value={inCardAnswers[gap.id] || ""}
                                  onChange={(e) =>
                                    setInCardAnswers((prev) => ({
                                      ...prev,
                                      [gap.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Điền dữ liệu thật của nhóm bạn vào đây (vd: đã phỏng vấn 12 người, 8 người kêu giá quá 50k không mua...)"
                                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] leading-relaxed"
                                />
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setInCardAnswers((prev) => ({
                                      ...prev,
                                      [gap.id]: "[CẦN DỮ LIỆU]",
                                    }));
                                  }}
                                  className="text-[11px] text-[var(--muted)] hover:text-amber-600 font-medium underline"
                                >
                                  Chưa có số liệu (Ghi [CẦN DỮ LIỆU])
                                </button>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenSelfFixId(isSelfFixOpen ? null : gap.id)
                                    }
                                    className="text-[11px] text-[var(--muted)] hover:text-[var(--ink)] font-semibold px-2 py-1 rounded"
                                  >
                                    Tự sửa {isSelfFixOpen ? "▲" : "▼"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleGeneratePromptFromAnswer(gap.id, gap.name || gap.id)
                                    }
                                    disabled={
                                      submittingGapPromptId === gap.id ||
                                      !(inCardAnswers[gap.id] || "").trim()
                                    }
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 disabled:opacity-40 transition-opacity shadow-xs"
                                    title={
                                      !(inCardAnswers[gap.id] || "").trim()
                                        ? "Chỉ bật khi sinh viên đã điền câu trả lời gợi mở (Không làm thay)"
                                        : "Tạo prompt chuẩn mang dữ liệu thật của bạn sang ChatGPT"
                                    }
                                  >
                                    {submittingGapPromptId === gap.id ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <Wand2 className="size-3" />
                                    )}
                                    Tạo prompt từ câu trả lời của tôi
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Self-fix checklist expansion */}
                            {isSelfFixOpen && (
                              <div className="rounded-xl border border-[var(--line-2)] bg-[var(--surface-2)] p-3 text-xs space-y-2 animate-in fade-in duration-150">
                                <span className="font-bold text-[11px] text-[var(--muted)] uppercase block">
                                  Checklist tự sửa (không dùng ChatGPT):
                                </span>
                                <ul className="space-y-1.5 text-[var(--ink)] text-[11px]">
                                  <li className="flex items-center gap-2">
                                    <Check className="size-3.5 text-emerald-500" />
                                    <span>Bổ sung số liệu hoặc câu chuyện thật của nhóm vào đoạn gạch chân vàng.</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <Check className="size-3.5 text-emerald-500" />
                                    <span>Giải quyết đúng lý do bị trừ điểm ở mục 3 (Vì sao quan trọng).</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <Check className="size-3.5 text-emerald-500" />
                                    <span>Giữ nguyên các câu ở mục "Giữ nguyên" (đã khóa bên dưới).</span>
                                  </li>
                                  <li className="flex items-center gap-2">
                                    <Check className="size-3.5 text-emerald-500" />
                                    <span>Sau khi sửa xong trong ô văn bản, bấm "Chấm theo mục tiêu này" lại để xem điểm tăng.</span>
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

      {/* Onboarding Modal (3-4 màn giới thiệu quy trình mới, có thể bỏ qua) */}
      {showOnboarding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent)]">
                Hướng dẫn quy trình mới · Bước {onboardingStep + 1}/4
              </span>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("ra_guided_onboarding_seen", "true");
                  setShowOnboarding(false);
                }}
                className="text-xs text-[var(--muted)] hover:text-[var(--ink)] font-semibold"
              >
                Bỏ qua
              </button>
            </div>

            {/* Step content */}
            {onboardingStep === 0 && (
              <div className="space-y-3">
                <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-lg">
                  1
                </div>
                <h3 className="text-base font-serif font-bold text-[var(--ink)]">
                  Chọn mức điểm bạn muốn đạt
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Bạn có thể chọn <strong>Qua môn</strong>, <strong>Khá (7–8)</strong>, hoặc <strong>Xuất sắc (9–10)</strong>. RootAccess chỉ chỉ ra đúng những chỗ cần sửa để đạt mức điểm bạn chọn, không làm ngợp bạn với hàng tá góp ý thừa.
                </p>
              </div>
            )}

            {onboardingStep === 1 && (
              <div className="space-y-3">
                <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-lg">
                  2
                </div>
                <h3 className="text-base font-serif font-bold text-[var(--ink)]">
                  Thu thập dữ liệu thật · Chống AI bịa số
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Ở Bước 1, bạn trả lời nhanh 2–4 câu hỏi về dự án. Prompt sẽ dùng chính thông tin thật này để gửi ChatGPT, khóa chặt ngách của nhóm bạn và ngăn ChatGPT tự bịa số liệu ảo.
                </p>
              </div>
            )}

            {onboardingStep === 2 && (
              <div className="space-y-3">
                <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-lg">
                  3
                </div>
                <h3 className="text-base font-serif font-bold text-[var(--ink)]">
                  Chấm theo rubric · Sửa có hướng dẫn
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Dán câu trả lời từ ChatGPT vào Bước 2. Tool sẽ chỉ ra: <strong>Chỗ nào yếu</strong> (gạch chân vàng), <strong>Thiếu gì</strong> theo rubric, <strong>Vì sao quan trọng</strong> (thầy cô trừ điểm ở đâu), và <strong>Câu hỏi gợi mở</strong> để bạn tự suy nghĩ.
                </p>
              </div>
            )}

            {onboardingStep === 3 && (
              <div className="space-y-3">
                <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-lg">
                  4
                </div>
                <h3 className="text-base font-serif font-bold text-[var(--ink)]">
                  Tự sửa & Xem "Bạn đã sửa gì"
                </h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Tool <strong>không sửa thay</strong> mà chỉ tạo prompt khi bạn đã điền câu trả lời gợi mở. Sau mỗi lần chấm lại, bạn sẽ thấy rõ bản so sánh: <em>bạn đã sửa gì và vì sao điểm thay đổi</em>.
                </p>
              </div>
            )}

            {/* Stepper dots & buttons */}
            <div className="pt-3 border-t border-[var(--line-2)] flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`size-2 rounded-full transition-all ${
                      step === onboardingStep ? "w-6 bg-[var(--accent)]" : "bg-[var(--line)]"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                {onboardingStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setOnboardingStep((s) => s - 1)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--line)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--sunken)]"
                  >
                    Quay lại
                  </button>
                )}

                {onboardingStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setOnboardingStep((s) => s + 1)}
                    className="px-4 py-1.5 rounded-lg bg-[var(--ink)] text-white text-xs font-bold hover:bg-black"
                  >
                    Tiếp tục
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem("ra_guided_onboarding_seen", "true");
                      setShowOnboarding(false);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 shadow-xs"
                  >
                    Bắt đầu ngay
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Cross-Check Proposal Modal */}
      {showFullCheckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3 border-b border-[var(--line-2)] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Kiểm tra chéo toàn bộ Proposal · 4 phần
                </span>
                <h3 className="text-base font-serif font-bold text-[var(--ink)] mt-0.5">
                  Phát hiện mâu thuẫn giữa các phần
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  Chỉ ra các mâu thuẫn (nhóm khách hàng, số liệu khảo sát, giá), trích dẫn cả hai phía để nhóm tự quyết định, không sửa thay.
                </p>
              </div>
              <button
                onClick={() => setShowFullCheckModal(false)}
                className="text-[var(--muted)] hover:text-[var(--ink)] p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {isRunningFullCheck ? (
                <div className="py-12 text-center text-xs text-[var(--muted)] flex flex-col items-center justify-center gap-3">
                  <Loader2 className="size-6 animate-spin text-[var(--accent)]" />
                  <p className="font-semibold text-[var(--ink)]">
                    Đang đối chiếu chéo nội dung giữa các phần đã lưu...
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    Kiểm tra sự đồng nhất về đối tượng khách hàng, số liệu phỏng vấn và mô hình giá.
                  </p>
                </div>
              ) : fullCheckResult ? (
                <div className="space-y-4">
                  {/* Conflicting issues */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase text-[var(--ink)] flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-500" />
                      Các điểm mâu thuẫn phát hiện ({fullCheckResult.issues?.length || 0})
                    </h4>

                    {(!fullCheckResult.issues || fullCheckResult.issues.length === 0) && (
                      <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 dark:bg-emerald-950/20 p-4 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span>Tuyệt vời! Không phát hiện mâu thuẫn lớn giữa các phần đã lưu.</span>
                      </div>
                    )}

                    {fullCheckResult.issues?.map((issue: any, iIdx: number) => (
                      <div
                        key={iIdx}
                        className="rounded-xl border border-amber-300/80 bg-amber-50/40 dark:bg-amber-950/20 p-4 space-y-2.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[var(--ink)] text-xs">
                            {iIdx + 1}. {issue.title || "Mâu thuẫn dữ liệu"}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              issue.severity === "high"
                                ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            }`}
                          >
                            Mức độ {issue.severity || "vừa"}
                          </span>
                        </div>

                        <p className="text-[var(--ink)] leading-relaxed font-medium">
                          {issue.description}
                        </p>

                        {(issue.quote_a || issue.quote_b) && (
                          <div className="grid sm:grid-cols-2 gap-2 pt-1">
                            {issue.quote_a && (
                              <div className="rounded-lg bg-white/70 dark:bg-neutral-900/70 p-2 border border-[var(--line-2)] space-y-1">
                                <span className="text-[10px] font-bold text-[var(--muted)] uppercase">
                                  Trích dẫn phía 1:
                                </span>
                                <p className="font-mono text-[11px] text-[var(--ink)] italic">
                                  "{issue.quote_a}"
                                </p>
                              </div>
                            )}
                            {issue.quote_b && (
                              <div className="rounded-lg bg-white/70 dark:bg-neutral-900/70 p-2 border border-[var(--line-2)] space-y-1">
                                <span className="text-[10px] font-bold text-[var(--muted)] uppercase">
                                  Trích dẫn phía 2:
                                </span>
                                <p className="font-mono text-[11px] text-[var(--ink)] italic">
                                  "{issue.quote_b}"
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {issue.suggested_fix && (
                          <div className="rounded-lg bg-amber-100/50 dark:bg-amber-900/30 p-2.5 text-[11px] text-amber-950 dark:text-amber-200">
                            <strong>Câu hỏi cho nhóm: </strong>
                            {issue.suggested_fix}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Council Questions */}
                  {fullCheckResult.council_questions &&
                    fullCheckResult.council_questions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-[var(--line-2)]">
                        <h4 className="text-xs font-bold uppercase text-[var(--ink)] flex items-center gap-2">
                          <MessageSquare className="size-4 text-blue-500" />
                          Câu hỏi phản biện dự kiến từ Hội đồng (OC1)
                        </h4>
                        <div className="space-y-1.5">
                          {fullCheckResult.council_questions.map((cq: string, cqIdx: number) => (
                            <div
                              key={cqIdx}
                              className="rounded-lg bg-[var(--surface-2)] p-2.5 text-xs text-[var(--ink)] font-medium"
                            >
                              • {cq}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>
              ) : null}
            </div>

            <div className="pt-3 border-t border-[var(--line-2)] flex justify-end">
              <button
                type="button"
                onClick={() => setShowFullCheckModal(false)}
                className="px-4 py-2 rounded-xl bg-[var(--ink)] text-white text-xs font-bold hover:bg-black"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
