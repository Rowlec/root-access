"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export function SidebarAccount() {
  const router = useRouter();
  const { data: session } = authClient.useSession();

  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary/50">
      <Link href="/app/account" className="flex min-w-0 items-center gap-2">
        <Settings className="size-4 shrink-0" />
        <span className="truncate">{session?.user.name || "Tài khoản"}</span>
      </Link>
      <button type="button" aria-label="Đăng xuất" title="Đăng xuất" onClick={async () => { await authClient.signOut(); router.push("/sign-in"); router.refresh(); }}>
        <LogOut className="size-4 text-muted-foreground" />
      </button>
    </div>
  );
}
