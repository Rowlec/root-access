import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("NotFoundPage");

  return (
    <main className="min-h-svh px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <section className="glass mx-auto flex w-full max-w-6xl flex-col gap-5 rounded-3xl p-6 sm:p-8">
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

        <Button
          asChild
          className="btn-liquid h-10 w-fit rounded-full px-4 text-primary-foreground"
        >
          <Link href="/">{t("home")}</Link>
        </Button>
      </section>
    </main>
  );
}
