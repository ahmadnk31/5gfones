'use client';

import { useEffect, useState } from 'react';
import { useSEO } from '@/hooks/use-seo';

interface SEOData {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterTitle: string;
  twitterDescription: string;
  structuredData: any[];
}

export default function SEODebugger() {
  const [seoData, setSeoData] = useState<SEOData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { canonicalUrl } = useSEO();

  useEffect(() => {
    const extractSEOData = () => {
      const title = document.title;
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
      const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
      const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
      const twitterTitle = document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || '';
      const twitterDescription = document.querySelector('meta[name="twitter:description"]')?.getAttribute('content') || '';

      // Extract structured data
      const structuredDataScripts = document.querySelectorAll('script[type="application/ld+json"]');
      const structuredData = Array.from(structuredDataScripts).map(script => {
        try {
          return JSON.parse(script.textContent || '');
        } catch {
          return null;
        }
      }).filter(Boolean);

      setSeoData({
        title,
        description,
        keywords,
        canonical,
        ogTitle,
        ogDescription,
        ogImage,
        twitterTitle,
        twitterDescription,
        structuredData,
      });
    };

    // Extract data on mount and when DOM changes
    extractSEOData();
    
    const observer = new MutationObserver(() => {
      extractSEOData();
    });
    
    observer.observe(document.head, { childList: true, subtree: true });
    
    return () => observer.disconnect();
  }, []);

  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm z-50 hover:bg-blue-700"
      >
        SEO Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-y-auto z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-sm">SEO Debug Info</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      {seoData && (
        <div className="space-y-2 text-xs">
          <div>
            <strong>Title:</strong>
            <div className="bg-gray-100 p-1 rounded mt-1">{seoData.title}</div>
          </div>
          
          <div>
            <strong>Description:</strong>
            <div className="bg-gray-100 p-1 rounded mt-1">{seoData.description}</div>
          </div>
          
          {seoData.keywords && (
            <div>
              <strong>Keywords:</strong>
              <div className="bg-gray-100 p-1 rounded mt-1">{seoData.keywords}</div>
            </div>
          )}
          
          <div>
            <strong>Canonical:</strong>
            <div className="bg-gray-100 p-1 rounded mt-1 break-all">{seoData.canonical}</div>
          </div>
          
          {seoData.ogTitle && (
            <div>
              <strong>OG Title:</strong>
              <div className="bg-gray-100 p-1 rounded mt-1">{seoData.ogTitle}</div>
            </div>
          )}
          
          {seoData.structuredData.length > 0 && (
            <div>
              <strong>Structured Data:</strong>
              <div className="bg-gray-100 p-1 rounded mt-1">
                {seoData.structuredData.length} schema(s) found
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
