"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Boxes,
  Compass,
  FolderKanban,
  LayoutDashboard,
  ReceiptText,
  ShieldAlert,
  ShieldCheck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/users", label: "Người dùng & Admin", icon: Users },
  { href: "/admin/examples", label: "Kho bài mẫu", icon: BookOpen },
  { href: "/admin/packages", label: "Gói credits", icon: Boxes },
  { href: "/admin/orders", label: "Đơn hàng & Nạp tiền", icon: ReceiptText },
  { href: "/admin/projects", label: "Dự án sinh viên", icon: FolderKanban },
  { href: "/admin/audit", label: "Audit log", icon: Activity },
];

export function AdminHeaderNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-8">
        <div className="flex items-center gap-3 overflow-x-auto py-1 scrollbar-none">
          <Link
            href="/admin"
            className="flex items-center gap-2 shrink-0 pr-2 border-r border-border"
          >
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <ShieldCheck size={16} />
            </div>
            <span className="font-bold text-sm tracking-tight text-foreground">
              Root Access <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 ml-1">Admin</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(href);

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all",
                    isActive
                      ? "bg-primary/15 text-primary border border-primary/30 shadow-sm font-semibold"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                  )}
                >
                  <Icon size={14} className={isActive ? "text-primary" : "text-muted-foreground"} />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/app"
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card/60 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Về không gian /app</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
