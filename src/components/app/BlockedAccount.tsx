"use client";

import { SignOutButton } from "@clerk/nextjs";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export function BlockedAccount() {
  return (
    <main className="grid min-h-svh place-items-center px-5">
      <section className="glass max-w-lg rounded-3xl p-8 text-center">
        <ShieldAlert className="mx-auto size-10 text-destructive" />
        <h1 className="mt-4 text-2xl font-semibold">Tài khoản đã bị tạm khóa</h1>
        <p className="mt-3 text-muted-foreground">Liên hệ quản trị viên Root Access nếu bạn cho rằng đây là nhầm lẫn.</p>
        <SignOutButton redirectUrl="/welcome"><Button className="mt-6">Đăng xuất</Button></SignOutButton>
      </section>
    </main>
  );
}
