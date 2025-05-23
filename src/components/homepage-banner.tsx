'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import BannerCarousel from '@/components/banner-carousel';
import { Link } from '@/i18n/navigation';

interface HomepageBannerProps {
  tagline: string;
  subtitle: string;
  buttonLabel: string;
}

export default function HomepageBanner({ tagline, subtitle, buttonLabel }: HomepageBannerProps) {
  const [hasActiveBanners, setHasActiveBanners] = useState<boolean | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const checkBanners = async () => {
      try {
        // Get current date for filtering
        const now = new Date().toISOString();
        
        // Fetch banners that are active and within date range
        const { data, error } = await supabase
          .from("banners")
          .select("id")
          .eq("is_active", true)
          .lte("start_date", now)
          .gte("end_date", now)
          .eq("target_page", "home")
          .limit(1);

        if (error) {
          console.error("Error checking banners:", error);
          setHasActiveBanners(false);
          return;
        }
        
        // If we found at least one active banner for the homepage
        setHasActiveBanners(data && data.length > 0);
      } catch (error) {
        console.error("Error checking banners:", error);
        setHasActiveBanners(false);
      }
    };

    checkBanners();
  }, [supabase]);
  // Show loading skeleton while checking banners
  if (hasActiveBanners === null) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-emerald-50 animate-pulse rounded-lg"></div>
    );
  }

  // If there are active banners, show the carousel
  if (hasActiveBanners) {
    return (
      <section className="mb-8">
        <BannerCarousel targetPage="home" />
      </section>
    );
  }  // If no active banners, show the default banner with emerald green theme
  return (
    <section className='bg-gradient-to-r from-emerald-600 to-green-700 text-white py-16 md:py-24 mb-8'>
      <div className='container mx-auto px-4 max-w-6xl'>
        <div className='max-w-3xl'>
          <h1 className='text-3xl md:text-5xl font-bold mb-4'>
            {tagline || "Get the latest 5G devices and accessories"}
          </h1>
          <p className='text-lg md:text-xl mb-6 opacity-90'>
            {subtitle || "Your premier destination for cutting-edge 5G technology and accessories"}
          </p><Link href='/products'>
            <Button size='lg' className="bg-white text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800">
              {buttonLabel}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
