import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import NavBar from "@/components/navbar";
import Footer from "@/components/footer";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { ClientSupportProvider } from "@/components/support-provider";
import { CookieConsent } from "@/components/cookie-consent";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "5GPhones",
  description: "Your one-stop shop for 5G phones",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Get messages for the locale
  const messages = (await import(`../../../messages/${locale}.json`)).default;

  return (
    <html lang={locale} className='scroll-smooth'>
      <body className={inter.className}>
        {" "}
        <NextIntlClientProvider locale={locale} messages={messages}>
          {" "}
          <Providers>
            <ClientSupportProvider>
              <Toaster />
              <NavBar />
              <main className='min-h-screen'>{children}</main>
              <Footer />
              <CookieConsent />
            </ClientSupportProvider>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
