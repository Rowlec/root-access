"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  FolderKanban,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  deleteAdminProjectAction,
  setAdminProjectStatusAction,
} from "@/app/admin/actions";
import { startGlobalLoading, stopGlobalLoading } from "@/components/loading/GlobalLoading";

type AdminProject = {
  createdAt: Date;
  id: string;
  ownerEmail: string | null;
  progressPercent: number;
  status: "active" | "archived";
  title: string;
  updatedAt: Date;
};

export function AdminProjectsClient({ projects }: { projects: AdminProject[] }) {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "archived">("all");
  const [isPending, startTransition] = useTransition();

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const query = search.toLowerCase().trim();
      const matchSearch =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.ownerEmail?.toLowerCase().includes(query) ||
        p.id.toLowerCase().includes(query);

      if (!matchSearch) return false;

      if (filterStatus === "active") return p.status === "active";
      if (filterStatus === "archived") return p.status === "archived";
      return true;
    });
  }, [projects, search, filterStatus]);

  const activeCount = projects.filter((p) => p.status === "active").length;
  const archivedCount = projects.filter((p) => p.status === "archived").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FolderKanban className="text-primary size-7" />
            <span>Quản lý Dự án Sinh viên</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Theo dõi các dự án startup của sinh viên, tiến độ hoàn thành, lưu trữ hoặc xóa dữ liệu vi phạm.
          </p>
        </div>
      </div>

      {/* Quick Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilterStatus("all")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
            filterStatus === "all"
              ? "bg-primary text-primary-foreground shadow"
              : "bg-card/70 text-muted-foreground hover:bg-card border border-border"
          }`}
        >
          Tất cả ({projects.length})
        </button>

        <button
          onClick={() => setFilterStatus("active")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
            filterStatus === "active"
              ? "bg-emerald-600 text-white shadow"
              : "bg-card/70 text-muted-foreground hover:bg-card border border-border"
          }`}
        >
          Đang hoạt động ({activeCount})
        </button>

        <button
          onClick={() => setFilterStatus("archived")}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
            filterStatus === "archived"
              ? "bg-muted text-foreground border border-border/80 shadow"
              : "bg-card/70 text-muted-foreground hover:bg-card border border-border"
          }`}
        >
          Đã lưu trữ ({archivedCount})
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo tên dự án, email chủ sở hữu, hoặc mã dự án..."
          className="pl-10 h-10 text-xs bg-card/60 rounded-xl"
        />
        {search ? (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        ) : null}
      </div>

      {/* Projects Grid */}
      <div className="grid gap-3.5">
        {filteredProjects.map((project) => {
          const isActive = project.status === "active";

          return (
            <article
              key={project.id}
              className="rounded-2xl border border-border bg-card/70 p-5 hover:border-border/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-foreground truncate">
                    {project.title}
                  </h3>
                  {isActive ? (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px]">
                      Hoạt động
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[10px]">
                      Đã lưu trữ
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground font-mono">
                  Owner: {project.ownerEmail || "Không có email"}
                </p>

                <div className="flex items-center gap-3 pt-1 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-primary" />
                    <span>Tiến độ: {project.progressPercent}%</span>
                  </div>
                  <span>•</span>
                  <span>Cập nhật: {new Date(project.updatedAt).toLocaleDateString("vi-VN")}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                {/* Archive / Restore */}
                <form
                  action={(formData) => {
                    startGlobalLoading("Đang cập nhật trạng thái dự án...");
                    startTransition(async () => {
                      await setAdminProjectStatusAction(formData);
                      stopGlobalLoading();
                    });
                  }}
                >
                  <input type="hidden" name="id" value={project.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={isActive ? "archived" : "active"}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    variant="outline"
                    className="h-8 px-2.5 text-xs gap-1"
                  >
                    {isActive ? (
                      <>
                        <Archive size={13} />
                        <span>Lưu trữ</span>
                      </>
                    ) : (
                      <>
                        <ArchiveRestore size={13} />
                        <span>Khôi phục</span>
                      </>
                    )}
                  </Button>
                </form>

                {/* Delete */}
                <form
                  action={(formData) => {
                    if (!confirm(`Bạn chắc chắn muốn xóa vĩnh viễn dự án "${project.title}"?`)) return;
                    startGlobalLoading("Đang xóa dự án...");
                    startTransition(async () => {
                      await deleteAdminProjectAction(formData);
                      stopGlobalLoading();
                    });
                  }}
                >
                  <input type="hidden" name="id" value={project.id} />
                  <Button
                    type="submit"
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-rose-400"
                  >
                    <Trash2 size={13} />
                  </Button>
                </form>
              </div>
            </article>
          );
        })}

        {!filteredProjects.length ? (
          <div className="rounded-3xl border border-dashed border-border p-10 text-center space-y-2">
            <FolderKanban size={32} className="mx-auto text-muted-foreground/50" />
            <p className="text-sm font-semibold text-foreground">Không tìm thấy dự án nào</p>
            <p className="text-xs text-muted-foreground">Thử tìm bằng từ khóa khác hoặc xóa bộ lọc.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
