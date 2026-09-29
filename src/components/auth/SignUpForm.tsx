"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await authClient.signUp.email({
      callbackURL: "/connect-extension",
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (result.error) {
      setError(result.error.message || "Không thể tạo tài khoản.");
      setPending(false);
      return;
    }

    router.push("/connect-extension");
    router.refresh();
  }

  return (
    <section className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
      <h1 className="text-3xl font-semibold">Tạo tài khoản</h1>
      <p className="mt-2 text-sm text-muted-foreground">Nhập cùng email Clerk cũ để tự nối lại project và role admin.</p>
      <form action={submit} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm">Tên hiển thị<Input name="name" autoComplete="name" minLength={2} required /></label>
        <label className="grid gap-2 text-sm">Email<Input name="email" type="email" autoComplete="email" required /></label>
        <label className="grid gap-2 text-sm">Mật khẩu<Input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="btn-liquid h-11" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <UserPlus />}Đăng ký</Button>
      </form>
      {googleEnabled ? (
        <Button type="button" variant="outline" className="mt-3 h-11 w-full" onClick={() => authClient.signIn.social({ callbackURL: "/app", provider: "google" })}>Đăng ký với Google</Button>
      ) : null}
      <p className="mt-5 text-center text-sm text-muted-foreground">Đã có tài khoản? <Link href="/sign-in" className="font-medium text-primary">Đăng nhập</Link></p>
    </section>
  );
}
