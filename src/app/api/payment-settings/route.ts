import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    // Fetch payment settings
    const { data, error } = await supabase
      .from("settings")
      .select("settings")
      .eq("type", "payment")
      .single();

    if (error) {
      console.error("Error fetching payment settings:", error);
      return NextResponse.json(
        { error: "Failed to retrieve payment settings" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { 
          settings: {
            stripe_public_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
            payment_currency: 'eur',
            enable_stripe_checkout: true,
            enable_stripe_elements: true,
          }
        },
        { status: 200 }
      );
    }

    // Return minimal settings for client
    const clientSettings = {
      stripe_public_key: data.settings.stripe_public_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
      payment_currency: data.settings.payment_currency || 'usd',
      enable_stripe_checkout: data.settings.enable_stripe_checkout ?? true,
      enable_stripe_elements: data.settings.enable_stripe_elements ?? true,
    };

    return NextResponse.json({ settings: clientSettings }, { status: 200 });
  } catch (error: any) {
    console.error("Error in payment settings API:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
