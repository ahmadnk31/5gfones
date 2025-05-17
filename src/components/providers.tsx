"use client";

import React from "react";
import { CartProvider } from "@/lib/cart-provider";
import { Toaster } from "@/components/ui/sonner";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <CartProvider>
      {children}
      <Toaster />
    </CartProvider>
  );
}
