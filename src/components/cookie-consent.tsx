'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { 
  Dialog, 
  DialogContent,
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { X, GlobeIcon, ShieldIcon } from 'lucide-react';
import { isEuUser } from '@/lib/geo-detection';

type CookieConsent = {
  essential: boolean; // Always true and disabled
  preferences: boolean;
  statistics: boolean;
  marketing: boolean;
  consentVersion: number; // For tracking changes to the cookie policy
};

const CONSENT_VERSION = 2; // Upgraded version for GDPR compliance
const CONSENT_COOKIE_NAME = 'cookie-consent';

export function CookieConsent() {
  const t = useTranslations('privacy');
  const { locale } = useParams() as { locale: string };
  const [isOpen, setIsOpen] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isEuRegion, setIsEuRegion] = useState(true); // Default to true for maximum compliance
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true,
    preferences: false,
    statistics: false,
    marketing: false,
    consentVersion: CONSENT_VERSION,
  });

  useEffect(() => {
    // Determine if the user is likely from the EU (simplified for demo purposes)
    // In production, you'd use a proper geo-location service
    const checkRegion = async () => {
      try {
        // For the demo, we'll assume users from certain languages are in the EU
        const euLanguages = ['de', 'fr', 'es', 'it', 'nl', 'pt', 'sv', 'fi', 'da', 'pl', 'cs', 'sk', 'hu', 'ro', 'bg', 'el', 'lt', 'lv', 'et', 'sl', 'mt'];
        const isLikelyEu = euLanguages.includes(locale) || isEuUser();
        setIsEuRegion(isLikelyEu);
      } catch (error) {
        console.error('Error determining region:', error);
        setIsEuRegion(true); // Default to true for safety
      }
    };
    
    checkRegion();
    
    // Check if consent cookie exists and is current version
    const storedConsent = getCookieConsent();
    if (!storedConsent || storedConsent.consentVersion !== CONSENT_VERSION) {
      setTimeout(() => {
        setShowBanner(true);
      }, 1000); // Show after 1 second delay for better UX
    } else {
      setConsent(storedConsent);
    }
  }, [locale]);

  const getCookieConsent = (): CookieConsent | null => {
    try {
      const consentCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith(`${CONSENT_COOKIE_NAME}=`));
      
      if (consentCookie) {
        const consentValue = consentCookie.split('=')[1];
        return JSON.parse(decodeURIComponent(consentValue));
      }
    } catch (e) {
      console.error('Error parsing cookie consent', e);
    }
    return null;
  };

  const setCookieConsent = (consentValue: CookieConsent) => {
    // Set cookie to expire in 6 months
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 6);
    
    document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
      JSON.stringify(consentValue)
    )}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Lax`;
    
    setConsent(consentValue);
  };

  const handleAcceptAll = () => {
    const newConsent: CookieConsent = {
      essential: true,
      preferences: true,
      statistics: true,
      marketing: true,
      consentVersion: CONSENT_VERSION,
    };
    
    setCookieConsent(newConsent);
    setShowBanner(false);
  };

  const handleAcceptSelected = () => {
    // Essential cookies are always enabled
    const newConsent: CookieConsent = {
      ...consent,
      essential: true,
      consentVersion: CONSENT_VERSION,
    };
    
    setCookieConsent(newConsent);
    setShowBanner(false);
    setIsOpen(false);
  };

  const handleAcceptEssential = () => {
    const newConsent: CookieConsent = {
      essential: true,
      preferences: false,
      statistics: false,
      marketing: false,
      consentVersion: CONSENT_VERSION,
    };
    
    setCookieConsent(newConsent);
    setShowBanner(false);
  };

  const handleOpenPreferences = () => {
    setIsOpen(true);
  };

  const handleCheckboxChange = (cookieType: keyof Omit<CookieConsent, 'consentVersion' | 'essential'>) => {
    setConsent({
      ...consent,
      [cookieType]: !consent[cookieType],
    });
  };

  // Cookie preferences dialog should be always available regardless of banner visibility
  const preferencesDialog = (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>{t('cookieConsent.preferencesTitle')}</DialogTitle>
            {isEuRegion && (
              <div className="px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-xs font-medium text-blue-600 dark:text-blue-400">
                GDPR
              </div>
            )}
          </div>
          <DialogDescription>
            {isEuRegion 
              ? `${t('cookieConsent.preferencesDescription')} As per the GDPR requirements, we provide detailed information about each type of cookie we use.` 
              : t('cookieConsent.preferencesDescription')
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div className="flex items-start space-x-4 pb-2 border-b">
            <Checkbox id="essential" checked disabled />
            <div className="space-y-1 flex-1">
              <Label htmlFor="essential" className="font-medium">
                {t('section4.cookieTypes.essential')}
              </Label>
              <p className="text-sm text-gray-500">
                {t('section4.cookieTypes.essentialDesc')}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4 pb-2 border-b">
            <Checkbox 
              id="preferences" 
              checked={consent.preferences} 
              onCheckedChange={() => handleCheckboxChange('preferences')}
            />
            <div className="space-y-1 flex-1">
              <Label 
                htmlFor="preferences" 
                className="font-medium cursor-pointer"
              >
                {t('section4.cookieTypes.preferences')}
              </Label>
              <p className="text-sm text-gray-500">
                {t('section4.cookieTypes.preferencesDesc')}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4 pb-2 border-b">
            <Checkbox 
              id="statistics" 
              checked={consent.statistics} 
              onCheckedChange={() => handleCheckboxChange('statistics')}
            />
            <div className="space-y-1 flex-1">
              <Label 
                htmlFor="statistics" 
                className="font-medium cursor-pointer"
              >
                {t('section4.cookieTypes.statistics')}
              </Label>
              <p className="text-sm text-gray-500">
                {t('section4.cookieTypes.statisticsDesc')}
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-4 pb-2">
            <Checkbox 
              id="marketing" 
              checked={consent.marketing} 
              onCheckedChange={() => handleCheckboxChange('marketing')}
            />
            <div className="space-y-1 flex-1">
              <Label 
                htmlFor="marketing" 
                className="font-medium cursor-pointer"
              >
                {t('section4.cookieTypes.marketing')}
              </Label>
              <p className="text-sm text-gray-500">
                {t('section4.cookieTypes.marketingDesc')}
              </p>
            </div>
          </div>
        </div>        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <div className="flex items-center mr-auto">
            <a 
              href={`/${locale}/privacy-policy`} 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <ShieldIcon className="h-3 w-3" />
              {t('cookieConsent.learnMore')}
            </a>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              {t('cookieConsent.cancel')}
            </Button>
            <Button onClick={handleAcceptSelected}>
              {t('cookieConsent.save')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Cookie consent banner
  if (showBanner) {
    return (
      <>
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 shadow-md p-4 md:p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">              <div className="flex-1">
                {isEuRegion && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-1">
                      <GlobeIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      GDPR Compliant
                    </span>
                  </div>
                )}
                
                <h3 className="font-bold text-lg mb-2">
                  {t('cookieConsent.title')}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                  {isEuRegion 
                    ? `${t('cookieConsent.description')} Under the GDPR, we require your explicit consent before using non-essential cookies.` 
                    : t('cookieConsent.description')
                  }
                </p>
                
                {isEuRegion && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-2">
                    You can change your preferences at any time using the cookie button in the bottom-left corner.
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" size="sm" onClick={handleAcceptEssential}>
                  {t('cookieConsent.acceptEssential')}
                </Button>
                <Button variant="outline" size="sm" onClick={handleOpenPreferences}>
                  {t('cookieConsent.customizeSettings')}
                </Button>
                <Button variant="default" size="sm" onClick={handleAcceptAll}>
                  {t('cookieConsent.acceptAll')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {preferencesDialog}
      </>
    );
  }

  // Return just the preferences button and dialog when banner is not shown
  return (
    <>
      <button
        onClick={handleOpenPreferences}
        className="fixed bottom-4 left-4 z-50 bg-white dark:bg-gray-800 shadow-md rounded-full p-5 border border-gray-200 dark:border-gray-700"
        aria-label={t('cookieConsent.manageCookies')}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
          <path d="M8.5 8.5v.01" />
          <path d="M16 15.5v.01" />
          <path d="M12 12v.01" />
        </svg>
      </button>

      {preferencesDialog}
    </>
  );
}