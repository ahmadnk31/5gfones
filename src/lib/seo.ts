import { Metadata } from "next";
import { getTranslations } from "next-intl/server";

// SEO Configuration
export const seoConfig = {
  siteName: "5GPhones",
  siteUrl: process.env.NEXT_PUBLIC_BASE_URL || "https://5gphones.com",
  twitterHandle: "@5gphones",
  defaultImage: "/images/og-default.png",
  favicon: "/favicon.ico",
};

// Common meta tags for all pages
export const commonMetaTags = {
  generator: "Next.js",
  colorScheme: "light dark",
  creator: "5GPhones Team",
  publisher: "5GPhones",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
} as const;

// Page types for structured data
export enum PageType {
  HOME = "home",
  PRODUCT = "product",
  CATEGORY = "category",
  REPAIR = "repair",
  BLOG = "blog",
  ABOUT = "about",
  CONTACT = "contact",
    TERMS = "terms",
    PRIVACY = "privacy",
    SUSTAINABILITY= "sustainability",
    KEY='key'
}

interface SEOProps {
  pageType?: PageType;
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  locale?: string;
  alternateLocales?: string[];
  customTitle?: string;
  customDescription?: string;
  customKeywords?: string[];
  customImage?: string;
  customUrl?: string;
  product?: {
    name: string;
    price?: number;
    currency?: string;
    availability?: string;
    brand?: string;
    category?: string;
    sku?: string;
    images?: string[];
  };
  article?: {
    publishedTime: string;
    modifiedTime?: string;
    author: string;
    section?: string;
    tags?: string[];
  };
  noIndex?: boolean;
  canonical?: string;
}

export async function generateSEOMetadata(
  props: SEOProps
): Promise<Metadata> {
  const locale = props.locale || "en";
  const t = await getTranslations({ locale, namespace: "seo" });
  
  const {
    pageType = PageType.HOME,
    customTitle,
    customDescription,
    customKeywords = [],
    customImage = seoConfig.defaultImage,
    customUrl,
    alternateLocales = ["en", "nl"],
    product,
    article,
    noIndex = false,
    canonical,
  } = props;
  // Generate dynamic title and description
  const siteTitle = t("siteTitle");
  const siteDescription = t("siteDescription");
  
  const title = customTitle 
    ? `${customTitle} | ${siteTitle}`
    : siteTitle;
    
  const description = customDescription || siteDescription;

  // Build the full URL
  const fullUrl = customUrl ? `${seoConfig.siteUrl}${customUrl}` : seoConfig.siteUrl;
  const imageUrl = customImage?.startsWith("http") ? customImage : `${seoConfig.siteUrl}${customImage}`;

  // Generate keywords
  const allKeywords = [...customKeywords];
  
  // Add default keywords based on page type
  switch (pageType) {
    case PageType.PRODUCT:
      allKeywords.push('smartphone', 'mobile phone', '5G', 'technology');
      break;
    case PageType.REPAIR:
      allKeywords.push('repair service', 'phone repair', 'professional repair');
      break;
    case PageType.CATEGORY:
      allKeywords.push('mobile accessories', 'phone accessories', 'technology');
      break;
    default:
      allKeywords.push('5G phones', 'smartphones', 'mobile technology');
  }

  // Generate structured data based on page type
  let structuredData: any = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteTitle,
    url: seoConfig.siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${seoConfig.siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  if (pageType === PageType.PRODUCT && product) {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description,
      image: product.images || [imageUrl],
      brand: {
        "@type": "Brand",
        name: product.brand || siteTitle,
      },
      offers: product.price ? {
        "@type": "Offer",
        price: product.price,
        priceCurrency: product.currency || "EUR",
        availability: `https://schema.org/${product.availability || "InStock"}`,
        seller: {
          "@type": "Organization",
          name: siteTitle,
        },
      } : undefined,
      sku: product.sku,
      category: product.category,
    };
  }
  if (pageType === PageType.BLOG && article) {
    structuredData = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: customTitle,
      description,
      image: imageUrl,
      datePublished: article.publishedTime,
      dateModified: article.modifiedTime || article.publishedTime,
      author: {
        "@type": "Person",
        name: article.author,
      },
      publisher: {
        "@type": "Organization",
        name: siteTitle,
        logo: {
          "@type": "ImageObject",
          url: `${seoConfig.siteUrl}/logo.png`,
        },
      },
      mainEntityOfPage: {
        "@type": "WebPage",
        "@id": fullUrl,
      },
    };
  }

  // Generate alternate language links
  const alternates: Record<string, string> = {};
  alternateLocales.forEach((loc) => {
    alternates[loc] = customUrl ? `${seoConfig.siteUrl}/${loc}${customUrl}` : `${seoConfig.siteUrl}/${loc}`;
  });

  const metadata: Metadata = {
    title,
    description,
    keywords: allKeywords.join(", "),
    ...commonMetaTags,
    metadataBase: new URL(seoConfig.siteUrl),
    alternates: {
      canonical: canonical || fullUrl,
      languages: alternates,
    },
    openGraph: {
      title,
      description,
      url: fullUrl,
      siteName: siteTitle,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      creator: seoConfig.twitterHandle,
      site: seoConfig.twitterHandle,
    },
    icons: {
      icon: seoConfig.favicon,
      apple: "/apple-touch-icon.png",
    },
    manifest: "/manifest.json",
    other: {
      "application/ld+json": JSON.stringify(structuredData),
    },
  };

  // Apply noIndex if specified
  if (noIndex) {
    metadata.robots = {
      index: false,
      follow: false,
    };
  }

  return metadata;
}

// Helper function to generate meta keywords from content
export function generateKeywords(
  content: string,
  additionalKeywords: string[] = []
): string[] {
  const commonWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "is", "are", "was", "were", "be", "been", "have",
    "has", "had", "will", "would", "could", "should", "may", "might",
  ]);

  const words = content
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !commonWords.has(word));

  const frequency = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const keywords = Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  return [...additionalKeywords, ...keywords];
}

// Generate sitemap data
export interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
  alternates?: Record<string, string>;
}

export function generateSitemapEntry(
  path: string,
  options: {
    lastModified?: Date;
    changeFrequency?: SitemapEntry["changeFrequency"];
    priority?: number;
    locales?: string[];
  } = {}
): SitemapEntry {
  const {
    lastModified = new Date(),
    changeFrequency = "weekly",
    priority = 0.5,
    locales = ["en", "nl"],
  } = options;

  const alternates: Record<string, string> = {};
  locales.forEach((locale) => {
    alternates[locale] = `${seoConfig.siteUrl}/${locale}${path}`;
  });

  return {
    url: `${seoConfig.siteUrl}${path}`,
    lastModified,
    changeFrequency,
    priority,
    alternates,
  };
}
