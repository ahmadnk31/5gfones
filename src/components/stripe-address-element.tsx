import React, { useEffect, useState } from "react";
import { AddressElement } from "@stripe/react-stripe-js";
import { StripeAddressElementChangeEvent } from "@stripe/stripe-js";

interface StripeAddressElementProps {
  onChange: (address: {
    name: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    } | null;
  }) => void;
  defaultValues?: {
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
}

export function StripeAddressElement({
  onChange,
  defaultValues,
}: StripeAddressElementProps) {
  const handleAddressChange = (event: StripeAddressElementChangeEvent) => {
    if (event.complete) {
      const { name, address } = event.value;
      onChange({ name, address });
    }
  };

  return (
    <div className='mt-2'>
      {" "}
      <AddressElement
        options={{
          mode: "shipping",
          defaultValues: defaultValues,
          fields: {
            phone: "never",
          },
          // Removed validation for phone since we're not collecting phone
          // The error was caused by specifying validation.phone without setting fields.phone to always
        }}
        onChange={handleAddressChange}
      />
    </div>
  );
}
