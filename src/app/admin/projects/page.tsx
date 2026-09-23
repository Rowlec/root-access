import { Archive, FolderKanban } from "lucide-react";

import { deleteAdminProjectAction, setAdminProjectStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { getAdminProjects } from "@/lib/server/admin";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";

export default async function AdminProjectsPage() {
  const projects = await getAdminProjects();
  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
      <div className="flex items-center gap-3"><FolderKanban className="text-primary" /><h1 className="text-3xl font-semibold">Quản lý projects</h1></div>
      <p className="mt-2 text-muted-foreground">Theo dõi tiến độ, lưu trữ hoặc xóa nội dung vi phạm.</p>
      <div className="mt-7 overflow-x-auto rounded-2xl border border-border bg-card/70">
        <table className="w-full min-w-[760px] text-left text-sm"><thead className="text-muted-foreground"><tr><th className="p-4">Project</th><th>Owner</th><th>Tiến độ</th><th>Trạng thái</th><th className="pr-4 text-right">Thao tác</th></tr></thead><tbody>
          {projects.map((project) => <tr key={project.id} className="border-t border-border"><td className="p-4"><strong>{project.title}</strong><p className="mt-1 text-xs text-muted-foreground">{project.id}</p></td><td>{project.ownerEmail ?? "—"}</td><td>{project.progressPercent}%</td><td>{project.status}</td><td className="pr-4"><div className="flex justify-end gap-2"><form action={setAdminProjectStatusAction}><input type="hidden" name="id" value={project.id} /><input type="hidden" name="status" value={project.status === "active" ? "archived" : "active"} /><Button size="sm" variant="outline"><Archive />{project.status === "active" ? "Lưu trữ" : "Khôi phục"}</Button></form><form action={deleteAdminProjectAction}><input type="hidden" name="id" value={project.id} /><ConfirmSubmitButton message={`Xóa vĩnh viễn project “${project.title}”?`} /></form></div></td></tr>)}
        </tbody></table>
      </div>
    </main>
  );
}
