"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GlobeIcon, CheckCircle } from "lucide-react";
import { isEuUser } from "@/lib/geo-detection";

interface GdprComplianceBannerProps {
  countryCode?: string;
  locale?: string;
}

export function GdprComplianceBanner({
  countryCode,
  locale = "en",
}: GdprComplianceBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [isEu, setIsEu] = useState(false);

  useEffect(() => {
    // Check if user is from EU - in a real implementation, you would use server-side detection
    const isUserFromEu = isEuUser(countryCode);
    setIsEu(isUserFromEu);
    
    // Only show the banner for EU users or if we're not sure (for maximum compliance)
    if (isUserFromEu) {
      // Check if the user has already acknowledged the GDPR notice
      const acknowledged = localStorage.getItem("gdpr_acknowledged");
      if (!acknowledged) {
        setShowBanner(true);
      }
    }
  }, [countryCode]);

  const handleAcknowledge = () => {
    // Store acknowledgment in localStorage
    localStorage.setItem("gdpr_acknowledged", "true");
    setShowBanner(false);
  };

  // Don't render anything if user is not from EU or has already acknowledged
  if (!showBanner) {
    return null;
  }

  return (
    <Card className="mb-6 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-2 mt-1">
            <GlobeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">
              {locale === "es" ? "Aviso de Cumplimiento del RGPD" : "GDPR Compliance Notice"}
            </h3>
            <p className="text-muted-foreground text-sm mb-3">
              {locale === "es"
                ? "Como usuario de la UE, tiene derechos adicionales bajo el Reglamento General de Protección de Datos (RGPD). Por favor revise nuestra política de privacidad para obtener más información sobre cómo protegemos sus datos y qué derechos tiene."
                : "As an EU user, you have additional rights under the General Data Protection Regulation (GDPR). Please review our privacy policy to learn more about how we protect your data and what rights you have."}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <Button size="sm" variant="outline" onClick={handleAcknowledge}>
                <CheckCircle className="h-4 w-4 mr-2" />
                {locale === "es" ? "Entendido" : "Acknowledge"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
