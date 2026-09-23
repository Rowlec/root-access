import {
  deleteProjectAction,
  setProjectStatusAction,
  updateProjectAction,
} from "@/app/app/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function ProjectSettings({
  project,
}: {
  project: {
    id: string;
    industry: string;
    startupIdea: string;
    status: "active" | "archived";
    targetCustomer: string;
    title: string;
  };
}) {
  return (
    <details className="mt-7 rounded-2xl border border-border bg-background/35 p-5">
      <summary className="cursor-pointer font-semibold">Cài đặt project</summary>
      <form action={updateProjectAction} className="mt-5 grid gap-4">
        <input type="hidden" name="id" value={project.id} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm">Tên project<Input name="title" defaultValue={project.title} required /></label>
          <label className="grid gap-2 text-sm">Lĩnh vực<Input name="industry" defaultValue={project.industry} required /></label>
        </div>
        <label className="grid gap-2 text-sm">Ý tưởng<Textarea name="startupIdea" defaultValue={project.startupIdea} className="min-h-28" required /></label>
        <label className="grid gap-2 text-sm">Khách hàng mục tiêu<Input name="targetCustomer" defaultValue={project.targetCustomer} /></label>
        <Button type="submit" className="w-fit">Lưu thay đổi</Button>
      </form>

      <div className="mt-6 grid gap-4 border-t border-border pt-5">
        <form action={setProjectStatusAction}>
          <input type="hidden" name="id" value={project.id} />
          <input type="hidden" name="status" value={project.status === "active" ? "archived" : "active"} />
          <Button type="submit" variant="outline">
            {project.status === "active" ? "Lưu trữ project" : "Khôi phục project"}
          </Button>
        </form>
        <form action={deleteProjectAction} className="grid gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <input type="hidden" name="id" value={project.id} />
          <label className="text-sm text-muted-foreground">
            Nhập chính xác <strong className="text-foreground">{project.title}</strong> để xóa vĩnh viễn.
          </label>
          <Input name="confirmation" autoComplete="off" placeholder={project.title} required />
          <Button type="submit" variant="destructive" className="mt-1 w-fit">Xóa project</Button>
        </form>
      </div>
    </details>
  );
}
