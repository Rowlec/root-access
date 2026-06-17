"use client";

import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-svh bg-background px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 rounded-lg border border-border bg-muted/40 p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{t("badge")}</Badge>
          <AlertTriangle
            aria-hidden="true"
            className="size-5 text-destructive"
          />
        </div>

        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" className="h-10" onClick={unstable_retry}>
            <RefreshCcw aria-hidden="true" />
            {t("retry")}
          </Button>
          <Button asChild variant="outline" className="h-10">
            <Link href="/">
              <Home aria-hidden="true" />
              {t("home")}
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
