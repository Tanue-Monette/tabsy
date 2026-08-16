import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { isValidLocale, type Locale } from "@/app/lib/i18n";
import PwaInstallPrompt from "@/app/components/PwaInstallPrompt";
import SyncStatusBadge from "@/app/components/SyncStatusBadge";
import "../globals.css";

export const metadata: Metadata = {
  title: "Tabsy - Merchant App",
  description: "Track customer debts and payments for your shop",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tabsy",
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
  width: "device-width",
  initialScale: 1,
};

export function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }];
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();

  return (
    <html lang={lang} className="light">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SyncStatusBadge />
        {children}
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
