import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe/client";
import { ReactNode } from "react";

interface StripeProviderProps {
  children: ReactNode;
}

export function StripeProvider({ children }: StripeProviderProps) {
  const stripePromise = getStripe();

  return <Elements stripe={stripePromise}>{children}</Elements>;
}
