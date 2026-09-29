"use client";

import { ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function BlockedAccount() {
  const router = useRouter();
  return (
    <main className="grid min-h-svh place-items-center px-5">
      <section className="glass max-w-lg rounded-3xl p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-destructive" />
        <h1 className="mt-4 text-2xl font-semibold">Tài khoản đã bị tạm khóa</h1>
        <p className="mt-3 text-muted-foreground">Liên hệ quản trị viên Root Access nếu bạn cho rằng đây là nhầm lẫn.</p>
        <Button className="mt-6" onClick={async () => { await authClient.signOut(); router.push("/welcome"); router.refresh(); }}>Đăng xuất</Button>
      </section>
    </main>
  );
}
