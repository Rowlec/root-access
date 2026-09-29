import React, { useState } from "react";
import { AlertCircle, CheckCircle2, ChevronRight, PlusCircle, Sparkles } from "lucide-react";
import { api } from "../../lib/api";
import { Pack, Project } from "../../lib/types";

export function ProjectSetupScreen({
  packs,
  onProjectCreated,
  onCancel,
}: {
  packs: Pack[];
  onProjectCreated: (project: Project) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState("");
  const [idea, setIdea] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [surveyCount, setSurveyCount] = useState<number | "">("");
  const [interviewCount, setInterviewCount] = useState<number | "">("");
  const [keyFindings, setKeyFindings] = useState("");
  const [freeText, setFreeText] = useState("");
  const [packId, setPackId] = useState(packs[0]?.id || "exe101-cp2");

  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<Array<{ field: string; message: string }>>([]);
  const [showOverride, setShowOverride] = useState(false);

  const handleSubmit = async (force: boolean = false) => {
    if (!name.trim() || !idea.trim()) {
      alert("Vui lòng nhập tên dự án và ý tưởng.");
      return;
    }

    setLoading(true);

    try {
      const availableData = {
        surveyCount: surveyCount === "" ? 0 : Number(surveyCount),
        interviewCount: interviewCount === "" ? 0 : Number(interviewCount),
        keyFindings: keyFindings.trim(),
        freeText: freeText.trim(),
      };

      if (!force) {
        // Step 1: Validate input first (Mục 5.7 S2 & Mục 7.3)
        const valRes = await api.validateProject({
          idea,
          target_customer: targetCustomer,
          available_data: availableData,
        });

        if (valRes.issues && valRes.issues.length > 0) {
          setIssues(valRes.issues);
          setShowOverride(true);
          setLoading(false);
          return;
        }
      }

      // Step 2: Create project
      const created = await api.createProject({
        name: name.trim(),
        idea: idea.trim(),
        target_customer: targetCustomer.trim(),
        available_data: availableData,
        pack_id: packId,
      });

      onProjectCreated(created);
    } catch (err: any) {
      alert(err.message || "Không thể tạo dự án");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-y-auto p-4 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <PlusCircle size={18} className="text-blue-400" /> Hồ sơ dự án mới
          </h2>
          <p className="text-[11px] text-slate-400">
            Chỉ nhập một lần để AI cá nhân hóa prompt và rubric chấm bài.
          </p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white"
          >
            Đóng
          </button>
        )}
      </div>

      {issues.length > 0 && showOverride && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
            <AlertCircle size={15} /> Gợi ý hoàn thiện thông tin:
          </div>
          <ul className="list-disc pl-4 space-y-1 text-xs text-amber-200">
            {issues.map((iss, i) => (
              <li key={i}>{iss.message}</li>
            ))}
          </ul>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => setShowOverride(false)}
              className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/20"
            >
              Chỉnh sửa thêm
            </button>
            <button
              onClick={() => handleSubmit(true)}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
            >
              Vẫn lưu dự án
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Tên dự án <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="VD: Smart Dorm - Nền tảng chia sẻ đồ dùng KTX"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Ý tưởng dự án (2–3 câu) <span className="text-red-400">*</span>
          </label>
          <textarea
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            rows={3}
            placeholder="Làm gì, phục vụ ai, giải quyết chuyện gì... (tối thiểu 40 ký tự)"
            className="w-full rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Khách hàng mục tiêu
          </label>
          <input
            type="text"
            value={targetCustomer}
            onChange={(e) => setTargetCustomer(e.target.value)}
            placeholder="VD: Sinh viên năm 1-2 tại KTX khu Hòa Lạc, sống xa nhà"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2.5">
          <label className="block text-xs font-semibold text-slate-200">
            Dữ liệu nhóm đã có thực tế (nếu có):
          </label>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] text-slate-400">Số người khảo sát:</span>
              <input
                type="number"
                value={surveyCount}
                onChange={(e) => setSurveyCount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Số người phỏng vấn:</span>
              <input
                type="number"
                value={interviewCount}
                onChange={(e) => setInterviewCount(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <span className="text-[11px] text-slate-400">Kết quả chính quan sát được:</span>
            <input
              type="text"
              value={keyFindings}
              onChange={(e) => setKeyFindings(e.target.value)}
              placeholder="VD: 72% sinh viên muốn mượn bàn là thay vì mua mới"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <span className="text-[11px] text-slate-400">Ghi chú hoặc dữ liệu tự do:</span>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              rows={2}
              placeholder="Nhập thông tin dữ liệu khác mà nhóm đã thu thập được..."
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 p-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Gói Checkpoint môn học
          </label>
          <select
            value={packId}
            onChange={(e) => setPackId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
          >
            {packs.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.course} – {p.checkpoint} ({p.term})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-2">
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading || !name.trim() || !idea.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-500 disabled:opacity-50"
        >
          <CheckCircle2 size={15} />
          {loading ? "Đang lưu..." : "Lưu dự án và Tiếp tục"}
        </button>
      </div>
    </div>
  );
}
