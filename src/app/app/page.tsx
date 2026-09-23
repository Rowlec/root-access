import Link from "next/link";
import { ArrowRight, CheckCircle2, Database, ShieldCheck, Sparkles } from "lucide-react";

import { NewProjectForm } from "@/components/app/NewProjectForm";
import { CreditBalance } from "@/components/app/CreditBalance";
import { Badge } from "@/components/ui/badge";
import { isDatabaseConfigured } from "@/db";
import { isClerkConfigured } from "@/lib/server/auth";
import { getWorkspaceOverview } from "@/lib/server/projects";

export default async function AppHomePage() {
  const backendReady = isClerkConfigured() && isDatabaseConfigured();
  const overview = backendReady ? await getWorkspaceOverview() : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="secondary">AI workspace có hướng dẫn</Badge>
          <h1 className="mt-3 text-3xl font-semibold sm:text-4xl">Hôm nay bạn muốn hoàn thành gì?</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Root Access biến một mục tiêu mơ hồ thành các bước có thể làm, kiểm tra và cải thiện.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">Số dư</span>
          <strong className="ml-2 text-lg text-primary"><CreditBalance initialBalance={overview?.wallet?.balance ?? 20} /> credits</strong>
        </div>
      </div>

      {!backendReady ? (
        <section className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 size-5 text-amber-300" />
            <div>
              <h2 className="font-semibold">Workspace preview đang hoạt động</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Thêm DATABASE_URL và chạy migration để bật lưu dự án, credit và analytics server-side.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section id="new-project" className="glass mt-8 rounded-3xl p-5 sm:p-7">
        <div className="mb-6 flex items-start gap-3">
          <div className="rounded-xl bg-primary/15 p-2 text-primary"><Sparkles /></div>
          <div>
            <h2 className="text-xl font-semibold">Tạo project mới</h2>
            <p className="mt-1 text-sm text-muted-foreground">Không cần nghĩ prompt. Hãy mô tả bài toán bằng ngôn ngữ của bạn.</p>
          </div>
        </div>
        <NewProjectForm disabled={!backendReady} />
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Dự án gần đây</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {overview?.projects.length ? (
            overview.projects.slice(0, 6).map((project) => (
              <Link key={project.id} href={`/app/projects/${project.id}`} className="group rounded-2xl border border-border bg-card/70 p-5 hover:border-primary/50">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{project.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{project.startupIdea}</p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-primary" /> {project.progressPercent}% hoàn thành
                </div>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground md:col-span-2">
              Dự án đầu tiên của bạn sẽ xuất hiện ở đây.
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        {["AI chia mục tiêu thành từng bước", "Rubric chỉ ra output còn yếu ở đâu", "Dữ liệu và credit được bảo vệ phía server"].map((label) => (
          <div key={label} className="flex items-start gap-2 rounded-xl border border-border bg-card/50 p-4 text-sm">
            <ShieldCheck className="size-4 shrink-0 text-primary" /> {label}
          </div>
        ))}
      </section>
    </main>
  );
}
