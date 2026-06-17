import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { FooterDisclaimer } from "@/components/FooterDisclaimer";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

function getSiteUrl() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined) ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

  try {
    return new URL(configuredUrl ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");
  const locale = await getLocale();
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: getSiteUrl(),
    title,
    description,
    applicationName: "Root Access",
    authors: [{ name: "Root Access" }],
    creator: "Root Access",
    publisher: "Root Access",
    keywords: [
      "startup proposal",
      "FPT University",
      "business students",
      "AI workflow",
      "academic integrity",
    ],
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: "/favicon.ico",
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      locale: locale === "vi" ? "vi_VN" : "en_US",
      siteName: "Root Access",
      type: "website",
      url: "/",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} h-full scroll-smooth antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <FooterDisclaimer />
        </NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
