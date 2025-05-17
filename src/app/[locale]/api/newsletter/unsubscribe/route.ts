import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  // Get token from request URL
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const { pathname } = url;
  const locale = pathname.split("/")[1] || "en";

  if (!token) {
    return NextResponse.redirect(
      new URL(
        `/${locale}/newsletter-confirmation?status=error&type=unsubscribe`,
        request.url
      )
    );
  }

  try {
    // Create Supabase client
    const supabase = createClient();

    // Find subscription by token
    const { data: subscription, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("verification_token", token)
      .single();

    if (error || !subscription) {
      return NextResponse.redirect(
        new URL(
          `/${locale}/newsletter-confirmation?status=error&type=unsubscribe`,
          request.url
        )
      );
    }

    // Update subscriber as unsubscribed
    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({
        unsubscribed: true,
        unsubscribed_at: new Date().toISOString(),
        verification_token: null,
      })
      .eq("id", subscription.id);

    if (updateError) {
      return NextResponse.redirect(
        new URL(
          `/${locale}/newsletter-confirmation?status=error&type=unsubscribe`,
          request.url
        )
      );
    }

    // Use the subscriber's preferred locale for the confirmation page
    const subscriberLocale = subscription.locale || locale;

    return NextResponse.redirect(
      new URL(
        `/${subscriberLocale}/newsletter-confirmation?status=success&type=unsubscribe`,
        request.url
      )
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.redirect(
      new URL(
        `/${locale}/newsletter-confirmation?status=error&type=unsubscribe`,
        request.url
      )
    );
  }
}
