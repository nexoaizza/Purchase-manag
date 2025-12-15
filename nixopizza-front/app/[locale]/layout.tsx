import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Nunito, Cairo } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { Suspense } from "react";
import { Toaster } from "react-hot-toast";
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { setRequestLocale } from 'next-intl/server';

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

type Props = {
  children: React.ReactNode;
  params: { locale: string } | Promise<{ locale: string }>;
};
export default async function LocalLayout({ children, params }: Props) {
   const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

   // 2️⃣ Load messages
  let messages;
  try {
    messages = (await import(`@/messages/${locale}.json`)).default;
  } catch (error) {
    console.error(error);
    notFound();
  }

  // make the locale available to next-intl APIs (enables static rendering)
  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        className={`${locale === 'ar' ? cairo.className : nunito.className} ${GeistSans.variable} ${GeistMono.variable} ${nunito.variable} ${cairo.variable}`}
      >
      <NextIntlClientProvider messages={messages}>
        <Toaster position="top-center" />
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        <Analytics debug={false} />
      </NextIntlClientProvider>
      </body>
    </html>
  );
}
