'use client';

import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export interface SEOHookReturn {
  locale: string;
  pathname: string;
  canonicalUrl: string;
  alternateUrls: Record<string, string>;
}

export function useSEO(): SEOHookReturn {
  const locale = useLocale();
  const pathname = usePathname();
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://5gphones.com';
  
  // Remove locale from pathname to get the base path
  const basePath = pathname.replace(`/${locale}`, '') || '/';
  
  // Generate canonical URL
  const canonicalUrl = `${baseUrl}/${locale}${basePath}`;
  
  // Generate alternate URLs for different locales
  const locales = ['en', 'nl']; // Should match your routing.locales
  const alternateUrls = Object.fromEntries(
    locales.map(loc => [loc, `${baseUrl}/${loc}${basePath}`])
  );

  return {
    locale,
    pathname: basePath,
    canonicalUrl,
    alternateUrls,
  };
}

export default useSEO;
