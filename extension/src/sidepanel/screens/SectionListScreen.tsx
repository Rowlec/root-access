import React from "react";
import { Check, CheckCircle2, ChevronRight, Clock, FolderGit2, Plus } from "lucide-react";
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
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-[var(--ok-bg)] text-[var(--ok)]">
            <Check size={12} /> Đạt
          </span>
        );
      case "DANG_SUA":
        return (
          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold bg-[var(--mid-bg)] text-[var(--mid)]">
            <Clock size={12} /> Đang sửa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[var(--line-2)] bg-[var(--sunken)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
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
      {/* Top Project Header (Spec Mục 5: Header dự án) */}
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderGit2 size={16} className="text-[var(--accent)]" />
            <h3 className="text-xs font-bold text-[var(--ink)] truncate max-w-[160px]">
              {project.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onChangeProject}
              className="text-[11px] text-[var(--accent)] hover:underline font-semibold"
            >
              Đổi dự án
            </button>
            <span className="text-[var(--muted)]">•</span>
            <button
              onClick={onNewProject}
              className="text-[11px] text-[var(--muted)] hover:text-[var(--ink)]"
            >
              Tạo mới
            </button>
          </div>
        </div>

        {project.niche && (
          <div className="text-[2xs] text-[var(--muted)] truncate">
            Ngách: <span className="text-[var(--ink)] font-medium">{project.niche}</span>
          </div>
        )}

        <div className="space-y-1 pt-1">
          <div className="flex items-center justify-between text-[11px] text-[var(--muted)]">
            <span>{pack.course} – {pack.checkpoint}</span>
            <span className="text-[var(--ink)] font-semibold">{completedCount}/{totalCount} phần đạt</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--sunken)]">
            <div
              className="h-full bg-[var(--ok)] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Sections List (Spec Table 7.5: Các phần của Checkpoint 2) */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] px-1">
          Các phần của {pack.checkpoint}
        </h4>

        <div className="space-y-2">
          {pack.sections.map((section, idx) => {
            const status = sectionStatuses[section.id] || "CHUA_LAM";
            return (
              <button
                key={section.id}
                onClick={() => onSelectSection(section)}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 text-left transition-all hover:border-[var(--accent)] hover:shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--sunken)] text-xs font-bold text-[var(--muted)]">
                    {idx + 1}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[var(--ink)]">
                      {section.title}
                    </h5>
                    <p className="line-clamp-1 text-[11px] text-[var(--muted)]">
                      {section.requirement}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {getStatusBadge(status)}
                  <ChevronRight size={14} className="text-[var(--muted)]" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
