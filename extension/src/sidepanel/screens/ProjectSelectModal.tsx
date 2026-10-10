import React, { useState } from "react";
import { Check, FolderGit2, Plus, RotateCw, Search, X } from "lucide-react";
import { Project } from "../../lib/types";

export function ProjectSelectModal({
  projects,
  activeProjectId,
  onSelectProject,
  onNewProject,
  onRefresh,
  onClose,
}: {
  projects: Project[];
  activeProjectId?: string;
  onSelectProject: (project: Project) => void;
  onNewProject: () => void;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredProjects = projects.filter((p) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = p.name?.toLowerCase().includes(term);
    const nicheMatch = p.niche?.toLowerCase().includes(term);
    const ideaMatch = p.idea?.toLowerCase().includes(term);
    return nameMatch || nicheMatch || ideaMatch;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/70 backdrop-blur-xs">
      <div className="flex max-h-[85vh] w-full flex-col rounded-t-2xl border-t border-[var(--line)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
          <div className="flex items-center gap-2">
            <FolderGit2 size={16} className="text-[var(--accent)]" />
            <h3 className="text-xs font-bold text-[var(--ink)]">
              Danh sách dự án ({projects.length})
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              title="Làm mới danh sách"
              disabled={isRefreshing}
              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--sunken)] hover:text-[var(--ink)] transition-colors disabled:opacity-50"
            >
              <RotateCw size={14} className={isRefreshing ? "animate-spin text-[var(--accent)]" : ""} />
            </button>
            <button
              onClick={onClose}
              title="Đóng"
              className="rounded-lg p-1.5 text-[var(--muted)] hover:bg-[var(--sunken)] hover:text-[var(--ink)] transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-3 border-b border-[var(--line)] bg-[var(--surface-2)]">
          <div className="relative flex items-center">
            <Search size={13} className="absolute left-3 text-[var(--muted)] pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm dự án hoặc ngách..."
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--sunken)] py-1.5 pl-8 pr-3 text-xs text-[var(--ink)] placeholder-[var(--muted)] focus:border-[var(--accent)] focus:outline-none transition-colors"
              autoFocus
            />
          </div>
        </div>

        {/* Projects List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[50vh]">
          {filteredProjects.length === 0 ? (
            <div className="py-6 text-center text-xs text-[var(--muted)]">
              {searchTerm ? "Không tìm thấy dự án phù hợp." : "Chưa có dự án nào."}
            </div>
          ) : (
            filteredProjects.map((proj) => {
              const isSelected = proj.id === activeProjectId;
              return (
                <button
                  key={proj.id}
                  onClick={() => onSelectProject(proj)}
                  className={`w-full text-left rounded-xl border p-2.5 transition-all flex items-start justify-between gap-2.5 ${
                    isSelected
                      ? "border-[var(--accent)] bg-[var(--accent-weak)]/40 shadow-sm"
                      : "border-[var(--line)] bg-[var(--surface-2)] hover:border-[var(--line-2)] hover:bg-[var(--surface)]"
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold truncate ${isSelected ? "text-[var(--accent)]" : "text-[var(--ink)]"}`}>
                        {proj.name}
                      </span>
                      {isSelected && (
                        <span className="rounded-full bg-[var(--ok-bg)] px-1.5 py-0.2 text-[10px] font-semibold text-[var(--ok)] border border-[var(--ok)]/30">
                          Đang chọn
                        </span>
                      )}
                    </div>
                    {proj.niche && (
                      <p className="text-[11px] text-[var(--muted)] line-clamp-1">
                        Ngách: <span className="text-[var(--ink-2)]">{proj.niche}</span>
                      </p>
                    )}
                    {proj.idea && (
                      <p className="text-[11px] text-[var(--muted)] line-clamp-1 italic">
                        {proj.idea}
                      </p>
                    )}
                  </div>
                  {isSelected && (
                    <div className="mt-0.5 rounded-full bg-[var(--ok)] p-0.5 text-black">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--line)] p-3 bg-[var(--surface-2)]">
          <button
            onClick={() => {
              onClose();
              onNewProject();
            }}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--accent)]/50 bg-[var(--accent-weak)]/20 py-2 text-xs font-semibold text-[var(--accent)] hover:bg-[var(--accent-weak)]/40 transition-colors"
          >
            <Plus size={13} />
            Tạo dự án mới
          </button>
        </div>
      </div>
    </div>
  );
}
