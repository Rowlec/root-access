import { getTranslations } from "next-intl/server";

import { CheckoutClient } from "@/components/proposal/CheckoutClient";

export default async function CheckoutPage() {
  const t = await getTranslations("CheckoutPage");

  return (
    <main className="min-h-svh bg-background px-5 py-10 sm:px-8 sm:py-14 lg:px-10">
      <div className="mx-auto grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_22rem] lg:items-start">
        <section className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">
            {t("eyebrow")}
          </p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-foreground sm:text-5xl">
            {t("title")}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            {t("description")}
          </p>
        </section>
        <CheckoutClient />
      </div>
    </main>
  );
}
