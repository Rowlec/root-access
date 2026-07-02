import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { InternalDashboard } from "@/components/proposal/InternalDashboard";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const t = await getTranslations("IntelligenceDashboard");

  return (
    <main className="min-h-svh bg-background px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8">
        <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              {t("eyebrow")}
            </p>
            <h1 className="text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl">
              {t("title")}
            </h1>
            <p className="text-base leading-7 text-muted-foreground sm:text-lg">
              {t("description")}
            </p>
          </div>
          <Button asChild variant="outline" className="h-10 w-fit">
            <Link href="/">{t("back")}</Link>
          </Button>
        </section>

        <InternalDashboard />
      </div>
    </main>
  );
}
