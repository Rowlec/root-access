"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallbackPage() {
  return (
    <main className="grid min-h-svh place-items-center px-5 text-foreground">
      <div className="glass rounded-3xl p-5">
        <AuthenticateWithRedirectCallback />
      </div>
    </main>
  );
}
