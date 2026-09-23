import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Boxes, FolderKanban, LayoutDashboard, ReceiptText, Users } from "lucide-react";

import { ForbiddenError, requireAdmin } from "@/lib/server/auth";

const links = [
  ["/admin", "Tổng quan", LayoutDashboard],
  ["/admin/users", "Users", Users],
  ["/admin/projects", "Projects", FolderKanban],
  ["/admin/packages", "Gói credit", Boxes],
  ["/admin/orders", "Đơn hàng", ReceiptText],
  ["/admin/audit", "Audit log", Activity],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof ForbiddenError) redirect("/app");
    throw error;
  }

  return (
    <div className="min-h-svh bg-background/70">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 sm:px-8">
          <Link href="/app" className="mr-3 shrink-0 font-semibold text-primary">Root Access</Link>
          {links.map(([href, label, Icon]) => (
            <Link key={href} href={href} className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-secondary/50 hover:text-foreground"><Icon className="size-4" />{label}</Link>
          ))}
        </div>
      </header>
      {children}
    </div>
  );
}
