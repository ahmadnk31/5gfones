"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import RepairLayout from "@/components/repair-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

// Confirmation page shown after submitting a repair request
export default function RepairRequestConfirmationPage() {
  const t = useTranslations("repairRequest");
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname.split("/")[1];

  return (
    <RepairLayout activeTab='schedule'>
      <div className='container mx-auto py-16 px-4'>
        <div className='max-w-lg mx-auto'>
          <Card className='border-green-100'>
            <CardHeader className='text-center pb-4'>
              <div className='mx-auto mb-4'>
                <CheckCircle2 className='h-16 w-16 text-green-500 mx-auto' />
              </div>
              <CardTitle className='text-2xl text-green-700'>
                {t("requestReceived")}
              </CardTitle>
            </CardHeader>
            <CardContent className='text-center pb-6'>
              <p className='mb-4'>{t("confirmationMessage")}</p>
              <div className='bg-gray-50 p-4 rounded-md mb-4'>
                <p className='font-medium'>{t("whatHappensNext")}</p>
                <ul className='list-disc list-inside text-sm text-left mt-2 space-y-1'>
                  <li>{t("nextSteps.review")}</li>
                  <li>{t("nextSteps.contact")}</li>
                  <li>{t("nextSteps.quote")}</li>
                  <li>{t("nextSteps.repair")}</li>
                </ul>
              </div>
            </CardContent>
            <CardFooter className='flex flex-col sm:flex-row gap-3 justify-center'>
              <Button
                variant='outline'
                onClick={() => router.push(`/${locale}/repair/track`)}
              >
                {t("trackRepairs")}
              </Button>
              <Button onClick={() => router.push(`/${locale}/repair`)}>
                {t("backToRepairHome")}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </RepairLayout>
  );
}
