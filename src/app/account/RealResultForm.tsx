"use client";

import { useState } from "react";
import { Check, Loader2, Send } from "lucide-react";

export function RealResultForm({
  projects,
}: {
  projects: Array<{ id: string; name: string }>;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id || "");
  const [checkpoint, setCheckpoint] = useState("Checkpoint 2");
  const [lecturerFeedback, setLecturerFeedback] = useState("");
  const [actualScore, setActualScore] = useState("");
  const [questionsText, setQuestionsText] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !lecturerFeedback.trim()) {
      alert("Vui lòng chọn dự án và nhập nhận xét của giảng viên.");
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const questionsList = questionsText
      .split("\n")
      .map((q) => q.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/real-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          checkpoint,
          lecturer_feedback: lecturerFeedback.trim(),
          actual_score: actualScore ? Number(actualScore) : null,
          questions_asked: questionsList,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Gửi phản hồi thất bại");
      }

      setSuccess(true);
      setLecturerFeedback("");
      setActualScore("");
      setQuestionsText("");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Gửi kết quả thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (projects.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        (Bạn cần tạo ít nhất một dự án trong Extension để gửi kết quả đối chiếu)
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <Check size={16} /> Đã lưu kết quả checkpoint thật thành công! Cảm ơn bạn đã đóng góp.
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Chọn dự án
          </label>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Giai đoạn Checkpoint
          </label>
          <input
            type="text"
            value={checkpoint}
            onChange={(e) => setCheckpoint(e.target.value)}
            placeholder="VD: Checkpoint 2"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-foreground mb-1">
            Nhận xét thật từ giảng viên môn EXE <span className="text-red-400">*</span>
          </label>
          <textarea
            value={lecturerFeedback}
            onChange={(e) => setLecturerFeedback(e.target.value)}
            rows={3}
            placeholder="Thầy/cô khen hoặc chê ở những điểm nào? (ví dụ: thiếu số liệu thị trường, giải pháp chưa rõ UVP...)"
            className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            Điểm thật (nếu có)
          </label>
          <input
            type="number"
            step="0.1"
            value={actualScore}
            onChange={(e) => setActualScore(e.target.value)}
            placeholder="VD: 8.5"
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Thang điểm 10 theo hội đồng.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground mb-1">
          Các câu hỏi giảng viên / hội đồng đã hỏi nhóm (mỗi câu 1 dòng):
        </label>
        <textarea
          value={questionsText}
          onChange={(e) => setQuestionsText(e.target.value)}
          rows={2}
          placeholder="VD: Nhóm định cạnh tranh thế nào với đối thủ X?&#10;Chi phí acquisition 1 khách hàng là bao nhiêu?"
          className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="animate-spin size-4" /> : <Send size={14} />}
          Gửi kết quả đối chiếu
        </button>
      </div>
    </form>
  );
}
