"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  FileCheck,
  HelpCircle,
  Loader2,
  Lock,
  MessageSquare,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from "lucide-react";

interface CriterionOverview {
  id: string;
  name: string;
  level: "CHUA_DAT" | "DAT" | "TOT" | null;
  reason: string | null;
}

interface SectionOverview {
  id: string;
  title: string;
  order: number;
  requirement?: string;
  status: "todo" | "drafting" | "passed";
  saved_text: string | null;
  chat_url: string | null;
  grades_count: number;
  latest_grade: any | null;
  criteria: CriterionOverview[];
}

interface TaskItem {
  id: string;
  sectionId?: string | null;
  title: string;
  source: string;
  done: boolean;
  createdAt: string;
}

interface MemberItem {
  userId: string;
  role: "owner" | "member";
  joinedAt: string;
  displayName: string | null;
  email: string | null;
}

interface TeamPassInfo {
  id: string;
  grade_cap: number;
  grades_used: number;
  full_check_cap: number;
  full_checks_used: number;
  ends_at: string;
}

interface HubData {
  project: {
    id: string;
    name: string;
    one_liner: string;
    niche: string;
    domain: string;
    observed_problem?: string;
    biggest_assumption?: string;
    team_strengths?: string[];
    constraints?: string[];
    pack_id: string;
    created_via?: string;
    is_owner: boolean;
  };
  pack: {
    id: string;
    checkpoint: string;
    course: string;
    term: string;
    days_left: number;
  };
  sections: SectionOverview[];
  tasks: TaskItem[];
  members: MemberItem[];
  team_pass: TeamPassInfo | null;
  next_section_id: string;
  can_full_check: boolean;
  saved_count: number;
  total_sections: number;
}

