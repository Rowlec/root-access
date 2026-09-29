import React from "react";
import { CheckCircle2, ChevronRight, Clock, FolderGit2, Plus, Sparkles } from "lucide-react";
import { Pack, Project, Section } from "../../lib/types";

export type SectionStatus = "CHUA_LAM" | "DANG_SUA" | "DAT";

export function SectionListScreen({
  project,
  pack,
  sectionStatuses,
  onSelectSection,
  onChangeProject,
  onNewProject,
}: {
  project: Project;
  pack: Pack;
  sectionStatuses: Record<string, SectionStatus>;
  onSelectSection: (section: Section) => void;
  onChangeProject: () => void;
  onNewProject: () => void;
}) {
  const getStatusBadge = (status: SectionStatus = "CHUA_LAM") => {
    switch (status) {
      case "DAT":
        return (
          <span className="badge-tot inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
            <CheckCircle2 size={12} /> Đạt
          </span>
        );
      case "DANG_SUA":
        return (
          <span className="badge-dat inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
            <Clock size={12} /> Đang sửa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-slate-400">
            Chưa làm
          </span>
        );
    }
  };

  const completedCount = Object.values(sectionStatuses).filter((s) => s === "DAT").length;
  const totalCount = pack.sections.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="flex h-screen flex-col overflow-y-auto p-4 space-y-4">
      {/* Top Project Header */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 size={16} className="text-blue-400" />
            <h3 className="text-xs font-bold text-white truncate max-w-[160px]">
              {project.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onChangeProject}
              className="text-[11px] text-blue-400 hover:text-blue-300"
            >
              Đổi dự án
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={onNewProject}
              className="text-[11px] text-slate-400 hover:text-white"
            >
              Tạo mới
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>{pack.course} – {pack.checkpoint}</span>
            <span className="text-slate-200 font-semibold">{completedCount}/{totalCount} phần đạt</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/40">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sections List */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
          Checklist các phần trong Checkpoint
        </h4>

        <div className="space-y-2">
          {pack.sections.map((section, idx) => {
            const status = sectionStatuses[section.id] || "CHUA_LAM";
            return (
              <div
                key={section.id}
                onClick={() => onSelectSection(section)}
                className="group flex cursor-pointer items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-blue-500/40 hover:bg-white/10"
              >
                <div className="space-y-1 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-100 group-hover:text-blue-400">
                      {section.title}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-[11px] text-slate-400 pl-7">
                    {section.requirement}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(status)}
                  <ChevronRight size={15} className="text-slate-500 group-hover:translate-x-0.5 group-hover:text-blue-400 transition" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-auto rounded-xl border border-white/5 bg-black/20 p-3 text-center text-[11px] text-slate-500">
        Nguồn rubric: {pack.source}
      </div>
    </div>
  );
}
