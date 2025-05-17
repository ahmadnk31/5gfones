import { loadStripe } from '@stripe/stripe-js';

// We need a Stripe publishable key - this should be in an env variable in a real app
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_test_key_here';

// Creating a singleton to avoid multiple Stripe instances
let stripePromise: Promise<any>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};