export function ProjectHubView({ initialData }: { initialData: HubData }) {
  const [data, setData] = useState<HubData>(initialData);
  const [selectedSavedSection, setSelectedSavedSection] = useState<SectionOverview | null>(null);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isBuyingTeamPass, setIsBuyingTeamPass] = useState(false);
  const [isCheckingFull, setIsCheckingFull] = useState(false);
  const [fullCheckResult, setFullCheckResult] = useState<any | null>(null);
  const [fullCheckError, setFullCheckError] = useState<string | null>(null);

  // Task state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Edit card form
  const [cardForm, setCardForm] = useState({
    name: data.project.name,
    one_liner: data.project.one_liner || "",
    niche: data.project.niche || "",
    observed_problem: data.project.observed_problem || "",
    biggest_assumption: data.project.biggest_assumption || "",
  });
  const [isSavingCard, setIsSavingCard] = useState(false);

  const reloadData = async () => {
    try {
      const res = await fetch(`/api/projects/${data.project.id}/overview`);
      if (res.ok) {
        const updated = await res.json();
        setData(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (taskId: string, currentDone: boolean) => {
    try {
      // Optimistic update
      setData((prev) => ({
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, done: !currentDone } : t)),
      }));

      await fetch(`/api/projects/${data.project.id}/tasks`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, done: !currentDone }),
      });
    } catch (err) {
      console.error(err);
      reloadData();
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setIsAddingTask(true);
    try {
      const res = await fetch(`/api/projects/${data.project.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTaskTitle.trim() }),
      });
      if (res.ok) {
        const newTask = await res.json();
        setData((prev) => ({
          ...prev,
          tasks: [newTask, ...prev.tasks],
        }));
        setNewTaskTitle("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingTask(false);
    }
  };

  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCard(true);
    try {
      const res = await fetch(`/api/projects/${data.project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cardForm),
      });
      if (res.ok) {
        setIsEditingCard(false);
        reloadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingCard(false);
    }
  };

  const handleCreateInvite = async () => {
    try {
      const res = await fetch(`/api/projects/${data.project.id}/invites`, {
        method: "POST",
      });
      if (res.ok) {
        const body = await res.json();
        setInviteUrl(body.invite_url);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunFullCheck = async () => {
    setIsCheckingFull(true);
    setFullCheckError(null);
    try {
      const res = await fetch(`/api/projects/${data.project.id}/full-check`, {
        method: "POST",
      });
      const resData = await res.json();
      if (!res.ok) {
        setFullCheckError(resData.message || resData.error || "Không thể kiểm tra proposal.");
      } else {
        setFullCheckResult(resData.result);
      }
    } catch (err: any) {
      setFullCheckError(err.message || "Lỗi kết nối.");
    } finally {
      setIsCheckingFull(false);
    }
  };

  const handleBuyTeamPass = async (plan: "trial" | "full") => {
    try {
      const res = await fetch(`/api/projects/${data.project.id}/team-pass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          pack_id: data.pack.id,
        }),
      });
      if (res.ok) {
        setIsBuyingTeamPass(false);
        reloadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const nextSection =
    data.sections?.find((s) => s.id === data.next_section_id) ||
    data.sections?.[0] || { id: "problem", title: "Vấn đề" };

  return (
    <div className="space-y-8">
      {/* 1. Header (Spec 9.3) */}
      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--muted)]">
              <span className="px-2 py-0.5 rounded bg-[var(--sunken)] text-[var(--ink)] font-mono">
                {data.pack.course} · {data.pack.checkpoint.toUpperCase()}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1 text-[var(--mid)] font-medium">
                <Clock className="size-3.5" />
                Còn {data.pack.days_left} ngày
              </span>
            </div>

            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 className="text-3xl font-serif font-bold text-[var(--ink)]">
                {data.project.name}
              </h1>
              <button
                onClick={() => setIsEditingCard(true)}
                className="text-xs text-[var(--accent)] hover:underline inline-flex items-center gap-1 font-medium"
              >
                <Edit3 className="size-3" />
                Sửa thẻ dự án
              </button>
            </div>

            <p className="text-sm text-[var(--ink-2)] leading-relaxed">
              {data.project.one_liner || "Chưa có mô tả ngắn"}
            </p>

            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-[var(--muted)] font-medium">Ngách đầu tiên:</span>
              <span className="px-2.5 py-1 rounded-md bg-[var(--mark)] text-[var(--ink)] font-semibold border border-amber-300">
                {data.project.niche || "Chưa chọn ngách"}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="shrink-0 flex flex-col gap-2">
            <Link
              href={`/app/projects/${data.project.id}/write/${nextSection.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[var(--accent)] text-white font-semibold text-sm hover:opacity-90 shadow transition-all"
            >
              <span>Viết tiếp: {nextSection.title}</span>
              <ArrowRight className="size-4" />
            </Link>
            <span className="text-center text-[2xs] text-[var(--muted)]">
              Chấm từng câu chuẩn rubric môn EXE
            </span>
          </div>
        </div>
      </section>

      {/* Main Grid: Sections List (Left) + Tasks/Team (Right) */}
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left Column: Sections & Full Check */}
        <div className="space-y-6">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-4 mb-5">
              <h2 className="font-serif font-bold text-lg text-[var(--ink)]">
                Các phần của {data.pack.checkpoint}
              </h2>
              <span className="text-xs text-[var(--muted)] font-mono">
                {data.saved_count}/{data.total_sections} đã lưu
              </span>
            </div>

            {/* Sections List */}
            <div className="space-y-4">
              {data.sections.map((section, idx) => {
                const isPassed = section.status === "passed" || Boolean(section.saved_text);
                const hasGrade = Boolean(section.latest_grade);

                return (
                  <div
                    key={section.id}
                    className="rounded-xl border border-[var(--line-2)] bg-[var(--surface-2)] p-4 sm:p-5 transition-all hover:border-[var(--line)]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      {/* Left: Number/Check + Title + Criteria */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`flex size-7 items-center justify-center rounded-full text-xs font-bold ${
                              isPassed
                                ? "bg-[var(--ok-bg)] text-[var(--ok)]"
                                : "bg-[var(--sunken)] text-[var(--muted)]"
                            }`}
                          >
                            {isPassed ? <Check className="size-4" /> : idx + 1}
                          </span>
                          <h3 className="font-bold text-base text-[var(--ink)]">
                            {section.title}
                          </h3>
                        </div>

                        {/* Criteria Levels */}
                        <div className="flex items-center gap-2 flex-wrap pl-10 text-xs">
                          {section.criteria.map((c) => {
                            if (c.level === "TOT") {
                              return (
                                <span
                                  key={c.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium bg-[var(--ok-bg)] text-[var(--ok)] text-[2xs]"
                                >
                                  ✓ {c.name}
                                </span>
                              );
                            }
                            if (c.level === "DAT") {
                              return (
                                <span
                                  key={c.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium bg-[var(--mid-bg)] text-[var(--mid)] text-[2xs]"
                                >
                                  ⊖ {c.name}
                                </span>
                              );
                            }
                            if (c.level === "CHUA_DAT") {
                              return (
                                <span
                                  key={c.id}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium bg-[var(--bad-bg)] text-[var(--bad)] text-[2xs]"
                                >
                                  ⊗ {c.name}
                                </span>
                              );
                            }
                            return (
                              <span
                                key={c.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium bg-[var(--sunken)] text-[var(--muted)] text-[2xs]"
                              >
                                {c.name}
                              </span>
                            );
                          })}
                        </div>

                        {/* Status Note */}
                        <div className="pl-10 text-xs text-[var(--muted)]">
                          {isPassed ? (
                            <span className="text-[var(--ok)] font-medium">
                              Đã lưu · lần chấm {section.grades_count}
                            </span>
                          ) : hasGrade ? (
                            <span className="text-[var(--mid)] font-medium">
                              Đang sửa · {section.grades_count} lần chấm
                            </span>
                          ) : (
                            <span>Chưa làm</span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                        {isPassed && (
                          <button
                            onClick={() => setSelectedSavedSection(section)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors"
                          >
                            <Eye className="size-3.5" />
                            Xem bản đã lưu
                          </button>
                        )}

                        {section.chat_url ? (
                          <a
                            href={section.chat_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-xs font-medium text-[var(--ink)] hover:bg-[var(--sunken)] transition-colors"
                          >
                            <span>ChatGPT</span>
                            <ExternalLink className="size-3" />
                          </a>
                        ) : null}

                        <Link
                          href={`/app/projects/${data.project.id}/write/${section.id}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[var(--accent)] text-xs font-semibold text-white hover:opacity-90 shadow-sm transition-all"
                        >
                          <Edit3 className="size-3.5" />
                          Viết trên web
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Proposal Full Check (Spec 9.5a) */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileCheck className="size-5 text-[var(--accent)]" />
                  <h3 className="font-serif font-bold text-base text-[var(--ink)]">
                    Kiểm tra toàn bộ proposal trước khi nộp
                  </h3>
                </div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Tìm chỗ các phần nói khác nhau: ngách, số liệu, giá cả. Mở khi đã lưu ít nhất 2 phần.
                </p>
              </div>

              <div>
                <button
                  disabled={!data.can_full_check || isCheckingFull}
                  onClick={handleRunFullCheck}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all ${
                    data.can_full_check
                      ? "bg-[var(--ink)] text-white hover:bg-black"
                      : "bg-[var(--sunken)] text-[var(--muted)] cursor-not-allowed"
                  }`}
                >
                  {isCheckingFull ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Đang rà soát bài...
                    </>
                  ) : !data.can_full_check ? (
                    <>
                      <Lock className="size-3.5" />
                      Cần lưu ít nhất 2 phần
                    </>
                  ) : data.team_pass ? (
                    "Kiểm tra · Miễn phí gói nhóm"
                  ) : (
                    "Kiểm tra · 5 credit"
                  )}
                </button>
              </div>
            </div>

            {fullCheckError && (
              <div className="rounded-lg bg-[var(--bad-bg)] p-3 text-xs text-[var(--bad)] border border-red-200">
                {fullCheckError}
              </div>
            )}

            {/* Full Check Result Report */}
            {fullCheckResult && (
              <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                    <ShieldAlert className="size-4 text-[var(--accent)]" />
                    Kết quả rà soát chéo toàn bộ đề án
                  </div>
                  <button
                    onClick={() => setFullCheckResult(null)}
                    className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
                  >
                    Đóng
                  </button>
                </div>

                <p className="text-xs text-[var(--ink-2)] leading-relaxed italic bg-[var(--surface)] p-3 rounded-lg border border-[var(--line-2)]">
                  {fullCheckResult.summary}
                </p>

                {/* Discrepancies */}
                {fullCheckResult.discrepancies?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--bad)] flex items-center gap-1.5">
                      <AlertTriangle className="size-3.5" />
                      Mâu thuẫn giữa các phần ({fullCheckResult.discrepancies.length})
                    </h4>
                    <div className="space-y-2">
                      {fullCheckResult.discrepancies.map((disc: any, i: number) => (
                        <div
                          key={i}
                          className="rounded-lg border border-red-200 bg-[var(--bad-bg)] p-3 text-xs space-y-1.5"
                        >
                          <p className="font-semibold text-[var(--bad)]">{disc.issue}</p>
                          <div className="grid grid-cols-2 gap-2 text-[2xs] text-[var(--ink-2)]">
                            <div className="bg-[var(--surface)] p-2 rounded border border-red-100">
                              <span className="font-bold block text-[var(--ink)]">
                                {disc.section_a}:
                              </span>
                              "{disc.quote_a}"
                            </div>
                            <div className="bg-[var(--surface)] p-2 rounded border border-red-100">
                              <span className="font-bold block text-[var(--ink)]">
                                {disc.section_b}:
                              </span>
                              "{disc.quote_b}"
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Niche Drifts */}
                {fullCheckResult.niche_drifts?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--mid)]">
                      Lệch ngách mục tiêu ({fullCheckResult.niche_drifts.length})
                    </h4>
                    <div className="space-y-2">
                      {fullCheckResult.niche_drifts.map((nd: any, i: number) => (
                        <div
                          key={i}
                          className="rounded-lg border border-amber-200 bg-[var(--mid-bg)] p-3 text-xs space-y-1"
                        >
                          <span className="font-bold text-[var(--ink)] block">
                            Phần: {nd.section_id}
                          </span>
                          <p className="text-[var(--mid)]">{nd.explanation}</p>
                          <blockquote className="italic text-[2xs] text-[var(--ink-2)] bg-[var(--surface)] p-2 rounded">
                            "{nd.quote}"
                          </blockquote>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Potential Jury Questions */}
                {fullCheckResult.potential_jury_questions?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] flex items-center gap-1.5">
                      <HelpCircle className="size-3.5 text-[var(--accent)]" />
                      5 câu hỏi hội đồng có thể sẽ hỏi
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-xs text-[var(--ink-2)] bg-[var(--surface)] p-3 rounded-lg border border-[var(--line-2)]">
                      {fullCheckResult.potential_jury_questions.map((q: string, i: number) => (
                        <li key={i} className="leading-relaxed">
                          {q}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Tasks & Team */}
        <div className="space-y-6">
          {/* Việc cần làm ngoài đời (Tasks) */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
              <h3 className="font-serif font-bold text-sm text-[var(--ink)] flex items-center gap-2">
                <CheckCircle2 className="size-4 text-[var(--accent)]" />
                Việc cần làm ngoài đời
              </h3>
              <span className="text-xs text-[var(--muted)] font-mono">
                {data.tasks.filter((t) => t.done).length}/{data.tasks.length}
              </span>
            </div>

            <p className="text-[2xs] text-[var(--muted)] leading-relaxed">
              Tạo tự động từ các câu "Chưa biết" và gợi ý của bộ chấm.
            </p>

            {/* Task Checklist */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {data.tasks.length === 0 ? (
                <div className="text-center py-4 text-xs text-[var(--muted)] italic">
                  Chưa có việc cần làm. Hãy bắt đầu hỏi nhanh hoặc chấm bài!
                </div>
              ) : (
                data.tasks.map((task) => (
                  <label
                    key={task.id}
                    className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-xs transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => handleToggleTask(task.id, task.done)}
                      className="mt-0.5 rounded border-[var(--line)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span
                      className={`leading-snug ${
                        task.done
                          ? "line-through text-[var(--muted)]"
                          : "text-[var(--ink)] font-medium"
                      }`}
                    >
                      {task.title}
                    </span>
                  </label>
                ))
              )}
            </div>

            {/* Quick Add Task */}
            <form onSubmit={handleAddTask} className="flex gap-2 pt-2 border-t border-[var(--line-2)]">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="+ Thêm việc cần làm..."
                className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-2.5 py-1.5 text-xs text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                type="submit"
                disabled={isAddingTask || !newTaskTitle.trim()}
                className="px-2.5 py-1.5 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold disabled:opacity-50"
              >
                Lưu
              </button>
            </form>
          </div>

          {/* Nhóm & Gói nhóm (Spec 9.5b & 9.5c) */}
          <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
              <h3 className="font-serif font-bold text-sm text-[var(--ink)] flex items-center gap-2">
                <Users className="size-4 text-[var(--accent)]" />
                Nhóm dự án ({data.members.length + 1})
              </h3>
              <button
                onClick={() => {
                  setIsInviting(true);
                  handleCreateInvite();
                }}
                className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline font-semibold"
              >
                <Plus className="size-3.5" />
                Mời
              </button>
            </div>

            {/* Members List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-[var(--surface-2)]">
                <div className="flex items-center gap-2">
                  <div className="size-6 rounded-full bg-[var(--accent-weak)] text-[var(--accent)] font-bold flex items-center justify-center text-[2xs]">
                    O
                  </div>
                  <span className="font-medium text-[var(--ink)]">Chủ dự án (Owner)</span>
                </div>
                <span className="text-[2xs] px-2 py-0.5 rounded bg-[var(--sunken)] text-[var(--muted)]">
                  Chủ nhóm
                </span>
              </div>

              {data.members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between text-xs p-2 rounded-lg bg-[var(--surface-2)]"
                >
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-[var(--sunken)] text-[var(--ink)] font-bold flex items-center justify-center text-[2xs]">
                      {m.displayName ? m.displayName.slice(0, 1).toUpperCase() : "M"}
                    </div>
                    <span className="font-medium text-[var(--ink)]">
                      {m.displayName || m.email || "Thành viên"}
                    </span>
                  </div>
                  <span className="text-[2xs] px-2 py-0.5 rounded bg-[var(--sunken)] text-[var(--muted)]">
                    {m.role === "owner" ? "Chủ" : "Thành viên"}
                  </span>
                </div>
              ))}
            </div>

            {/* Team Pass Widget */}
            <div className="pt-2 border-t border-[var(--line-2)] space-y-2">
              {data.team_pass ? (
                <div className="rounded-lg bg-[var(--ok-bg)] p-3 text-xs text-[var(--ok)] border border-green-200 space-y-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>Gói nhóm: Đang kích hoạt</span>
                    <span className="text-[2xs]">
                      {data.team_pass.grades_used}/{data.team_pass.grade_cap} lượt
                    </span>
                  </div>
                  <p className="text-[2xs] text-[var(--ink-2)]">
                    Cả nhóm chấm không trừ credit đến hết {data.pack.checkpoint}.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-[var(--accent-weak)] p-3 text-xs space-y-2 border border-purple-100">
                  <div>
                    <h4 className="font-bold text-[var(--accent)]">Gói nhóm theo Checkpoint</h4>
                    <p className="text-[2xs] text-[var(--ink-2)] mt-0.5">
                      Một người mua, cả nhóm chấm thoải mái không giới hạn đến hết kỳ.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsBuyingTeamPass(true)}
                    className="w-full py-1.5 rounded-md bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90 shadow-sm transition-opacity"
                  >
                    Xem gói nhóm
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Xem bản đã lưu (Spec 9.3) */}
      {selectedSavedSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
                  Bản đã lưu: {selectedSavedSection.title}
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Chỉ xem, không sửa trực tiếp trên bản này
                </p>
              </div>
              <button
                onClick={() => setSelectedSavedSection(null)}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--sunken)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto rounded-xl bg-[var(--surface-2)] p-4 text-sm text-[var(--ink)] font-mono whitespace-pre-wrap leading-relaxed border border-[var(--line-2)]">
              {selectedSavedSection.saved_text}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[var(--line-2)]">
              <Link
                href={`/app/projects/${data.project.id}/write/${selectedSavedSection.id}`}
                className="text-xs text-[var(--accent)] font-semibold hover:underline"
              >
                Mở để viết lại phần này →
              </Link>
              <button
                onClick={() => setSelectedSavedSection(null)}
                className="px-4 py-2 rounded-lg bg-[var(--ink)] text-white text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Sửa thẻ dự án */}
      {isEditingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
              <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
                Sửa thẻ dự án
              </h3>
              <button
                onClick={() => setIsEditingCard(false)}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--sunken)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">Tên dự án</label>
                <input
                  type="text"
                  value={cardForm.name}
                  onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs text-[var(--ink)]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">Mô tả 1 câu (One-liner)</label>
                <textarea
                  value={cardForm.one_liner}
                  onChange={(e) => setCardForm({ ...cardForm, one_liner: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs text-[var(--ink)]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">Ngách đầu tiên</label>
                <input
                  type="text"
                  value={cardForm.niche}
                  onChange={(e) => setCardForm({ ...cardForm, niche: e.target.value })}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs text-[var(--ink)]"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">Rắc rối quan sát được (observed problem)</label>
                <textarea
                  value={cardForm.observed_problem}
                  onChange={(e) => setCardForm({ ...cardForm, observed_problem: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs text-[var(--ink)]"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">Giả định lớn nhất</label>
                <input
                  type="text"
                  value={cardForm.biggest_assumption}
                  onChange={(e) => setCardForm({ ...cardForm, biggest_assumption: e.target.value })}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs text-[var(--ink)]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[var(--line-2)]">
                <button
                  type="button"
                  onClick={() => setIsEditingCard(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--line)] text-xs font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingCard}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:opacity-90"
                >
                  {isSavingCard ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mời thành viên */}
      {isInviting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
              <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
                Mời thành viên nhóm
              </h3>
              <button
                onClick={() => setIsInviting(false)}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--sunken)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--muted)] leading-relaxed">
              Gửi link này cho bạn cùng nhóm. Người nhận đăng nhập Google sẽ tự động gia nhập dự án với quyền thành viên (hết hạn sau 7 ngày).
            </p>

            {inviteUrl ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteUrl}
                  className="flex-1 rounded-lg border border-[var(--line)] bg-[var(--surface-2)] p-2 text-xs font-mono text-[var(--ink)]"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteUrl);
                    alert("Đã sao chép link mời!");
                  }}
                  className="p-2 rounded-lg bg-[var(--accent)] text-white text-xs font-medium flex items-center gap-1"
                >
                  <Copy className="size-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-4">
                <Loader2 className="size-6 animate-spin text-[var(--accent)] mx-auto" />
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setIsInviting(false)}
                className="px-4 py-2 rounded-lg bg-[var(--ink)] text-white text-xs font-semibold"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Gói nhóm theo Checkpoint (Spec 9.5b) */}
      {isBuyingTeamPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[var(--ink)]">
                  Gói nhóm {data.pack.checkpoint}
                </h3>
                <p className="text-xs text-[var(--muted)]">
                  Một người mua, cả nhóm dùng không giới hạn
                </p>
              </div>
              <button
                onClick={() => setIsBuyingTeamPass(false)}
                className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--sunken)]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--accent)] bg-[var(--accent-weak)] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--ink)]">Gói Chuẩn Pilot</span>
                  <span className="font-serif font-bold text-lg text-[var(--accent)]">49.000đ</span>
                </div>
                <ul className="text-xs text-[var(--ink-2)] space-y-1 list-disc list-inside">
                  <li>Tối đa 150 lượt chấm cho cả nhóm</li>
                  <li>3 lần kiểm tra toàn bộ proposal</li>
                  <li>Hiệu lực đến hết kỳ Checkpoint 2</li>
                </ul>
                <button
                  onClick={() => handleBuyTeamPass("trial")}
                  className="w-full mt-2 py-2 rounded-lg bg-[var(--accent)] text-white font-semibold text-xs shadow-sm hover:opacity-90"
                >
                  Kích hoạt gói 49k (Pilot)
                </button>
              </div>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[var(--ink)]">Gói Nâng Cao</span>
                  <span className="font-serif font-bold text-lg text-[var(--ink)]">79.000đ</span>
                </div>
                <ul className="text-xs text-[var(--muted)] space-y-1 list-disc list-inside">
                  <li>Không giới hạn lượt chấm cho mọi thành viên</li>
                  <li>10 lần kiểm tra toàn bộ proposal</li>
                  <li>Hỗ trợ ưu tiên khi nộp bài</li>
                </ul>
                <button
                  onClick={() => handleBuyTeamPass("full")}
                  className="w-full mt-2 py-2 rounded-lg bg-[var(--ink)] text-white font-semibold text-xs shadow-sm hover:opacity-90"
                >
                  Kích hoạt gói 79k (Full)
                </button>
              </div>
            </div>

            <p className="text-[2xs] text-[var(--muted)] text-center">
              Sau khi kích hoạt, toàn bộ thành viên trong nhóm sẽ thấy "Miễn phí với gói nhóm".
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
