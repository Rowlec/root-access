import { useTranslations } from "next-intl";

export function FooterDisclaimer() {
  const t = useTranslations("FooterDisclaimer");

  return (
    <footer className="border-t border-border/60 bg-background/35 px-5 py-5 text-sm leading-6 text-muted-foreground backdrop-blur-xl sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">{t("body")}</div>
    </footer>
  );
}
