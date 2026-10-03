import Link from "next/link";
import { ArrowRight, BookOpen, Compass, Database, ShieldCheck } from "lucide-react";

import { CreditBalance } from "@/components/app/CreditBalance";
import { DashboardProjectsView } from "@/components/app/DashboardProjectsView";
import { isDatabaseConfigured } from "@/db";
import { isAuthConfigured } from "@/lib/server/auth";
import { getWorkspaceOverview } from "@/lib/server/projects";

export default async function AppHomePage() {
  const backendReady = isAuthConfigured() && isDatabaseConfigured();
  const overview = backendReady ? await getWorkspaceOverview() : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-6 sm:px-8 lg:px-10 lg:py-10 space-y-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line-2)] pb-6">
        <div>
          <span className="inline-block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Không gian làm việc
          </span>
          <h1 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-[var(--ink)]">
            <span className="mark-highlight">Dự án của bạn</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted)] leading-relaxed">
            Lên kế hoạch, xem toàn bộ proposal và chấm bài chuẩn rubric môn EXE.
          </p>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm shadow-sm">
          <span className="text-xs text-[var(--muted)] block">Ví của bạn</span>
          <strong className="text-lg font-bold text-[var(--accent)]">
            <CreditBalance initialBalance={overview?.wallet?.balance ?? 20} /> credits
          </strong>
        </div>
      </div>

      {/* Extension Install Banner */}
      <section className="rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-[var(--accent-weak)] p-2.5 text-[var(--accent)] shrink-0">
            <Compass className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              Cài tiện ích RootAccess trên ChatGPT / Gemini
            </h3>
            <p className="text-xs text-[var(--muted)] leading-relaxed mt-0.5">
              Hỏi nhanh thông tin, tự động chèn prompt và chấm bài trực tiếp từng câu ngay cạnh cửa sổ chat.
            </p>
          </div>
        </div>
        <Link
          href="/connect-extension"
          className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-lg bg-[var(--accent)] px-4 py-2 text-xs font-medium text-white hover:opacity-90 transition-opacity"
        >
          Cài tiện ích RootAccess <ArrowRight className="size-3.5" />
        </Link>
      </section>

      {!backendReady && (
        <section className="rounded-xl border border-[var(--mid)] bg-[var(--mid-bg)] p-4 text-[var(--mid)]">
          <div className="flex items-start gap-3">
            <Database className="mt-0.5 size-5 shrink-0" />
            <div className="text-xs">
              <strong className="font-semibold block text-sm">Chưa kết nối cơ sở dữ liệu</strong>
              Cần cấu hình DATABASE_URL để kích hoạt lưu trữ dự án, studio và lịch sử chấm.
            </div>
          </div>
        </section>
      )}

      {/* Main Content Area: Project List or Idea Studio */}
      <DashboardProjectsView
        projects={overview?.projects ?? []}
        walletBalance={overview?.wallet?.balance ?? 20}
      />
    </main>
  );
}
