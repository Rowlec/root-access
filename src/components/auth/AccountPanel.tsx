"use client";

import { LogOut, UserCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AccountPanel() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div className="h-48 animate-pulse rounded-3xl bg-muted/40" />;

  return (
    <section className="glass w-full max-w-2xl rounded-3xl p-7">
      <UserCircle className="size-10 text-primary" />
      <h1 className="mt-4 text-3xl font-semibold">Tài khoản</h1>
      <dl className="mt-6 grid gap-4 rounded-2xl border border-border bg-background/40 p-5 text-sm">
        <div><dt className="text-muted-foreground">Tên</dt><dd className="mt-1 font-medium">{session?.user.name ?? "—"}</dd></div>
        <div><dt className="text-muted-foreground">Email</dt><dd className="mt-1 font-medium">{session?.user.email ?? "—"}</dd></div>
        <div><dt className="text-muted-foreground">Auth provider</dt><dd className="mt-1 font-medium">Better Auth trên Neon</dd></div>
      </dl>
      <Button variant="outline" className="mt-5" onClick={async () => { await authClient.signOut(); router.push("/sign-in"); router.refresh(); }}><LogOut />Đăng xuất</Button>
    </section>
  );
}
