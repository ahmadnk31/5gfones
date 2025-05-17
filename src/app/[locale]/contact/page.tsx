"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";

export default function ContactPage() {
  const t = useTranslations("contact");
  const f = useTranslations("footer");
  const params = useSearchParams();
  const subject = params.get("subject");
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      subject: subject || "",
      message: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      // Send the form data to the contact submission API
      const response = await fetch("/api/contact/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || t("messageError"));
      }

      toast.success(t("verificationSent"));
      reset();
    } catch (error: any) {
      toast.error(error.message || t("messageError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='container mx-auto py-12 px-4'>
      <div className='mb-8 text-center'>
        <h1 className='text-4xl font-bold mb-2'>{t("title")}</h1>
        <p className='text-muted-foreground'>{t("subtitle")}</p>
      </div>

      <div className='grid gap-8 md:grid-cols-3'>
        {/* Contact Information */}
        <div className='md:col-span-1'>
          <Card>
            <CardHeader>
              <CardTitle>{t("getInTouch")}</CardTitle>
              <CardDescription>{t("contactInfo")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div className='flex items-start gap-3'>
                  <MapPin className='h-5 w-5 text-muted-foreground shrink-0 mt-1' />
                  <div>
                    <p className='font-medium'>{t("address")}</p>
                    <p className='text-sm text-muted-foreground'>
                      {f("address")}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <Phone className='h-5 w-5 text-muted-foreground' />
                  <div>
                    <p className='font-medium'>{t("phone")}</p>
                    <p className='text-sm text-muted-foreground'>
                      {f("phone")}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <Mail className='h-5 w-5 text-muted-foreground' />
                  <div>
                    <p className='font-medium'>{t("email")}</p>
                    <p className='text-sm text-muted-foreground'>
                      {f("email")}
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <Clock className='h-5 w-5 text-muted-foreground' />
                  <div>
                    <p className='font-medium'>{t("hours")}</p>
                    <p className='text-sm text-muted-foreground'>
                      {f("hours")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className='md:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>{t("contactForm")}</CardTitle>
              <CardDescription>{t("formDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <label htmlFor='name' className='text-sm font-medium'>
                      {t("name")} <span className='text-destructive'>*</span>
                    </label>
                    <Input
                      id='name'
                      {...register("name", { required: true })}
                      placeholder={t("namePlaceholder")}
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className='text-destructive text-xs mt-1'>
                        {t("nameRequired")}
                      </p>
                    )}
                  </div>
                  <div className='space-y-2'>
                    <label htmlFor='email' className='text-sm font-medium'>
                      {t("email")} <span className='text-destructive'>*</span>
                    </label>
                    <Input
                      id='email'
                      type='email'
                      {...register("email", {
                        required: true,
                        pattern: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      })}
                      placeholder={t("emailPlaceholder")}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className='text-destructive text-xs mt-1'>
                        {errors.email.type === "required"
                          ? t("emailRequired")
                          : t("emailInvalid")}
                      </p>
                    )}
                  </div>
                </div>
                <div className='space-y-2'>
                  <label htmlFor='subject' className='text-sm font-medium'>
                    {t("subject")} <span className='text-destructive'>*</span>
                  </label>
                  <Input
                    id='subject'
                    {...register("subject", { required: true })}
                    placeholder={t("subjectPlaceholder")}
                    className={errors.subject ? "border-destructive" : ""}
                  />
                  {errors.subject && (
                    <p className='text-destructive text-xs mt-1'>
                      {t("subjectRequired")}
                    </p>
                  )}
                </div>
                <div className='space-y-2'>
                  <label htmlFor='message' className='text-sm font-medium'>
                    {t("message")} <span className='text-destructive'>*</span>
                  </label>
                  <Textarea
                    id='message'
                    {...register("message", { required: true })}
                    placeholder={t("messagePlaceholder")}
                    className={`min-h-[150px] ${
                      errors.message ? "border-destructive" : ""
                    }`}
                  />
                  {errors.message && (
                    <p className='text-destructive text-xs mt-1'>
                      {t("messageRequired")}
                    </p>
                  )}
                </div>
                <Button
                  type='submit'
                  className='w-full'
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t("sending") : t("send")}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Map */}
      <div className='mt-12'>
        <h2 className='text-2xl font-bold mb-6'>{t("findUs")}</h2>
        <div className='aspect-[16/9] md:aspect-[21/9] w-full bg-muted rounded-lg overflow-hidden'>
          <iframe
            src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2517.4680757571707!2d4.692512876678208!3d50.881255871698214!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47c16137937fe81f%3A0x625b2cd1822ad250!2sBondgenotenlaan%2084%2C%203000%20Leuven%2C%20Belgium!5e0!3m2!1sen!2sus!4v1699941545921!5m2!1sen!2sus'
            className='w-full h-full border-0'
            loading='lazy'
            referrerPolicy='no-referrer-when-downgrade'
            title='Store Location Map'
          ></iframe>
        </div>
      </div>
    </div>
  );
}
