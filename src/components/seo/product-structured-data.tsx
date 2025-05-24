'use client';

import { useEffect } from 'react';

interface ProductStructuredDataProps {
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    currency?: string;
    image_url?: string;
    brand?: string;
    model?: string;
    condition?: string;
    availability?: boolean;
    rating?: number;
    reviewCount?: number;
    slug: string;
  };
  locale: string;
}

export default function ProductStructuredData({ product, locale }: ProductStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.image_url ? `${window.location.origin}${product.image_url}` : undefined,
      brand: product.brand ? {
        '@type': 'Brand',
        name: product.brand,
      } : undefined,
      model: product.model,
      offers: {
        '@type': 'Offer',
        price: product.price,
        priceCurrency: product.currency || 'EUR',
        availability: product.availability ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        url: `${window.location.origin}/${locale}/products/${product.slug}`,
        seller: {
          '@type': 'Organization',
          name: '5GPhones',
        },
      },
      aggregateRating: product.rating && product.reviewCount ? {
        '@type': 'AggregateRating',
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      } : undefined,
      condition: product.condition === 'refurbished' ? 'https://schema.org/RefurbishedCondition' : 'https://schema.org/NewCondition',
    };

    // Remove undefined properties
    const cleanedData = JSON.parse(JSON.stringify(structuredData));

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(cleanedData);
    script.id = `product-structured-data-${product.id}`;

    // Remove existing script if it exists
    const existingScript = document.getElementById(`product-structured-data-${product.id}`);
    if (existingScript) {
      existingScript.remove();
    }

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById(`product-structured-data-${product.id}`);
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [product, locale]);

  return null;
}
