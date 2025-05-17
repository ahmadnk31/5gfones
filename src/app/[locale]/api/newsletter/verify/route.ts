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
        `/${locale}/newsletter-confirmation?status=error&type=verify`,
        request.url
      )
    );
  }

  try {
    // Create Supabase client
    const supabase = createClient();

    // Find subscription by verification token
    const { data: subscription, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .eq("verification_token", token)
      .single();

    if (error || !subscription) {
      return NextResponse.redirect(
        new URL(
          `/${locale}/newsletter-confirmation?status=error&type=verify`,
          request.url
        )
      );
    }

    // Check if token is expired
    if (
      subscription.token_expires_at &&
      new Date(subscription.token_expires_at) < new Date()
    ) {
      return NextResponse.redirect(
        new URL(
          `/${locale}/newsletter-confirmation?status=error&type=verify`,
          request.url
        )
      );
    }

    // Update subscriber as verified
    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({
        verified: true,
        verification_token: null,
        token_expires_at: null,
        verified_at: new Date().toISOString(),
      })
      .eq("id", subscription.id);

    if (updateError) {
      return NextResponse.redirect(
        new URL(
          `/${locale}/newsletter-confirmation?status=error&type=verify`,
          request.url
        )
      );
    }

    // Use the subscriber's preferred locale for the confirmation page
    const subscriberLocale = subscription.locale || locale;

    return NextResponse.redirect(
      new URL(
        `/${subscriberLocale}/newsletter-confirmation?status=success&type=verify`,
        request.url
      )
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.redirect(
      new URL(
        `/${locale}/newsletter-confirmation?status=error&type=verify`,
        request.url
      )
    );
  }
}
