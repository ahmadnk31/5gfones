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

  const currentBanner = banners[currentIndex];

  return (
    <div className="relative w-full h-[85vh]  bg-gray-100 rounded-lg overflow-hidden">
      {/* Banner Image */}
      <Image
        src={currentBanner.image_url}
        alt={currentBanner.title}
        fill
        priority
        className="object-cover h-full w-full transition duration-300"
        sizes="(max-width: 768px) 100vw, 1200px"
      />
      
      {/* Banner Content */}
      <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12 bg-gradient-to-r from-black/50 to-transparent">
        <div className="max-w-lg text-white">
          <h2 className="text-2xl md:text-4xl font-bold mb-2">{currentBanner.title}</h2>
          {currentBanner.subtitle && (
            <p className="text-sm md:text-base mb-6">{currentBanner.subtitle}</p>
          )}
          {currentBanner.link_url && (
            <Link href={currentBanner.link_url} className="inline-block">
              <Button className="mt-4" size="lg">
                {currentBanner.button_text || "Learn More"}
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 hover:bg-black/50 text-white"
            onClick={goToPrevious}
          >
            <ChevronLeft size={24} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 hover:bg-black/50 text-white"
            onClick={goToNext}
          >
            <ChevronRight size={24} />
          </Button>
        </>
      )}
      
      {/* Indicator Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {banners.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full transition-all ${
                index === currentIndex ? "bg-white w-4" : "bg-white/50"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
