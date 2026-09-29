"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AuthControls({ locale }: { locale: string }) {
  const isVietnamese = locale === "vi";
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div className="h-9 w-24 animate-pulse rounded-lg border border-border bg-muted/40" />;
  }

  if (session?.user) {
    const initial = (session.user.name || session.user.email).slice(0, 1).toUpperCase();
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/app/account"
          className="grid size-9 place-items-center rounded-full border border-border bg-secondary text-sm font-semibold"
          aria-label={session.user.email}
          title={session.user.email}
        >
          {initial}
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="btn-glass h-9 rounded-full px-3"
          onClick={async () => {
            await authClient.signOut();
            router.push("/sign-in");
            router.refresh();
          }}
        >
          <LogOut aria-hidden="true" />
          <span className="hidden lg:inline">
            {isVietnamese ? "Đăng xuất" : "Sign out"}
          </span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2">
      <Button asChild type="button" variant="ghost" size="sm" className="btn-glass h-9 rounded-full px-3">
        <Link href="/sign-in"><LogIn aria-hidden="true" /><span className="hidden lg:inline">{isVietnamese ? "Đăng nhập" : "Sign in"}</span></Link>
      </Button>
      <Button asChild type="button" variant="outline" size="sm" className="btn-liquid h-9 rounded-full px-3 text-primary-foreground">
        <Link href="/sign-up"><UserPlus aria-hidden="true" /><span className="hidden lg:inline">{isVietnamese ? "Đăng ký" : "Sign up"}</span></Link>
      </Button>
    </div>
  );
}
