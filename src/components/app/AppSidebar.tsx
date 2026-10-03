"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Coins,
  Compass,
  FileSearch,
  LayoutDashboard,
  Lightbulb,
  Plus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CreditBalance } from "@/components/app/CreditBalance";
import { SidebarAccount } from "@/components/auth/SidebarAccount";

type SidebarProject = {
  id: string;
  title: string;
};

export function AppSidebar({
  balance,
  isAdmin,
  projects,
}: {
  balance: number;
  isAdmin: boolean;
  projects: SidebarProject[];
}) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-svh w-72 shrink-0 flex-col border-r border-border/70 bg-card p-3 md:flex">
      <Link href="/app" className="flex items-center gap-2.5 px-2 py-2">
        <div className="relative flex size-7 items-center justify-center rounded bg-[#1C1A17] text-white font-serif font-bold text-base shadow-sm">
          R
          <span className="absolute -bottom-0.5 left-1 right-1 h-1 bg-[#FFE27A] rounded-full" />
        </div>
        <span className="font-serif font-bold text-lg text-foreground tracking-tight">RootAccess</span>
      </Link>

      <Link
        href="/connect-extension"
        className="mt-2.5 flex h-10 items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors shadow-sm"
      >
        <Compass className="size-4 shrink-0 text-primary" />
        <span>Cài tiện ích RootAccess</span>
      </Link>

      <Link
        href="/app#new-project"
        className="mt-2 flex h-10 items-center gap-2 rounded-xl border border-border bg-secondary/60 px-3 text-xs font-semibold hover:bg-secondary transition-colors"
      >
        <Plus className="size-4" /> Tạo dự án
      </Link>

      <nav className="mt-4 grid gap-1 text-sm">
        <Link
          href="/app"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            pathname === "/app" && "bg-secondary/70 font-medium text-foreground",
          )}
        >
          <LayoutDashboard className="size-4" /> Dự án của tôi
        </Link>
      </nav>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Danh sách dự án</p>
          <Link href="/app" className="text-xs text-primary font-medium hover:underline">Tất cả</Link>
        </div>
        <div className="mt-2 grid gap-1">
          {projects.length ? (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/app/projects/${project.id}`}
                className={cn(
                  "truncate rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors",
                  pathname.includes(project.id) && "bg-secondary/70 font-medium text-foreground",
                )}
              >
                {project.title}
              </Link>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-muted-foreground">Chưa có dự án nào</p>
          )}
        </div>
      </div>

      <div className="grid gap-1 border-t border-border/70 pt-3 text-sm">
        <Link href="/app/credits" className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary/50 transition-colors">
          <span className="flex items-center gap-2"><Coins className="size-4 text-primary" /> Credit và gói nhóm</span>
          <strong><CreditBalance initialBalance={balance} /></strong>
        </Link>
        {isAdmin ? (
          <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-secondary/50 transition-colors">
            <BarChart3 className="size-4" /> Admin dashboard
          </Link>
        ) : null}
        <SidebarAccount />
      </div>
    </aside>
  );
}
