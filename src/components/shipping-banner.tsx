"use client";

import React from "react";
import { Truck, X } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";

const ShippingBanner = () => {
  const [isVisible, setIsVisible] = useState(true);
  const t = useTranslations("shippingBanner");

  if (!isVisible) return null; // Don't render if not visible
  return (
    <div className="relative bg-gradient-to-r from-green-600 to-green-700 text-white py-2 px-4 text-center text-sm font-medium">
      <div className="flex items-center justify-center gap-2">
        <Truck size={16} className="flex-shrink-0" />
        <span>
          🚚 <strong>
            {t("title")}
            </strong> 
            {t("description") || " on all orders over $50!"}
        </span>
      </div>
      <button
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-white/20 rounded-full p-1 transition-colors"
        aria-label="Close banner"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default ShippingBanner;
