"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect } from "react";

export default function ContactConfirmation() {
  const t = useTranslations("contact.confirmation");
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";
  
  let title = "";
  let message = "";
  let isSuccess = false;

  if (status === "success" && type === "verify") {
    title = t("verificationSuccess");
    message = t("verificationSuccessMessage");
    isSuccess = true;
  } else if (status === "error" && type === "verify") {
    title = t("verificationError");
    message = t("verificationErrorMessage");
    isSuccess = false;
  }

  return (
    <div className="container mx-auto py-16 px-4 text-center">
      <div className="max-w-md mx-auto">
        {isSuccess ? (
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        ) : (
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        )}
        
        <h1 className="text-3xl font-bold mb-4">{title}</h1>
        <p className="text-lg text-muted-foreground mb-8">{message}</p>
        
        <div className="flex justify-center gap-4">
          <Button asChild>
            <Link href="/">{t("returnToHomepage")}</Link>
          </Button>
          
          {isSuccess && (
            <Button variant="outline" asChild>
              <Link href="/contact">{t("contactAgain")}</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
