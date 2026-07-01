"use client";

import { CheckCircle2, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { creditPlanStorageKey } from "@/lib/credit-policy";

export function CheckoutClient() {
  const t = useTranslations("CheckoutPage");
  const router = useRouter();

  function activateProDemo() {
    try {
      window.localStorage.setItem(creditPlanStorageKey, "pro");
    } catch {
      return;
    }

    router.back();
  }

  return (
    <section className="rounded-lg border border-border bg-background p-5 shadow-sm">
      <div className="flex items-start gap-3 border-b border-border pb-4">
        <div className="flex size-10 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
          <CreditCard aria-hidden="true" className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {t("card.title")}
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("card.description")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 py-5">
        {["prompts", "reviews", "improvements"].map((feature) => (
          <div key={feature} className="flex gap-3 text-sm leading-6">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0 text-emerald-600"
            />
            <span className="text-muted-foreground">
              {t(`card.features.${feature}`)}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm leading-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">{t("card.priceLabel")}</span>
          <span className="text-xl font-semibold text-foreground">
            {t("card.price")}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {t("card.fakePayment")}
        </p>
      </div>

      <Button className="mt-5 h-11 w-full" onClick={activateProDemo}>
        {t("card.action")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="mt-2 h-10 w-full hover:bg-muted"
        onClick={() => router.back()}
      >
        {t("card.back")}
      </Button>
    </section>
  );
}
