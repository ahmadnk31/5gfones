"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

interface Banner {
  id: number;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  button_text: string | null;
  target_page: string | null;
}

interface BannerCarouselProps {
  targetPage?: string;
}

export default function BannerCarousel({ targetPage = "home" }: BannerCarouselProps) {
  const supabase = createClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const localr= useLocale();
  useEffect(() => {
    const fetchBanners = async () => {
      setLoading(true);
      try {
        // Get current date for filtering
        const now = new Date().toISOString();
        
        // Fetch banners that are active and within date range
        const { data, error } = await supabase
          .from("banners")
          .select("id, title, subtitle, image_url, link_url, button_text, target_page")
          .eq("is_active", true)
          .lte("start_date", now)
          .gte("end_date", now)
          .eq("target_page", targetPage)
          .order("display_order", { ascending: true });

        if (error) throw error;
        setBanners(data || []);
      } catch (error) {
        console.error("Error fetching banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();

    // Auto-rotate banners every 5 seconds
    const interval = setInterval(() => {
      if (banners.length > 1) {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [supabase, targetPage, banners.length]);

  const goToPrevious = () => {
    if (banners.length > 1) {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? banners.length - 1 : prevIndex - 1));
    }
  };

  const goToNext = () => {
    if (banners.length > 1) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[300px] md:h-[400px] bg-gray-100 animate-pulse rounded-lg"></div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];  return (
    <div className="banner-carousel relative w-full h-[85vh] bg-gray-100 rounded-lg overflow-hidden">
      {/* Banner Images with transitions */}
      <div className="relative w-full h-full">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`banner-slide absolute inset-0 ${
              index === currentIndex ? 'active' : 'inactive'
            }`}
          >
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              priority={index === 0}
              className="object-cover h-full w-full"
              sizes="(max-width: 768px) 100vw, 1200px"
            />
          </div>
        ))}
      </div>
        {/* Enhanced overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20 z-10"></div>
      <div className="absolute inset-0 bg-black/20 z-10"></div>
      
      {/* Banner Content with enhanced readability */}
      <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12 z-20">
        <div className="max-w-lg">
          <div className="banner-content space-y-4">
            <h2 className="text-2xl md:text-4xl font-bold mb-2 text-white banner-text-shadow">
              {currentBanner.title}
            </h2>
            {currentBanner.subtitle && (
              <p className="text md:text-lg mb-6 text-white/95 banner-text-shadow leading-relaxed">
                {currentBanner.subtitle}
              </p>
            )}
            {currentBanner.link_url && (
              <Link href={currentBanner.link_url} className="inline-block">
                <Button 
                  className="mt-4 shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-105" 
                  size="lg"
                >
                  {currentBanner.button_text || "Learn More"}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>      {/* Enhanced Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="banner-nav-button absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/20 z-20"
            onClick={goToPrevious}
          >
            <ChevronLeft size={28} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="banner-nav-button absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/20 z-20"
            onClick={goToNext}
          >
            <ChevronRight size={28} />
          </Button>
        </>
      )}
      
      {/* Enhanced Indicator Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-20">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`banner-indicator h-3 w-3 rounded-full ${
                index === currentIndex 
                  ? "bg-white w-8 shadow-lg" 
                  : "bg-white/60 hover:bg-white/80"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
