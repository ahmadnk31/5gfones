import React from "react";
import { useTranslations } from "next-intl";

interface ShippingOptionsProps {
  value: string;
  onChange: (value: string) => void;
  shippingCost: number;
}

export const ShippingOptions: React.FC<ShippingOptionsProps> = ({ value, onChange, shippingCost }) => {
  const s = useTranslations("shipping");

  const options = [
    { value: "pickup", label: s("shipping.pickup.title"), description: s("shipping.pickup.description") },
    { value: "in_store", label: s("shipping.in_store.title"), description: s("shipping.in_store.description") },
    { value: "shipping", label: s("shipping.shipping.title"), description: s("shipping.shipping.description", { cost: shippingCost.toFixed(2) }) },
  ];

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium mb-2">{s("title")}</label>
      {options.map((option) => (
        <div
          key={option.value}
          className={`p-4 border rounded-lg cursor-pointer transition-all ${
            value === option.value
              ? "border-blue-500 bg-blue-50"
              : "border-gray-200 hover:border-blue-300"
          }`}
          onClick={() => {
            console.log("Selecting delivery method:", option.value);
            onChange(option.value);
          }}
        >
          <div className="flex items-center">
            <input
              type="radio"
              name="deliveryMethod"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500"
            />
            <div className="ml-3">
              <span className="font-medium">{option.label}</span>
              <p className="text-sm text-gray-500">{option.description}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};


