"use client";

import { usePathname } from "next/navigation";

import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import { ProductOnboarding } from "@/components/onboarding/ProductOnboarding";
import { SiteHeader } from "@/components/SiteHeader";

export function RootChrome({
  children,
  isClerkConfigured,
  locale,
}: {
  children: React.ReactNode;
  isClerkConfigured: boolean;
  locale: string;
}) {
  const pathname = usePathname();
  const usesAppChrome = pathname.startsWith("/app") || pathname.startsWith("/admin");

  if (usesAppChrome) {
    return <div className="relative z-10 min-h-full">{children}</div>;
  }

  return (
    <div className="relative z-10 flex min-h-full flex-col">
      <SiteHeader locale={locale} isClerkConfigured={isClerkConfigured} />
      <ProductOnboarding />
      {children}
      <FooterDisclaimer />
    </div>
  );
}
