"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  MessageSquareQuote,
  Plus,
  Quote,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

export interface FieldEvidenceItem {
  id: string;
  projectId: string;
  sectionId: string;
  intervieweeName: string;
  intervieweeRole: string;
  context: string;
  directQuote: string;
  keyInsight: string;
  evidenceLink?: string | null;
  createdAt?: string | Date;
}

interface FieldEvidenceVaultProps {
  projectId: string;
  sectionId: string;
  evidence: FieldEvidenceItem[];
  onEvidenceChange: (items: FieldEvidenceItem[]) => void;
  onInsertQuote?: (quote: string, author: string) => void;
}

export function FieldEvidenceVault({
  projectId,
  sectionId,
  evidence,
  onEvidenceChange,
  onInsertQuote,
}: FieldEvidenceVaultProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [context, setContext] = useState("");
  const [quote, setQuote] = useState("");
  const [insight, setInsight] = useState("");
  const [link, setLink] = useState("");

  const sectionEvidence = evidence.filter(
    (e) => !e.sectionId || e.sectionId === sectionId || e.sectionId === "all",
  );
  const totalCount = evidence.length;

  const scoreLevel =
    totalCount >= 5 ? "excellent" : totalCount >= 3 ? "good" : "low";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !quote.trim()) {
      setErrorMsg("Vui lòng nhập tên người được hỏi và câu trích dẫn nguyên văn.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      const res = await fetch(`/api/projects/${projectId}/evidence`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          intervieweeName: name.trim(),
          intervieweeRole: role.trim() || "Khách hàng mục tiêu",
          context: context.trim() || "Khảo sát thực địa",
          directQuote: quote.trim(),
          keyInsight: insight.trim() || quote.trim(),
          evidenceLink: link.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu bằng chứng");
      }

      onEvidenceChange([data.evidence, ...evidence]);
      setName("");
      setRole("");
      setContext("");
      setQuote("");
      setInsight("");
      setLink("");
      setShowAddModal(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Đã xảy ra lỗi");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (evidenceId: string) => {
    if (!confirm("Bạn có chắc muốn xóa bằng chứng phỏng vấn này?")) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/evidence/${evidenceId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onEvidenceChange(evidence.filter((e) => e.id !== evidenceId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Evidence Health Bar */}
      <div className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span className="text-xs font-bold text-[var(--ink)]">
              Chỉ số Bằng chứng Thực địa (Proof-of-Work)
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
              scoreLevel === "excellent"
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                : scoreLevel === "good"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            }`}
          >
            {totalCount >= 5
              ? "✓ Rất vững chắc (5+ cuộc)"
              : totalCount >= 3
                ? "⊖ Đạt chuẩn tối thiểu (3-4 cuộc)"
                : "⊗ Thiếu bằng chứng (<3 cuộc)"}
          </span>
        </div>

        {/* Progress meter */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-[var(--muted)]">
            <span>Tiến độ thu thập thực tế</span>
            <span className="font-semibold text-[var(--ink)]">{totalCount}/5 cuộc phỏng vấn</span>
          </div>
          <div className="w-full h-2 rounded-full bg-[var(--line-2)] overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                totalCount >= 5
                  ? "bg-emerald-500"
                  : totalCount >= 3
                    ? "bg-blue-500"
                    : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, (totalCount / 5) * 100)}%` }}
            />
          </div>
        </div>

        <p className="text-[11px] text-[var(--muted)] leading-relaxed">
          {totalCount >= 5
            ? "Tuyệt vời! Nhóm đã có đủ số liệu người thật việc thật để bảo vệ tự tin trước Hội đồng phản biện."
            : totalCount >= 3
              ? "Nhóm đã có phỏng vấn cơ bản. Nên bổ sung thêm 1–2 trích dẫn sâu sắc để đạt mức điểm Xuất sắc."
              : "Cảnh báo: Hội đồng EXE101 sẽ trừ điểm nếu đề án không có người thật phỏng vấn. Hãy đi hỏi ít nhất 3 người ngay!"}
        </p>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 w-full justify-center px-3 py-2 rounded-lg bg-[var(--ink)] text-white text-xs font-semibold hover:bg-black transition-colors shadow-xs"
        >
          <Plus className="size-3.5" />
          Thêm cuộc phỏng vấn khách hàng mới
        </button>
      </div>

      {/* List of Evidence Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-[var(--ink)] px-1">
          <span>Nhật ký phỏng vấn thực tế ({sectionEvidence.length})</span>
          {sectionEvidence.length > 0 && (
            <span className="text-[11px] font-normal text-[var(--muted)]">
              Bấm để chèn trích dẫn vào bài
            </span>
          )}
        </div>

        {sectionEvidence.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--line-2)] p-6 text-center space-y-2">
            <Users className="size-8 mx-auto text-[var(--muted)] opacity-60" />
            <p className="text-xs font-bold text-[var(--ink)]">Chưa có nhật ký phỏng vấn nào</p>
            <p className="text-[11px] text-[var(--muted)] max-w-sm mx-auto leading-relaxed">
              Bạn chỉ cần nói chuyện nhanh 5 phút với 1 khách hàng trong ngách, ghi lại câu nói thật của họ rồi dán vào đây.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sectionEvidence.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3.5 space-y-2.5 shadow-2xs hover:border-[var(--accent)] transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-xs text-[var(--ink)]">
                      {item.intervieweeName}
                    </span>
                    <span className="text-[11px] text-[var(--muted)] ml-2">
                      ({item.intervieweeRole})
                    </span>
                    <div className="text-[10px] text-[var(--muted)]">
                      📍 {item.context}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[var(--muted)] hover:text-red-600 transition-opacity"
                    title="Xóa bằng chứng này"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>

                {/* Direct Quote Box */}
                <div className="relative rounded-lg bg-[var(--surface-2)] p-2.5 text-xs text-[var(--ink)] italic border-l-2 border-[var(--accent)] space-y-1">
                  <p className="text-[11px] font-medium leading-relaxed">
                    "{item.directQuote}"
                  </p>
                  {item.keyInsight && item.keyInsight !== item.directQuote && (
                    <p className="text-[10px] not-italic text-[var(--muted)] font-sans border-t border-[var(--line-2)] pt-1">
                      💡 <strong>Rút ra:</strong> {item.keyInsight}
                    </p>
                  )}
                </div>

                {/* Card Action */}
                <div className="flex items-center justify-between pt-1">
                  {item.evidenceLink ? (
                    <a
                      href={item.evidenceLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      Xem minh chứng ảnh/ghi âm
                    </a>
                  ) : (
                    <span />
                  )}

                  {onInsertQuote && (
                    <button
                      type="button"
                      onClick={() =>
                        onInsertQuote(item.directQuote, `${item.intervieweeName} (${item.intervieweeRole})`)
                      }
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--accent)] hover:underline"
                    >
                      <MessageSquareQuote className="size-3" />
                      Trích dẫn vào bài
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[var(--line-2)] pb-3">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-[var(--accent)]" />
                <h3 className="font-bold text-sm text-[var(--ink)]">
                  Ghi nhận cuộc phỏng vấn thực tế
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-xs text-[var(--muted)] hover:text-[var(--ink)]"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-600">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">
                  1. Tên / Biệt danh người được hỏi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Vd: Bạn Hoàng Anh, hoặc Chị Lan (chủ quán cơm)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">
                  2. Phân khúc / Đặc điểm của họ
                </label>
                <input
                  type="text"
                  placeholder="Vd: Sinh viên năm 4 Bách Khoa đang làm đồ án tốt nghiệp"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">
                  3. Bối cảnh gặp & phỏng vấn
                </label>
                <input
                  type="text"
                  placeholder="Vd: Gặp trực tiếp tại KTX khu B lúc 20h sau khi bạn tan làm"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">
                  4. Câu nói nguyên văn ấn tượng nhất (Direct Quote) *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Ghi lại chính xác câu nói của họ, ví dụ: 'Nhiều hôm deadline gấp quá, mình đành ăn tạm mì gói 4 ngày liền vì không có thời gian tự nấu...'"
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">
                  5. Nhóm rút ra phát hiện (insight) gì từ câu này?
                </label>
                <input
                  type="text"
                  placeholder="Vd: Nỗi đau không phải thiếu tiền ăn, mà là thiếu thời gian sơ chế dưới 15 phút"
                  value={insight}
                  onChange={(e) => setInsight(e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="font-semibold text-[var(--ink)] block mb-1">
                  6. Link ảnh chụp hoặc ghi âm (Tùy chọn)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs focus:outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--line-2)]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg border border-[var(--line)] text-xs font-semibold hover:bg-[var(--surface-2)]"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Đang lưu..." : "Lưu vào sổ tay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

