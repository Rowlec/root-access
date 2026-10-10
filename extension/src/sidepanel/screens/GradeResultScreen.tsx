import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  History,
  Loader2,
  MessageSquare,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { api } from "../../lib/api";
import { readLastAnswerFromTab } from "../../lib/messages";
import { track } from "../../lib/tracking";
import { FixAction, GradeResult, Pack, Project, Section } from "../../lib/types";
import { CouncilQuestions } from "../components/CouncilQuestions";
import { CriterionRow } from "../components/CriterionRow";
import { FixActionCard } from "../components/FixActionCard";
import { WarningList } from "../components/WarningList";

export function GradeResultScreen({
  result,
  section,
  project,
  pack,
  siteId,
  creditsLeft,
  onBack,
  onSelectFixAction,
  onRegradeComplete,
  onOutOfCredits,
}: {
  result: GradeResult;
  section: Section;
  project: Project;
  pack: Pack;
  siteId: string;
  creditsLeft: number;
  onBack: () => void;
  onSelectFixAction: (action: FixAction) => void;
  onRegradeComplete: (newResult: GradeResult) => void;
  onOutOfCredits: () => void;
}) {
  const [regrading, setRegrading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showLecturerBox, setShowLecturerBox] = useState(false);
  const [lecturerFeedbackText, setLecturerFeedbackText] = useState("");
  const [analyzingFeedback, setAnalyzingFeedback] = useState(false);
  const [feedbackAnalysis, setFeedbackAnalysis] = useState<any>(null);

  const handleAnalyzeFeedback = async () => {
    if (!lecturerFeedbackText.trim()) return;
    setAnalyzingFeedback(true);
    try {
      const res = await api.analyzeLecturerFeedback(project.id, section.id, {
        feedback: lecturerFeedbackText.trim(),
      });
      setFeedbackAnalysis(res.analysis);
    } catch (err: any) {
      console.warn("Feedback analyze failed", err);
    } finally {
      setAnalyzingFeedback(false);
    }
  };

  // Trigger in-page quote highlights on mount (Spec 5.1)
  useEffect(() => {
    if (chrome?.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            type: "HIGHLIGHT_QUOTES",
            items: result.criteria,
          });
        }
      });
    }
  }, [result]);

  const passingCount = result.criteria.filter(
    (c) => c.level === "DAT" || c.level === "TOT",
  ).length;
  const totalCriteria = result.criteria.length;
  const isAllPassed = passingCount === totalCriteria && totalCriteria > 0;

  const handleRegrade = async () => {
    if (creditsLeft <= 0) {
      onOutOfCredits();
      return;
    }

    setRegrading(true);
    try {
      const answerRes = await readLastAnswerFromTab();
      if (!answerRes.ok || !answerRes.text) {
        alert("Không tìm thấy câu trả lời AI mới trên trang để chấm lại.");
        setRegrading(false);
        return;
      }

      const newResult = await api.gradeAnswer({
        project_id: project.id,
        section_id: section.id,
        output_text: answerRes.text,
        parent_grade_id: result.grade_id,
        site: siteId,
      });

      track("regrade_completed", {
        n_improved: newResult.compare_with_parent?.improved?.length ?? 0,
        n_worse: newResult.compare_with_parent?.worse?.length ?? 0,
      });

      onRegradeComplete(newResult);
    } catch (err: any) {
      if (err.code === "NO_CREDIT") {
        onOutOfCredits();
      } else {
        alert(err.message || "Chấm lại thất bại, vui lòng thử lại.");
      }
    } finally {
      setRegrading(false);
    }
  };

  const handleSaveSection = async () => {
    setSaving(true);
    try {
      let chatUrl: string | undefined = undefined;
      if (chrome?.tabs?.query) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tabs[0]?.url) {
          chatUrl = tabs[0].url;
        }
      }

      await api.saveSection(project.id, section.id, {
        savedText: result.output_text || "",
        gradeId: result.grade_id,
        status: isAllPassed ? "passed" : "drafting",
        chatUrl,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Lỗi lưu phần: " + (err.message || String(err)));
    } finally {
      setSaving(false);
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
          <ArrowLeft size={16} /> Danh sách phần
        </button>
        <span className="text-[11px] text-[var(--accent)] font-medium">
          {section.title}
        </span>
      </div>

      {/* Auto-read Notice */}
      <div className="flex items-center justify-between text-[11px] text-[var(--muted)] bg-[var(--surface-2)] px-3 py-2 rounded-xl border border-[var(--line-2)]">
        <span>💡 Tự đọc câu trả lời AI trên ChatGPT (không cần copy)</span>
        <span className="text-emerald-600 font-bold">Tự động</span>
      </div>

      {/* Compare with parent (Bạn đã sửa gì) */}
      {result.compare_with_parent && (
        <div className="rounded-xl border border-blue-300 bg-blue-50/70 dark:bg-blue-950/30 p-3 space-y-1.5 text-xs text-blue-950 dark:text-blue-100">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5">
              <History size={14} className="text-blue-600" />
              Bạn đã sửa gì sau khi chấm lại
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {(result.compare_with_parent.delta ?? 0) > 0
                ? `+${result.compare_with_parent.delta} Đạt`
                : "Điểm cập nhật"}
            </span>
          </div>
          {result.compare_with_parent.summary_reason && (
            <p className="text-[11px] leading-relaxed">
              {result.compare_with_parent.summary_reason}
            </p>
          )}
        </div>
      )}

      {/* Summary Card */}
      <div
        className={`rounded-2xl border p-4 space-y-2 ${
          isAllPassed
            ? "border-green-300 bg-[var(--ok-bg)] text-[var(--ok)]"
            : "border-[var(--line)] bg-[var(--surface-2)] text-[var(--ink)]"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2
              className={`size-5 ${
                isAllPassed ? "text-[var(--ok)]" : "text-[var(--accent)]"
              }`}
            />
            <h3 className="text-sm font-bold text-[var(--ink)]">
              {isAllPassed
                ? `Phần ${section.title} đã đạt!`
                : "Kết quả chấm bài theo Rubric"}
            </h3>
          </div>
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)]">
            {passingCount}/{totalCriteria} Đạt
          </span>
        </div>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          {isAllPassed
            ? "Không còn tiêu chí nào Chưa đạt. Bạn có thể bấm 'Lưu bản đạt' bên dưới để lưu vào hồ sơ đề án."
            : "Một số câu cần sửa theo gợi ý dưới đây để bài viết khớp ngách và số liệu hơn."}
        </p>
      </div>

      {/* Lecturer Feedback Collapsible Box */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 space-y-2 text-xs">
        <button
          type="button"
          onClick={() => setShowLecturerBox(!showLecturerBox)}
          className="w-full flex items-center justify-between text-xs font-bold text-[var(--ink)]"
        >
          <span className="flex items-center gap-1.5 text-purple-600">
            <Award size={14} />
            Nhận xét từ Giảng viên / Mentor
          </span>
          <span className="text-[11px] text-[var(--accent)] font-semibold">
            {showLecturerBox ? "Thu gọn" : "Mở ô dán"}
          </span>
        </button>

        {showLecturerBox && (
          <div className="space-y-2 pt-2 border-t border-[var(--line-2)] animate-in fade-in duration-150">
            <textarea
              rows={2}
              value={lecturerFeedbackText}
              onChange={(e) => setLecturerFeedbackText(e.target.value)}
              placeholder="Dán nhận xét của GV/Mentor..."
              className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs text-[var(--ink)]"
            />
            <button
              type="button"
              onClick={handleAnalyzeFeedback}
              disabled={analyzingFeedback || !lecturerFeedbackText.trim()}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
            >
              {analyzingFeedback ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              Phân tích & Hướng dẫn sửa
            </button>
            {feedbackAnalysis && (
              <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-[11px] text-purple-950 dark:text-purple-200 space-y-1 border border-purple-200">
                <p className="font-bold">Tiêu chí: {feedbackAnalysis.criterion_name}</p>
                <p>
                  <strong>Lý do trừ điểm:</strong> {feedbackAnalysis.why_important}
                </p>
                <p>
                  <strong>Gợi ý sửa:</strong> {feedbackAnalysis.guiding_questions?.[0]}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action: Lưu bản đạt / Lưu bản này (Spec Mục 5 & 9.4) */}
      <div className="flex gap-2">
        <button
          onClick={handleSaveSection}
          disabled={saving}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-sm ${
            isAllPassed
              ? "bg-[var(--ok-bg)] text-[var(--ok)] border border-green-400 hover:bg-green-100"
              : "bg-[var(--surface)] text-[var(--ink)] border border-[var(--line)] hover:bg-[var(--sunken)]"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin size-3.5" />
              Đang lưu...
            </>
          ) : saveSuccess ? (
            <>
              <Check className="size-3.5" />
              Đã lưu bản này vào đề án!
            </>
          ) : (
            <>
              <Save className="size-3.5" />
              {isAllPassed ? "Lưu bản đạt cho phần này" : "Lưu bản nháp này"}
            </>
          )}
        </button>
      </div>

      {/* Criteria Breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] px-1">
          Chi tiết từng tiêu chí
        </h4>
        <div className="space-y-2">
          {result.criteria.map((c) => (
            <CriterionRow key={c.id} criterion={c} />
          ))}
        </div>
      </div>

      {/* Warnings */}
      {result.warnings && result.warnings.length > 0 && (
        <WarningList warnings={result.warnings} />
      )}

      {/* Fix Actions */}
      {result.fix_actions && result.fix_actions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] px-1">
            Gợi ý hành động sửa
          </h4>
          <div className="space-y-2">
            {result.fix_actions.map((fa) => (
              <FixActionCard
                key={fa.id}
                action={fa}
                onSelect={(action) => onSelectFixAction(action)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Council Questions */}
      {result.likely_questions && result.likely_questions.length > 0 && (
        <CouncilQuestions questions={result.likely_questions} />
      )}

      {/* Regrade Button */}
      <div className="mt-auto pt-3 border-t border-[var(--line-2)] space-y-2">
        <button
          onClick={handleRegrade}
          disabled={regrading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-xs font-semibold text-white shadow hover:opacity-90 disabled:opacity-50"
        >
          {regrading ? (
            <Loader2 className="animate-spin size-4" />
          ) : (
            <RotateCcw size={15} />
          )}
          {regrading
            ? "Đang chấm lại..."
            : `Chấm lại câu trả lời mới · 1 credit`}
        </button>
      </div>
    </div>
  );
}
