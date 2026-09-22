import Link from "next/link";
import { ArrowLeft, Check, Circle, Coins, WandSparkles } from "lucide-react";

import { LaunchWorkflowButton } from "@/components/app/LaunchWorkflowButton";
import { Badge } from "@/components/ui/badge";
import { getOwnedProject } from "@/lib/server/projects";

const steps = [
  ["problem", "Vấn đề"],
  ["customer", "Khách hàng"],
  ["revenue", "Doanh thu"],
  ["mvp", "MVP"],
  ["differentiation", "Khác biệt"],
] as const;

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { project } = await getOwnedProject(id);

  return (
    <main className="mx-auto min-h-svh w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
      <Link href="/app" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Quay lại workspace
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <section className="glass rounded-3xl p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge variant="secondary">Startup Proposal</Badge>
              <h1 className="mt-3 text-3xl font-semibold">{project.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{project.industry} · {project.targetCustomer || "Chưa xác định khách hàng"}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/60 px-3 py-2 text-sm text-muted-foreground">
              {project.progressPercent}% hoàn thành
            </div>
          </div>

          <div className="mt-7 rounded-2xl border border-border bg-background/45 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project context</p>
            <p className="mt-3 leading-7">{project.startupIdea}</p>
          </div>

          <div className="mt-7">
            <h2 className="text-lg font-semibold">Bước tiếp theo được đề xuất</h2>
            <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/10 p-5">
              <div className="flex items-start gap-3">
                <WandSparkles className="mt-0.5 size-5 text-primary" />
                <div>
                  <h3 className="font-semibold">Làm rõ vấn đề trước khi nghĩ giải pháp</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">AI sẽ tạo bản nháp có giới hạn, sau đó Root Access chấm theo rubric và hướng dẫn bạn cải thiện.</p>
                </div>
              </div>
              <div className="mt-5"><LaunchWorkflowButton project={project} /></div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-border bg-card/70 p-5">
            <h2 className="font-semibold">Tiến độ proposal</h2>
            <ol className="mt-4 grid gap-3">
              {steps.map(([id, label], index) => {
                const completed = project.progressPercent >= (index + 1) * 20;
                const current = project.currentSection === id;
                return (
                  <li key={id} className="flex items-center gap-2 text-sm">
                    {completed ? <Check className="size-4 text-emerald-400" /> : <Circle className={current ? "size-4 text-primary" : "size-4 text-muted-foreground"} />}
                    <span className={current ? "font-medium text-foreground" : "text-muted-foreground"}>{label}</span>
                  </li>
                );
              })}
            </ol>
          </div>
          <Link href="/app/billing" className="flex items-center justify-between rounded-2xl border border-border bg-card/70 p-5 text-sm hover:border-primary/50">
            <span className="flex items-center gap-2"><Coins className="size-4 text-primary" /> Mua thêm credits</span>
            <span>→</span>
          </Link>
        </aside>
      </div>
    </main>
  );
}
