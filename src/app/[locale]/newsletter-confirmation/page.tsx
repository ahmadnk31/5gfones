"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  AlertCircle,
  ArrowLeft,
  Mail,
  XCircle,
  Loader2,
} from "lucide-react";

interface ConfirmationProps {
  params: { locale: string };
}

export default function NewsletterConfirmation({
  params: { locale },
}: ConfirmationProps) {
  const t = useTranslations("newsletter");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract parameters from URL
  const status = searchParams.get("status");
  const type = searchParams.get("type") || "verify"; // 'verify', 'unsubscribe', or 'subscribe'
  const email = searchParams.get("email"); // Optional email for subscription confirmation

  const [isLoading, setIsLoading] = useState(true);

  // Redirect to home if accessed directly without parameters
  useEffect(() => {
    if (!status) {
      router.push(`/${locale}`);
    } else {
      setIsLoading(false);
    }
  }, [status, router, locale]);
  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='flex flex-col items-center gap-4'>
          <Loader2 className='w-12 h-12 animate-spin text-primary' />
          <p className='text-muted-foreground'>{t("loading")}</p>
        </div>
      </div>
    );
  }

  // Determine which icon to show based on status and type
  const getIcon = () => {
    if (status === "success") {
      if (type === "verify" || type === "subscribe") {
        return <Check className='w-6 h-6 text-green-600 dark:text-green-300' />;
      }
      return <XCircle className='w-6 h-6 text-amber-600 dark:text-amber-300' />;
    }
    return <AlertCircle className='w-6 h-6 text-red-600 dark:text-red-300' />;
  };

  // Determine the background color for the icon
  const getIconBgClass = () => {
    if (status === "success") {
      if (type === "verify" || type === "subscribe") {
        return "bg-green-100 dark:bg-green-900";
      }
      return "bg-amber-100 dark:bg-amber-900";
    }
    return "bg-red-100 dark:bg-red-900";
  };

  // Get the appropriate title based on status and type
  const getTitle = () => {
    if (status === "success") {
      if (type === "verify") return t("verificationSuccess");
      if (type === "unsubscribe") return t("unsubscribeSuccess");
      if (type === "subscribe") return t("subscribeSuccess");
    } else {
      if (type === "verify") return t("verificationError");
      if (type === "unsubscribe") return t("unsubscribeError");
      if (type === "subscribe") return t("subscribeError");
    }
    return "";
  };

  // Get the appropriate message based on status and type
  const getMessage = () => {
    if (status === "success") {
      if (type === "verify") return t("verificationSuccessMessage");
      if (type === "unsubscribe") return t("unsubscribeSuccessMessage");
      if (type === "subscribe") return t("subscribeSuccessMessage");
    } else {
      if (type === "verify") return t("verificationErrorMessage");
      if (type === "unsubscribe") return t("unsubscribeErrorMessage");
      if (type === "subscribe") return t("subscribeErrorMessage");
    }
    return "";
  };

  return (
    <div className='min-h-[70vh] flex items-center justify-center p-4'>
      <div className='max-w-md w-full bg-card border rounded-lg shadow-sm p-8'>
        <div
          className={`flex items-center justify-center w-16 h-16 rounded-full ${getIconBgClass()} mb-6 mx-auto`}
        >
          {getIcon()}
        </div>

        <h1 className='text-2xl font-bold text-center mb-4'>{getTitle()}</h1>

        {/* Show email if provided */}
        {email && (
          <div className='flex items-center justify-center gap-2 py-2 px-4 bg-muted rounded-md mb-4 mx-auto max-w-fit'>
            <Mail size={16} />
            <span className='font-medium'>{email}</span>
          </div>
        )}

        <p className='text-center mb-6'>{getMessage()}</p>

        <div className='flex flex-col sm:flex-row gap-3 justify-center'>
          <Link
            href={`/${locale}`}
            className='flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors'
          >
            <ArrowLeft className='w-4 h-4' />
            {t("returnToHomepage")}
          </Link>

          {/* Show subscribe button if unsubscribe was successful */}
          {status === "success" && type === "unsubscribe" && (
            <Link
              href={`/${locale}/#newsletter`}
              className='flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors'
            >
              <Mail className='w-4 h-4' />
              {t("subscribeAgain")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
