"use client";

import { useTranslations } from "next-intl";
import { AdminLayout } from "@/components/admin-layout";
import { AdminRepairRequests } from "@/components/admin-repair-requests";

// Admin page for managing repair requests
export default function RepairRequestsAdmin() {
  const t = useTranslations("repairRequest.admin");

  return (
    <AdminLayout>
      <div className='p-4 md:p-6'>
        <div className='mb-6'>
          <h1 className='text-2xl font-bold mb-1'>
            {t("repairRequestManagement")}
          </h1>
          <p className='text-gray-600'>
            {t("repairRequestManagementDescription")}
          </p>
        </div>

        <AdminRepairRequests />
      </div>
    </AdminLayout>
  );
}
