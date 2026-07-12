"use client";

import {
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
  useSignIn,
  useUser,
} from "@clerk/nextjs";
import { LogIn, LogOut, UserCircle, UserPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

type AuthControlsProps = {
  locale: string;
  isClerkConfigured: boolean;
};

function ConfiguredAuthControls({ locale }: Pick<AuthControlsProps, "locale">) {
  const isVietnamese = locale === "vi";
  const [authError, setAuthError] = useState<string | null>(null);
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();
  const { fetchStatus, signIn } = useSignIn();
  const isSignInReady = Boolean(signIn) && fetchStatus !== "fetching";

  async function handleGoogleSignIn() {
    if (!signIn) {
      return;
    }

    setAuthError(null);

    try {
      const result = await signIn.sso({
        redirectCallbackUrl: "/sso-callback",
        redirectUrl: "/",
        strategy: "oauth_google",
      });

      if (result.error) {
        throw result.error;
      }
    } catch {
      setAuthError(
        isVietnamese
          ? "Không thể mở đăng nhập Google."
          : "Could not start Google sign-in.",
      );
    }
  }

  if (!isUserLoaded) {
    return (
      <div className="h-9 w-24 animate-pulse rounded-lg border border-border bg-muted/40" />
    );
  }

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <UserButton />
        <SignOutButton redirectUrl="/">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="btn-glass h-9 rounded-full px-3"
          >
            <LogOut aria-hidden="true" />
            <span className="hidden lg:inline">
              {isVietnamese ? "Đăng xuất" : "Sign out"}
            </span>
          </Button>
        </SignOutButton>
      </div>
    );
  }

  return (
    <div className="flex flex-nowrap items-center gap-1.5 sm:gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="btn-glass hidden h-9 rounded-full px-3 font-semibold lg:inline-flex"
        disabled={!isSignInReady}
        onClick={handleGoogleSignIn}
      >
        <span aria-hidden="true" className="text-sm font-semibold">
          G
        </span>
        Google
      </Button>
      <SignInButton mode="modal">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="btn-glass h-9 rounded-full px-3"
          aria-label={isVietnamese ? "Đăng nhập" : "Sign in"}
          title={isVietnamese ? "Đăng nhập" : "Sign in"}
        >
          <LogIn aria-hidden="true" />
          <span className="hidden lg:inline">Email</span>
        </Button>
      </SignInButton>
      <SignUpButton mode="modal">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="btn-liquid h-9 rounded-full px-3 text-primary-foreground"
          aria-label={isVietnamese ? "Đăng ký" : "Sign up"}
          title={isVietnamese ? "Đăng ký" : "Sign up"}
        >
          <UserPlus aria-hidden="true" />
          <span className="hidden lg:inline">
            {isVietnamese ? "Đăng ký" : "Sign up"}
          </span>
        </Button>
      </SignUpButton>
      {authError ? (
        <span className="text-xs text-destructive">{authError}</span>
      ) : null}
    </div>
  );
}

export function AuthControls({
  locale,
  isClerkConfigured,
}: AuthControlsProps) {
  const isVietnamese = locale === "vi";

  if (!isClerkConfigured) {
    return (
      <div
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-muted/30 px-2 text-sm text-muted-foreground sm:px-3"
        title={isVietnamese ? "Chế độ khách" : "Guest mode"}
      >
        <UserCircle aria-hidden="true" className="size-4" />
        <span className="hidden lg:inline">Guest</span>
      </div>
    );
  }

  return <ConfiguredAuthControls locale={locale} />;
}
