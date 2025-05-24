"use client";

import React, { use } from "react";
import { CreditCard } from "lucide-react";
import { IconBrandMastercard, IconBrandPaypal, IconBrandVisa, IconCreditCard } from "@tabler/icons-react";
import { useTranslations } from "next-intl";

const PaymentIcons = () => {
    const t=useTranslations("paymentIcons");
  return (
    <div className="flex flex-col items-center space-y-3">
      <h4 className="text-lg font-medium text-gray-300">
      {t("title")}
      </h4>
        <div className="flex space-x-4">
            <IconBrandVisa size={24} />
            <IconBrandMastercard size={24}  />
            <IconBrandPaypal size={24}  />
            <CreditCard size={24}  />
            <IconCreditCard size={24}  />
            </div>
      <p className="text-xs text-gray-400">
        {t("description") || "We accept all major credit cards and payment methods."}
      </p>
    </div>
  );
};

export default PaymentIcons;
