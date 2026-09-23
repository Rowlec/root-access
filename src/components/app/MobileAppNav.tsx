"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, Plus, X } from "lucide-react";
import { CreditBalance } from "@/components/app/CreditBalance";

export function MobileAppNav({
  balance,
  projects,
}: {
  balance: number;
  projects: Array<{ id: string; title: string }>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl md:hidden">
        <Link href="/app" className="flex items-center gap-2 font-semibold">
          <Image src="/logo.png" alt="Root Access" width={34} height={20} className="h-5 w-auto" />
          Root Access
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/app/billing" className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-primary">
            <CreditBalance initialBalance={balance} /> credits
          </Link>
          <button type="button" onClick={() => setOpen(true)} className="rounded-lg border border-border p-2" aria-label="Mở menu">
            <Menu className="size-4" />
          </button>
        </div>
      </header>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button className="absolute inset-0 bg-black/65" onClick={() => setOpen(false)} aria-label="Đóng menu" />
          <nav className="absolute inset-y-0 left-0 w-[85%] max-w-80 border-r border-border bg-background p-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <strong>Workspace</strong>
              <button onClick={() => setOpen(false)} className="rounded-lg p-2" aria-label="Đóng menu"><X className="size-5" /></button>
            </div>
            <Link href="/app#new-project" onClick={() => setOpen(false)} className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-3 text-sm font-semibold">
              <Plus className="size-4" /> Dự án mới
            </Link>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm"><Link href="/app/projects" onClick={() => setOpen(false)} className="rounded-lg border border-border px-3 py-2">Tất cả project</Link><Link href="/app/credits" onClick={() => setOpen(false)} className="rounded-lg border border-border px-3 py-2">Lịch sử credits</Link></div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Lịch sử dự án</p>
            <div className="mt-2 grid gap-1">
              {projects.length ? projects.map((project) => (
                <Link key={project.id} href={`/app/projects/${project.id}`} onClick={() => setOpen(false)} className="truncate rounded-lg px-3 py-2 text-sm hover:bg-secondary/50">
                  {project.title}
                </Link>
              )) : <p className="px-3 py-2 text-sm text-muted-foreground">Chưa có dự án</p>}
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
