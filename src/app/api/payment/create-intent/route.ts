import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// In a real app, you would securely load this from environment variables
// This is just for development purposes
const STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY || "sk_test_your_test_key_here";
const stripe = require("stripe")(STRIPE_SECRET_KEY);

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Verify the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get payment details from request body
    const { amount, paymentMethodId, customerId, metadata } =
      await request.json();

    // Create a payment intent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amount in cents
      currency: "usd",
      payment_method: paymentMethodId,
      confirmation_method: "manual",
      confirm: true,
      description: `Order payment for ${customerId}`,
      metadata: metadata,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      id: paymentIntent.id,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Something went wrong" },
      { status: 500 }
    );
  }
}
