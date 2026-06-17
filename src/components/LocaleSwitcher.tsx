"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import {
  localeCookieName,
  locales,
  type Locale,
} from "@/i18n/config";
import { cn } from "@/lib/utils";

type LocaleSwitcherProps = {
  className?: string;
};

const localeCookieMaxAge = 60 * 60 * 24 * 365;
const localeStorageKey = "root-access:locale";

function writeLocaleCookie(locale: Locale) {
  document.cookie = `${localeCookieName}=${locale}; path=/; max-age=${localeCookieMaxAge}; SameSite=Lax`;
}

function readStoredLocale() {
  try {
    const storedLocale = window.localStorage.getItem(localeStorageKey);

    if (!storedLocale) {
      return null;
    }

    if (locales.includes(storedLocale as Locale)) {
      return storedLocale as Locale;
    }

    window.localStorage.removeItem(localeStorageKey);
    return null;
  } catch {
    return null;
  }
}

function writeStoredLocale(locale: Locale) {
  try {
    window.localStorage.setItem(localeStorageKey, locale);
  } catch {
    return;
  }
}

export function LocaleSwitcher({ className }: LocaleSwitcherProps) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const t = useTranslations("LocaleSwitcher");

  useEffect(() => {
    const storedLocale = readStoredLocale();

    if (!storedLocale || storedLocale === locale) {
      return;
    }

    writeLocaleCookie(storedLocale);
    router.refresh();
  }, [locale, router]);

  function handleLocaleChange(nextLocale: Locale) {
    writeStoredLocale(nextLocale);

    if (nextLocale === locale) {
      return;
    }

    writeLocaleCookie(nextLocale);
    router.refresh();
  }

  return (
    <div
      aria-label={t("ariaLabel")}
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-background p-1 shadow-sm",
        className,
      )}
      role="group"
    >
      <Languages
        aria-hidden="true"
        className="mx-1 size-4 text-muted-foreground"
      />
      {locales.map((option) => (
        <Button
          key={option}
          type="button"
          variant={option === locale ? "secondary" : "ghost"}
          size="xs"
          className="h-7 min-w-9 rounded-md px-2"
          aria-pressed={option === locale}
          onClick={() => handleLocaleChange(option)}
        >
          {option === "vi" ? t("options.vi") : t("options.en")}
        </Button>
      ))}
    </div>
  );
}
