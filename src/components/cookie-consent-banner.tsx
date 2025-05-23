"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from "next-intl";
import { isEuUser } from "@/lib/geo-detection";

interface CookieConsentType {
  essential: boolean;
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
}

interface CookieConsentBannerProps {
  countryCode?: string;
  locale?: string;
}

export function CookieConsentBanner({
  countryCode,
  locale = "en"
}: CookieConsentBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [cookieConsent, setCookieConsent] = useState<CookieConsentType>({
    essential: true, // Essential cookies cannot be disabled
    preferences: false,
    statistics: false,
    marketing: false,
  });
  
  const t = useTranslations("privacy.cookieConsent");
  
  useEffect(() => {
    // Check if user is from EU
    const isUserFromEu = isEuUser(countryCode);
    
    // Only show banner if user is from EU or if we're not sure (for maximum compliance)
    if (isUserFromEu) {
      // Check if the user has already set cookie preferences
      const savedConsent = localStorage.getItem("cookie_consent");
      if (!savedConsent) {
        // Show banner after a small delay to avoid jarring the user immediately on page load
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 1000);
        return () => clearTimeout(timer);
      } else {
        // Load saved preferences
        try {
          const parsed = JSON.parse(savedConsent);
          setCookieConsent(parsed);
        } catch (e) {
          // If parsing fails, show the banner again
          setShowBanner(true);
        }
      }
    }
  }, [countryCode]);

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      preferences: true,
      statistics: true,
      marketing: true,
    };
    setCookieConsent(allAccepted);
    localStorage.setItem("cookie_consent", JSON.stringify(allAccepted));
    setShowBanner(false);
  };

  const handleAcceptEssential = () => {
    const essentialOnly = {
      essential: true,
      preferences: false,
      statistics: false,
      marketing: false,
    };
    setCookieConsent(essentialOnly);
    localStorage.setItem("cookie_consent", JSON.stringify(essentialOnly));
    setShowBanner(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem("cookie_consent", JSON.stringify(cookieConsent));
    setShowBanner(false);
    setShowCustomize(false);
  };

  const toggleCustomize = () => {
    setShowCustomize(!showCustomize);
  };

  const handleCheckboxChange = (key: keyof CookieConsentType) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled
    setCookieConsent({
      ...cookieConsent,
      [key]: !cookieConsent[key],
    });
  };

  if (!showBanner) {
    return null;
  }

  return (
    <Dialog open={showBanner} onOpenChange={setShowBanner}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        
        {showCustomize ? (
          <div className="space-y-4 pt-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="essential" 
                  checked={cookieConsent.essential} 
                  disabled={true} // Essential cookies cannot be disabled
                />
                <label htmlFor="essential" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {t("cookieTypes.essential")}
                </label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                {t("cookieTypes.essentialDesc")}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="preferences" 
                  checked={cookieConsent.preferences} 
                  onCheckedChange={() => handleCheckboxChange('preferences')}
                />
                <label htmlFor="preferences" className="text-sm font-medium leading-none">
                  {t("cookieTypes.preferences")}
                </label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                {t("cookieTypes.preferencesDesc")}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="statistics" 
                  checked={cookieConsent.statistics} 
                  onCheckedChange={() => handleCheckboxChange('statistics')}
                />
                <label htmlFor="statistics" className="text-sm font-medium leading-none">
                  {t("cookieTypes.statistics")}
                </label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                {t("cookieTypes.statisticsDesc")}
              </p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="marketing" 
                  checked={cookieConsent.marketing} 
                  onCheckedChange={() => handleCheckboxChange('marketing')}
                />
                <label htmlFor="marketing" className="text-sm font-medium leading-none">
                  {t("cookieTypes.marketing")}
                </label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                {t("cookieTypes.marketingDesc")}
              </p>
            </div>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              {t("description")}
            </p>
          </div>
        )}

        <DialogFooter className={showCustomize ? "sm:justify-between" : "sm:justify-center"}>
          {showCustomize ? (
            <>
              <Button variant="outline" onClick={toggleCustomize}>
                {t("cancel")}
              </Button>
              <Button onClick={handleSavePreferences}>
                {t("save")}
              </Button>
            </>
          ) : (
            <div className="w-full flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between">
              <Button variant="outline" onClick={toggleCustomize} className="order-3 sm:order-1">
                {t("customizeSettings")}
              </Button>
              <Button variant="secondary" onClick={handleAcceptEssential} className="order-2">
                {t("acceptEssential")}
              </Button>
              <Button onClick={handleAcceptAll} className="order-1 sm:order-3">
                {t("acceptAll")}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
