"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { InfoIcon } from "lucide-react";

// Define form validation schema
const repairRequestSchema = z.object({
  deviceName: z.string().min(2, {
    message: "Device name must be at least 2 characters.",
  }),
  deviceType: z.string().optional(),
  deviceBrand: z.string().optional(),
  deviceColor: z.string().optional(),
  deviceModelYear: z.string().optional(),
  deviceSerialNumber: z.string().optional(),
  problemDescription: z.string().min(10, {
    message: "Problem description must be at least 10 characters.",
  }),
  customerEmail: z.string().email({
    message: "Please enter a valid email address.",
  }),
  customerPhone: z.string().optional(),
});

type RepairRequestFormValues = z.infer<typeof repairRequestSchema>;

export function RepairRequestForm() {
  const t = useTranslations("repair.customRequest.form");
  const commonT = useTranslations("repair.customRequest");
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split("/")[1];
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  // Initialize form
  const form = useForm<RepairRequestFormValues>({
    resolver: zodResolver(repairRequestSchema),
    defaultValues: {
      deviceName: "",
      deviceType: "",
      deviceBrand: "",
      deviceColor: "",
      deviceModelYear: "",
      deviceSerialNumber: "",
      problemDescription: "",
      customerEmail: "",
      customerPhone: "",
    },
  });

  // Handle form submission
  async function onSubmit(data: RepairRequestFormValues) {
    setLoading(true);

    try {
      // Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast.error("You must be logged in to submit a repair request");
        setLoading(false);
        return;
      }

      // Submit repair request to the API
      const response = await fetch(`/${locale}/api/repair-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          user_uid: user.id,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error submitting request");
      }

      toast.success("Request submitted successfully");
      router.push(`/${locale}/repair/request-confirmation`);
    } catch (error) {
      console.error("Error submitting repair request:", error);
      toast.error(
        error instanceof Error ? error.message : "Error submitting request"
      );
    } finally {
      setLoading(false);
    }
  }
  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>{commonT("title")}</CardTitle>
        <CardDescription>{commonT("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            <div className='space-y-4'>
              {/* Device Name */}
              <FormField
                control={form.control}
                name='deviceName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("deviceName")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("deviceNamePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Device Type */}
              <FormField
                control={form.control}
                name='deviceType'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("deviceType")}</FormLabel>{" "}
                    <FormControl>
                      <Input
                        placeholder={t("deviceTypePlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Smartphone, Tablet, Laptop, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className='grid gap-4 grid-cols-1 md:grid-cols-2'>
                {/* Device Brand */}
                <FormField
                  control={form.control}
                  name='deviceBrand'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("deviceBrand")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("deviceBrandPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Device Color */}
                <FormField
                  control={form.control}
                  name='deviceColor'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("deviceColor")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("deviceColorPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className='grid gap-4 grid-cols-1 md:grid-cols-2'>
                {/* Device Model Year */}{" "}
                <FormField
                  control={form.control}
                  name='deviceModelYear'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("modelYear")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("modelYearPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Device Serial Number */}{" "}
                <FormField
                  control={form.control}
                  name='deviceSerialNumber'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("serialNumber")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("serialNumberPlaceholder")}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {/* Problem Description */}
              <FormField
                control={form.control}
                name='problemDescription'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("problemDescription")}</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={t("problemDescriptionPlaceholder")}
                        className='min-h-32'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />{" "}
              <h3 className='text-lg font-medium mt-6 mb-2'>
                {t("contactInformation")}
              </h3>
              <div className='grid gap-4 grid-cols-1 md:grid-cols-2'>
                {/* Customer Email */}{" "}
                <FormField
                  control={form.control}
                  name='customerEmail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email")}</FormLabel>
                      <FormControl>
                        <Input
                          type='email'
                          placeholder='email@example.com'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {/* Customer Phone */}{" "}
                <FormField
                  control={form.control}
                  name='customerPhone'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("phone")}</FormLabel>
                      <FormControl>
                        <Input placeholder='+1 (555) 123-4567' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>{" "}
            <div className='bg-blue-50 p-4 rounded-md flex gap-3 items-start'>
              <InfoIcon className='h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0' />
              <p className='text-sm text-blue-700'>{commonT("description")}</p>
            </div>
            <Button type='submit' disabled={loading} className='w-full'>
              {loading ? t("submitting") : t("submit")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
