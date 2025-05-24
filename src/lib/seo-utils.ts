import { generateSEOMetadata, PageType } from '@/lib/seo';
import { Metadata } from 'next';

// Interface for product data from database
interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  brand?: string;
  model?: string;
  slug: string;
  image_url?: string;
  category?: {
    name: string;
    slug: string;
  };
  condition?: string;
  features?: string[];
}

// Interface for category data from database
interface Category {
  id: string;
  name: string;
  description?: string;
  slug: string;
  image_url?: string;
  parent_category?: {
    name: string;
    slug: string;
  };
}

// Generate SEO metadata for product pages
export async function generateProductSEO(
  product: Product,
  locale: string
): Promise<Metadata> {
  const customTitle = `${product.name}${product.brand ? ` - ${product.brand}` : ''}`;
  const customDescription = product.description || 
    `Shop ${product.name}${product.brand ? ` by ${product.brand}` : ''} at 5GPhones. ${product.condition === 'refurbished' ? 'Certified refurbished' : 'Brand new'} with warranty and fast shipping.`;

  const keywords = [
    product.name.toLowerCase(),
    product.brand?.toLowerCase(),
    product.model?.toLowerCase(),
    product.category?.name.toLowerCase(),
    product.condition === 'refurbished' ? 'refurbished' : 'new',
    '5g phone',
    'smartphone',
    'buy online',
    'warranty',
    'belgium'
  ].filter(Boolean) as string[];

  return generateSEOMetadata({
    pageType: PageType.PRODUCT,
    locale,
    customTitle,
    customDescription,
    customKeywords: keywords,
    customImage: product.image_url,
    customUrl: `/${locale}/products/${product.slug}`,
  });
}

// Generate SEO metadata for category pages
export async function generateCategorySEO(
  category: Category,
  locale: string,
  productCount?: number
): Promise<Metadata> {
  const customTitle = `${category.name} - Premium Mobile Technology`;
  const customDescription = category.description || 
    `Browse ${category.name.toLowerCase()} at 5GPhones. ${productCount ? `${productCount} products available` : 'Wide selection'} with fast shipping and warranty. Find the perfect mobile technology for your needs.`;

  const keywords = [
    category.name.toLowerCase(),
    'mobile phone',
    'smartphone',
    'accessories',
    'buy online',
    'belgium',
    'warranty',
    'fast shipping',
    '5g technology'
  ];

  return generateSEOMetadata({
    pageType: PageType.CATEGORY,
    locale,
    customTitle,
    customDescription,
    customKeywords: keywords,
    customImage: category.image_url,
    customUrl: `/${locale}/categories/${category.slug}`,
  });
}

// Generate SEO metadata for repair service pages
export async function generateRepairServiceSEO(
  serviceName: string,
  serviceDescription: string,
  deviceType: string,
  locale: string,
  slug: string
): Promise<Metadata> {
  const customTitle = `${serviceName} - Professional ${deviceType} Repair`;
  const customDescription = serviceDescription || 
    `Professional ${serviceName.toLowerCase()} for ${deviceType.toLowerCase()}. Expert technicians, quality parts, 90-day warranty. Book your repair appointment today at 5GPhones.`;

  const keywords = [
    serviceName.toLowerCase(),
    deviceType.toLowerCase(),
    'repair service',
    'professional repair',
    'belgium',
    'warranty',
    'expert technicians',
    'same day repair',
    'quality parts'
  ];

  return generateSEOMetadata({
    pageType: PageType.REPAIR,
    locale,
    customTitle,
    customDescription,
    customKeywords: keywords,
    customUrl: `/${locale}/repair/${slug}`,
  });
}

// Generate SEO metadata for search results
export async function generateSearchSEO(
  query: string,
  resultCount: number,
  locale: string
): Promise<Metadata> {
  const customTitle = `Search Results for "${query}" - 5GPhones`;
  const customDescription = `Found ${resultCount} results for "${query}". Shop smartphones, accessories, and repair services with fast shipping and warranty at 5GPhones.`;

  const keywords = [
    query.toLowerCase(),
    'search results',
    'mobile phone',
    'smartphone',
    'accessories',
    'repair service',
    'belgium'
  ];

  return generateSEOMetadata({
    pageType: PageType.HOME, // Use home type for search
    locale,
    customTitle,
    customDescription,
    customKeywords: keywords,
    customUrl: `/${locale}/search?q=${encodeURIComponent(query)}`,
  });
}

// Generate breadcrumb data for product pages
export function generateProductBreadcrumbs(
  product: Product,
  locale: string
): Array<{ name: string; url: string }> {
  const breadcrumbs = [
    { name: locale === 'nl' ? 'Home' : 'Home', url: `/${locale}` },
    { name: locale === 'nl' ? 'Producten' : 'Products', url: `/${locale}/products` },
  ];

  if (product.category) {
    breadcrumbs.push({
      name: product.category.name,
      url: `/${locale}/categories/${product.category.slug}`,
    });
  }

  breadcrumbs.push({
    name: product.name,
    url: `/${locale}/products/${product.slug}`,
  });

  return breadcrumbs;
}

// Generate breadcrumb data for category pages
export function generateCategoryBreadcrumbs(
  category: Category,
  locale: string
): Array<{ name: string; url: string }> {
  const breadcrumbs = [
    { name: locale === 'nl' ? 'Home' : 'Home', url: `/${locale}` },
    { name: locale === 'nl' ? 'Producten' : 'Products', url: `/${locale}/products` },
  ];

  if (category.parent_category) {
    breadcrumbs.push({
      name: category.parent_category.name,
      url: `/${locale}/categories/${category.parent_category.slug}`,
    });
  }

  breadcrumbs.push({
    name: category.name,
    url: `/${locale}/categories/${category.slug}`,
  });

  return breadcrumbs;
}
