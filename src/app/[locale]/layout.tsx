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
import { ChatSupportBubble } from '@/components/chat-support-bubble';
import { generateSEOMetadata, PageType } from "@/lib/seo";
import OrganizationStructuredData from "@/components/seo/organization-structured-data";
import SEODebugger from "@/components/seo/seo-debugger";

const inter = Inter({ subsets: ["latin"] });

// Generate metadata for the layout
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  
  return generateSEOMetadata({
    pageType: PageType.HOME,
    locale,
  });
}

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
        {" "}        <NextIntlClientProvider locale={locale} messages={messages}>
          {" "}
          <Providers>
                         <Toaster />
              <OrganizationStructuredData locale={locale} />
              <NavBar />              <main className='min-h-screen'>{children}</main>
              <ChatSupportBubble />
              <Footer />
              <CookieConsent />
              <SEODebugger />
            
          </Providers>
    
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
