"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

interface NewsletterFormProps {
  className?: string;
}

export function NewsletterForm({ className }: NewsletterFormProps) {
  const t = useTranslations("footer");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get the current locale from URL
      const locale = window.location.pathname.split("/")[1] || "en";

      // Call our newsletter subscription API
      const response = await fetch(`/${locale}/api/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Subscription failed");
      }

      toast.success(
        t("subscriptionSuccess") || "Successfully subscribed to newsletter!"
      );
      setEmail("");
    } catch (error) {
      toast.error(
        t("subscriptionError") || "Failed to subscribe. Please try again."
      );
      console.error("Newsletter subscription error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className='flex flex-col sm:flex-row gap-2'>
        <input
          type='email'
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("emailPlaceholder") || "Enter your email"}
          className='px-4 py-2 bg-gray-800 text-white rounded flex-1 border border-gray-700 focus:ring-2 focus:ring-primary focus:outline-none'
          required
          aria-label={t("emailPlaceholder") || "Enter your email"}
        />
        <button
          type='submit'
          disabled={isSubmitting}
          className='bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white font-medium px-4 py-2 rounded transition-colors'
        >
          {isSubmitting
            ? t("subscribing") || "Subscribing..."
            : t("subscribe") || "Subscribe"}
        </button>
      </div>
    </form>
  );
}
