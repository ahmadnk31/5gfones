"use client";

import React from "react";
import { useTranslations } from "next-intl";
import RepairLayout from "@/components/repair-layout";
import { RepairRequestForm } from "@/components/repair-request-form";

// Custom Repair Request page for devices not in the standard list
export default function CustomRepairPage() {
  const t = useTranslations("repair.customRequest");

  return (
    <RepairLayout activeTab='schedule'>
      <div className='container mx-auto py-8 px-4'>
        <div className='max-w-4xl mx-auto'>
          <div className='mb-6'>
            <h1 className='text-2xl md:text-3xl font-bold mb-2'>
              {t("title")}
            </h1>
            <p className='text-gray-600'>{t("description")}</p>
          </div>

          <RepairRequestForm />
        </div>
      </div>
    </RepairLayout>
  );
}
