import Link from "next/link";
import { Archive, ArrowRight, FolderKanban } from "lucide-react";

import { setProjectStatusAction } from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import { getAllOwnedProjects } from "@/lib/server/projects";

export default async function ProjectsPage() {
  const { projects } = await getAllOwnedProjects();

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex items-center gap-3"><FolderKanban className="text-primary" /><h1 className="text-3xl font-semibold">Tất cả project</h1></div>
      <p className="mt-2 text-muted-foreground">Quản lý project đang làm và project đã lưu trữ.</p>
      <div className="mt-7 grid gap-4">
        {projects.map((project) => (
          <article key={project.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card/70 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2"><h2 className="truncate font-semibold">{project.title}</h2>{project.status === "archived" ? <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Đã lưu trữ</span> : null}</div>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.startupIdea}</p>
              <p className="mt-2 text-xs text-muted-foreground">{project.progressPercent}% hoàn thành · cập nhật {project.updatedAt.toLocaleDateString("vi-VN")}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <form action={setProjectStatusAction}>
                <input type="hidden" name="id" value={project.id} />
                <input type="hidden" name="status" value={project.status === "active" ? "archived" : "active"} />
                <Button type="submit" variant="outline" size="sm"><Archive />{project.status === "active" ? "Lưu trữ" : "Khôi phục"}</Button>
              </form>
              <Button asChild size="sm"><Link href={`/app/projects/${project.id}`}>Mở <ArrowRight /></Link></Button>
            </div>
          </article>
        ))}
        {!projects.length ? <p className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">Bạn chưa có project nào.</p> : null}
      </div>
    </main>
  );
}
