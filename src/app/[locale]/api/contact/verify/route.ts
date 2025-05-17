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
        `/${locale}/contact-confirmation?status=error&type=verify`,
        request.url
      )
    );
  }

  try {
    // Create Supabase client
    const supabase = createClient();

    // Find contact request by verification token
    const { data: contact, error } = await supabase
      .from("contact_requests")
      .select("*")
      .eq("verification_token", token)
      .single();

    if (error || !contact) {
      return NextResponse.redirect(
        new URL(
          `/${locale}/contact-confirmation?status=error&type=verify`,
          request.url
        )
      );
    }

    // Check if token is expired
    if (
      contact.token_expires_at &&
      new Date(contact.token_expires_at) < new Date()
    ) {
      return NextResponse.redirect(
        new URL(
          `/${locale}/contact-confirmation?status=error&type=verify`,
          request.url
        )
      );
    }

    // Mark the contact request as verified
    const { error: updateError } = await supabase
      .from("contact_requests")
      .update({
        verified: true,
        verification_token: null,
        token_expires_at: null,
      })
      .eq("id", contact.id);

    if (updateError) {
      return NextResponse.redirect(
        new URL(
          `/${locale}/contact-confirmation?status=error&type=verify`,
          request.url
        )
      );
    }

    // Redirect to success page
    return NextResponse.redirect(
      new URL(
        `/${locale}/contact-confirmation?status=success&type=verify`,
        request.url
      )
    );
  } catch (error) {
    console.error("Error verifying contact request:", error);
    return NextResponse.redirect(
      new URL(
        `/${locale}/contact-confirmation?status=error&type=verify`,
        request.url
      )
    );
  }
}
