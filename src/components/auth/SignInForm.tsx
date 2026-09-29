"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LoaderCircle, LogIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackURL = searchParams.get("redirect_url") || "/connect-extension";
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await authClient.signIn.email({
      callbackURL,
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });

    if (result.error) {
      setError(result.error.message || "Email hoặc mật khẩu không đúng.");
      setPending(false);
      return;
    }

    router.push(callbackURL);
    router.refresh();
  }

  return (
    <section className="glass w-full max-w-md rounded-3xl p-6 sm:p-8">
      <h1 className="text-3xl font-semibold">Đăng nhập Root Access</h1>
      <p className="mt-2 text-sm text-muted-foreground">Tiếp tục project và lịch sử AI của bạn.</p>
      <form action={submit} className="mt-6 grid gap-4">
        <label className="grid gap-2 text-sm">Email<Input name="email" type="email" autoComplete="email" required /></label>
        <label className="grid gap-2 text-sm">Mật khẩu<Input name="password" type="password" autoComplete="current-password" minLength={8} required /></label>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button className="btn-liquid h-11" disabled={pending}>{pending ? <LoaderCircle className="animate-spin" /> : <LogIn />}Đăng nhập</Button>
      </form>
      {googleEnabled ? (
        <Button
          type="button"
          variant="outline"
          className="mt-3 h-11 w-full"
          onClick={() => authClient.signIn.social({ callbackURL, provider: "google" })}
        >
          Tiếp tục với Google
        </Button>
      ) : null}
      <p className="mt-5 text-center text-sm text-muted-foreground">Chưa có tài khoản? <Link href="/sign-up" className="font-medium text-primary">Đăng ký</Link></p>
    </section>
  );
}
