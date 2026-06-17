import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("NotFoundPage");

  return (
    <main className="min-h-svh bg-background px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 rounded-lg border border-border bg-muted/40 p-6 shadow-sm sm:p-8">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{t("badge")}</Badge>
          <SearchX aria-hidden="true" className="size-5 text-muted-foreground" />
        </div>

        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-base leading-7 text-muted-foreground">
            {t("description")}
          </p>
        </div>

        <Button asChild className="h-10 w-fit">
          <Link href="/">{t("home")}</Link>
        </Button>
      </section>
    </main>
  );
}
