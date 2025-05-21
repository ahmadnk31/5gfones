import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createClient();

    // Check if the user is an admin
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has admin role
    const { data: userRoles, error: roleError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !userRoles) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch payment settings
    const { data, error } = await supabase
      .from("settings")
      .select("settings")
      .eq("type", "payment")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { 
          stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
          stripeSecretKey: process.env.STRIPE_SECRET_KEY,
          stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET
        },
        { status: 200 }
      );
    }

    // Return the API keys
    return NextResponse.json(
      {
        stripePublicKey: data.settings.stripe_public_key || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        stripeSecretKey: data.settings.stripe_secret_key || process.env.STRIPE_SECRET_KEY,
        stripeWebhookSecret: data.settings.stripe_webhook_secret || process.env.STRIPE_WEBHOOK_SECRET,
        currency: data.settings.payment_currency || 'usd'
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error fetching Stripe keys:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred" },
      { status: 500 }
    );
  }
}
