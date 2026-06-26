import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Button } from "@/components/ui/button";

export function Hero() {
  const t = useTranslations("Hero");
  const workflowSteps = [
    t("steps.problemDiscovery"),
    t("steps.targetCustomer"),
    t("steps.valueProposition"),
    t("steps.proposalDraft"),
  ];

  return (
    <section className="w-full border-b border-border bg-background">
      <div className="mx-auto grid min-h-[78svh] w-full max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:px-10 lg:py-18">
        <div className="flex max-w-2xl flex-col items-start gap-6">
          <div className="flex w-full flex-wrap items-center justify-between gap-3">
            <div className="inline-flex h-8 items-center rounded-lg border border-border bg-muted/70 px-3 text-sm font-medium text-muted-foreground">
              {t("brand")}
            </div>
            <LocaleSwitcher />
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-normal text-foreground sm:text-5xl lg:text-6xl">
              {t("title")}
            </h1>
            <p className="max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {t("subtitle")}
            </p>
          </div>

          <Button asChild size="lg" className="h-12 px-5 text-base">
            <a href="#goal-form">
              {t("action")}
              <ArrowRight aria-hidden="true" />
            </a>
          </Button>
        </div>

        <div className="w-full rounded-lg border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5 lg:p-6">
          <div className="mb-5 flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("workflowName")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("guidedSteps")}
              </p>
            </div>
            <div className="shrink-0 rounded-lg bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
              {t("badge")}
            </div>
          </div>

          <div className="space-y-3">
            {workflowSteps.map((step, index) => (
              <div
                key={step}
                className="flex min-h-14 items-center gap-3 rounded-lg border border-border bg-background px-3.5 transition-colors hover:bg-muted/40"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="size-5 text-emerald-600"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {t("stepLabel", { step: index + 1 })}
                  </p>
                  <p className="line-clamp-1 text-sm text-muted-foreground">
                    {step}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
