import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { routing } from '@/i18n/routing';
import { seoConfig } from '@/lib/seo';

export async function GET() {
  const supabase = await createClient();
  
  // Get all products for sitemap
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, updated_at')
    .eq('active', true);

  // Get all categories for sitemap
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug, updated_at')
    .eq('active', true);

  // Get all repair services for sitemap
  const { data: repairServices } = await supabase
    .from('repair_services')
    .select('id, slug, updated_at')
    .eq('active', true);

  const sitemap: MetadataRoute.Sitemap = [];

  // Add main pages for each locale
  for (const locale of routing.locales) {
    // Homepage
    sitemap.push({
      url: `${seoConfig.siteUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
      alternates: {
        languages: Object.fromEntries(
          routing.locales.map(loc => [loc, `${seoConfig.siteUrl}/${loc}`])
        ),
      },
    });

    // Static pages
    const staticPages = [
      { path: '/products', priority: 0.9, changeFrequency: 'daily' as const },
      { path: '/repair', priority: 0.8, changeFrequency: 'weekly' as const },
      { path: '/about', priority: 0.7, changeFrequency: 'monthly' as const },
      { path: '/contact', priority: 0.7, changeFrequency: 'monthly' as const },
      { path: '/trade-in', priority: 0.8, changeFrequency: 'weekly' as const },
      { path: '/refurbished', priority: 0.8, changeFrequency: 'weekly' as const },
    ];

    staticPages.forEach(page => {
      sitemap.push({
        url: `${seoConfig.siteUrl}/${locale}${page.path}`,
        lastModified: new Date(),
        changeFrequency: page.changeFrequency,
        priority: page.priority,
        alternates: {
          languages: Object.fromEntries(
            routing.locales.map(loc => [loc, `${seoConfig.siteUrl}/${loc}${page.path}`])
          ),
        },
      });
    });

    // Product pages
    if (products) {
      products.forEach(product => {
        sitemap.push({
          url: `${seoConfig.siteUrl}/${locale}/products/${product.slug}`,
          lastModified: new Date(product.updated_at),
          changeFrequency: 'weekly',
          priority: 0.8,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map(loc => [loc, `${seoConfig.siteUrl}/${loc}/products/${product.slug}`])
            ),
          },
        });
      });
    }

    // Category pages
    if (categories) {
      categories.forEach(category => {
        sitemap.push({
          url: `${seoConfig.siteUrl}/${locale}/categories/${category.slug}`,
          lastModified: new Date(category.updated_at),
          changeFrequency: 'weekly',
          priority: 0.7,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map(loc => [loc, `${seoConfig.siteUrl}/${loc}/categories/${category.slug}`])
            ),
          },
        });
      });
    }

    // Repair service pages
    if (repairServices) {
      repairServices.forEach(service => {
        sitemap.push({
          url: `${seoConfig.siteUrl}/${locale}/repair/${service.slug}`,
          lastModified: new Date(service.updated_at),
          changeFrequency: 'monthly',
          priority: 0.6,
          alternates: {
            languages: Object.fromEntries(
              routing.locales.map(loc => [loc, `${seoConfig.siteUrl}/${loc}/repair/${service.slug}`])
            ),
          },
        });
      });
    }
  }

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemap.map(entry => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastModified instanceof Date ? entry.lastModified.toISOString() : entry.lastModified}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority}</priority>
    ${entry.alternates?.languages ? Object.entries(entry.alternates.languages).map(([lang, url]) => 
      `<xhtml:link rel="alternate" hreflang="${lang}" href="${url}" />`
    ).join('\n    ') : ''}
  </url>
`).join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
