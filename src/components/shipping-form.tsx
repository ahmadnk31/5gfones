import React, { useState } from "react";
import { ShippingOptions } from "@/components/shipping-options";
import { StripeAddressElement } from "@/components/stripe-address-element";
import { StripeProvider } from "@/components/stripe-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

interface ShippingFormProps {
  onSubmit: (data: {
    deliveryMethod: string;
    shippingAddress?: {
      name: string;
      address: {
        line1: string;
        line2?: string;
        city: string;
        state: string;
        postal_code: string;
        country: string;
      };
    };
    shippingCost: number;
  }) => void;
  defaultDeliveryMethod?: string;
  defaultAddress?: {
    name?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  };
  shippingCost?: number;
  isLoading?: boolean;
}

export function ShippingForm({
  onSubmit,
  defaultDeliveryMethod = "pickup",
  defaultAddress,
  shippingCost = 9.99,
  isLoading = false,
}: ShippingFormProps) {
  const t = useTranslations("shipping");
  const [deliveryMethod, setDeliveryMethod] = useState(defaultDeliveryMethod);
  const [shippingAddress, setShippingAddress] = useState<{
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    } | null;
  } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = {
      deliveryMethod,
      shippingCost: deliveryMethod === "shipping" ? shippingCost : 0,
    };

    if (deliveryMethod === "shipping" && shippingAddress?.address) {
      onSubmit({
        ...formData,
        shippingAddress: {
          name: shippingAddress.name,
          address: shippingAddress.address,
        },
      });
    } else {
      onSubmit(formData as any);
    }
  };

  const isAddressRequired = deliveryMethod === "shipping";
  const isFormComplete =
    !isAddressRequired ||
    (shippingAddress?.address?.line1 &&
      shippingAddress.address.city &&
      shippingAddress.address.postal_code);

  return (
    <form onSubmit={handleSubmit}>
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle>{t("shipping.title", "Delivery Options")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ShippingOptions
            value={deliveryMethod}
            onChange={setDeliveryMethod}
            shippingCost={shippingCost}
          />

          {deliveryMethod === "shipping" && (
            <div className='mt-6 border-t pt-4'>
              <h3 className='text-base font-medium mb-2'>
                {t("shipping.addressTitle", "Shipping Address")}
              </h3>
              <StripeProvider>
                <StripeAddressElement
                  onChange={setShippingAddress}
                  defaultValues={defaultAddress}
                />
              </StripeProvider>
            </div>
          )}
        </CardContent>
      </Card>

      <div className='flex justify-end'>
        <Button type='submit' disabled={isLoading || !isFormComplete}>
          {isLoading
            ? t("shipping.processing", "Processing...")
            : t("shipping.continue", "Continue")}
        </Button>
      </div>
    </form>
  );
}
