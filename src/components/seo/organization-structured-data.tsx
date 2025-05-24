'use client';

import { useEffect } from 'react';
import { seoConfig } from '@/lib/seo';

interface OrganizationStructuredDataProps {
  locale: string;
}

export default function OrganizationStructuredData({ locale }: OrganizationStructuredDataProps) {
  useEffect(() => {
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: seoConfig.siteName,
      url: seoConfig.siteUrl,
      logo: `${seoConfig.siteUrl}/images/logo.png`,
      sameAs: [
        `https://twitter.com/${seoConfig.twitterHandle.replace('@', '')}`,
        // Add other social media URLs here
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+31-20-123-4567', // Replace with actual phone number
        contactType: 'Customer Service',
        availableLanguage: ['English', 'Dutch'],
      },
      address: {
        '@type': 'PostalAddress',
        streetAddress: '123 Tech Street', // Replace with actual address
        addressLocality: 'Amsterdam',
        postalCode: '1000 AB',
        addressCountry: 'NL',
      },
      description: locale === 'nl' 
        ? 'Uw vertrouwde partner voor 5G smartphones, reparatiediensten en trade-in opties. Kwaliteit en betrouwbaarheid gegarandeerd.'
        : 'Your trusted partner for 5G smartphones, repair services, and trade-in options. Quality and reliability guaranteed.',
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(structuredData);
    script.id = 'organization-structured-data';

    // Remove existing script if it exists
    const existingScript = document.getElementById('organization-structured-data');
    if (existingScript) {
      existingScript.remove();
    }

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('organization-structured-data');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [locale]);

  return null;
}
