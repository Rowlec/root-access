"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <main className="grid min-h-svh place-items-center bg-background px-5 text-foreground">
      <div className="rounded-lg border border-border bg-background p-5 shadow-sm">
        <AuthenticateWithRedirectCallback />
      </div>
    </main>
  );
}
