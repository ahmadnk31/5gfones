import { MetadataRoute } from 'next';
import { seoConfig } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/profile/',
          '/dashboard/',
          '/checkout/',
          '/cart/',
          '/auth/',
          '/private/',
          '/*?*',  // Block URLs with query parameters (except essential ones)
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/_next/',
          '/profile/',
          '/dashboard/',
          '/checkout/',
          '/cart/',
          '/auth/',
          '/private/',
        ],
      },
    ],
    sitemap: `${seoConfig.siteUrl}/sitemap.xml`,
    host: seoConfig.siteUrl,
  };
}
