"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  BarChart3,
  Coins,
  FileSearch,
  LayoutDashboard,
  Lightbulb,
  Plus,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { CreditBalance } from "@/components/app/CreditBalance";

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
    <aside className="hidden h-svh w-72 shrink-0 flex-col border-r border-border/70 bg-background/80 p-3 backdrop-blur-xl md:flex">
      <Link href="/app" className="flex items-center gap-2.5 px-2 py-2">
        <Image src="/logo.png" alt="Root Access" width={38} height={22} className="h-6 w-auto" />
        <span className="font-semibold">Root Access</span>
      </Link>

      <Link
        href="/app#new-project"
        className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 text-sm font-semibold hover:bg-secondary"
      >
        <Plus className="size-4" /> Dự án mới
      </Link>

      <nav className="mt-5 grid gap-1 text-sm">
        <Link
          href="/app"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
            pathname === "/app" && "bg-secondary/60 text-foreground",
          )}
        >
          <LayoutDashboard className="size-4" /> Tổng quan
        </Link>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground">
          <Lightbulb className="size-4" /> Idea validation
        </div>
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground">
          <FileSearch className="size-4" /> Proposal review
        </div>
      </nav>

      <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-3"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lịch sử dự án</p><Link href="/app/projects" className="text-xs text-primary">Tất cả</Link></div>
        <div className="mt-2 grid gap-1">
          {projects.length ? (
            projects.map((project) => (
              <Link
                key={project.id}
                href={`/app/projects/${project.id}`}
                className={cn(
                  "truncate rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground",
                  pathname.includes(project.id) && "bg-secondary/60 text-foreground",
                )}
              >
                {project.title}
              </Link>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-muted-foreground">Chưa có dự án</p>
          )}
        </div>
      </div>

      <div className="grid gap-1 border-t border-border/70 pt-3 text-sm">
        <Link href="/app/credits" className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary/50">
          <span className="flex items-center gap-2"><Coins className="size-4 text-primary" /> Credits</span>
          <strong><CreditBalance initialBalance={balance} /></strong>
        </Link>
        {isAdmin ? (
          <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-secondary/50">
            <BarChart3 className="size-4" /> Admin dashboard
          </Link>
        ) : null}
        <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary/50">
          <Link href="/app/account" className="flex items-center gap-2"><Settings className="size-4" /> Tài khoản</Link>
          <UserButton />
        </div>
      </div>
    </aside>
  );
}
