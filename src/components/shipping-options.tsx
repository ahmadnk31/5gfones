import React from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Check, Truck, Store, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface DeliveryOptionProps {
  value: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  price?: string;
  checked: boolean;
  onChange: (value: string) => void;
}

const DeliveryOption = ({
  value,
  icon,
  title,
  description,
  price,
  checked,
  onChange,
}: DeliveryOptionProps) => {
  return (
    <Card
      className={cn(
        "p-4 cursor-pointer relative border-2",
        checked
          ? "border-primary bg-primary/5"
          : "border-gray-200 hover:bg-gray-50"
      )}
      onClick={() => onChange(value)}
    >
      {checked && (
        <div className='absolute top-2 right-2 h-5 w-5 bg-primary rounded-full flex items-center justify-center'>
          <Check className='h-3 w-3 text-white' />
        </div>
      )}
      <div className='flex items-start space-x-4'>
        <div className='h-10 w-10 flex items-center justify-center rounded-full bg-primary/10 text-primary'>
          {icon}
        </div>
        <div className='flex-1'>
          <div className='flex justify-between'>
            <Label className='font-medium text-base'>{title}</Label>
            {price && <span className='text-sm font-medium'>{price}</span>}
          </div>
          <p className='text-sm text-gray-500 mt-1'>{description}</p>
        </div>
      </div>
      <RadioGroupItem
        value={value}
        id={`delivery-${value}`}
        className='sr-only'
      />
    </Card>
  );
};

interface ShippingOptionsProps {
  value: string;
  onChange: (value: string) => void;
  shippingCost?: number;
}

export function ShippingOptions({
  value,
  onChange,
  shippingCost = 9.99,
}: ShippingOptionsProps) {
  const t = useTranslations("shipping");

  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className='grid gap-4 mt-4'
    >
      <DeliveryOption
        value='pickup'
        icon={<User className='h-5 w-5' />}
        title={t("shipping.pickup.title")}
        description={t(
          "shipping.pickup.description"
        )}
        checked={value === "pickup"}
        onChange={onChange}
      />

      <DeliveryOption
        value='in_store'
        icon={<Store className='h-5 w-5' />}
        title={t("shipping.in_store.title")}
        description={t(
          "shipping.in_store.description"
        )}
        checked={value === "in_store"}
        onChange={onChange}
      />

      <DeliveryOption
        value='shipping'
        icon={<Truck className='h-5 w-5' />}
        title={t("shipping.shipping.title")}
        description={t(
          "shipping.shipping.description"
        )}
        price={`$${shippingCost.toFixed(2)}`}
        checked={value === "shipping"}
        onChange={onChange}
      />
    </RadioGroup>
  );
}
