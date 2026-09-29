import { Suspense } from "react";

import { SignInForm } from "@/components/auth/SignInForm";

export default function SignInPage() {
  return (
    <main className="grid min-h-svh place-items-center px-5 py-10">
      <Suspense fallback={<div className="h-96 w-full max-w-md animate-pulse rounded-3xl bg-muted/40" />}>
        <SignInForm googleEnabled={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)} />
      </Suspense>
    </main>
  );
}
