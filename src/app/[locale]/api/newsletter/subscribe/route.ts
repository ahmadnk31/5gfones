import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses-client";
import {
  getVerificationEmailContent,
  sendMultilanguageEmail,
  SupportedLanguage,
} from "@/lib/multi-language-email";

export async function POST(request: Request) {
  try {
    const { email, locale = "en" } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if locale is supported, default to English if not
    const supportedLocales = ["en", "es"]; // Our supported languages
    const selectedLocale = supportedLocales.includes(locale) ? locale : "en";

    // Create Supabase client
    const supabase = createClient();

    // Check if already subscribed
    const { data: existingSubscriber } = await supabase
      .from("newsletter_subscribers")
      .select("id, verified")
      .eq("email", email)
      .single();

    if (existingSubscriber?.verified) {
      return NextResponse.json(
        {
          message: "Email already subscribed",
        },
        { status: 400 }
      );
    }

    // Generate verification token
    const verificationToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours from now

    // Base URL for verification
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const verificationLink = `${baseUrl}/${locale}/api/newsletter/verify?token=${verificationToken}`;

    // If email exists but not verified, update the token
    if (existingSubscriber) {
      await supabase
        .from("newsletter_subscribers")
        .update({
          verification_token: verificationToken,
          token_expires_at: expiresAt.toISOString(),
        })
        .eq("id", existingSubscriber.id);
    } else {
      // Insert new subscriber
      await supabase.from("newsletter_subscribers").insert({
        email,
        verification_token: verificationToken,
        token_expires_at: expiresAt.toISOString(),
        locale: selectedLocale,
      });
    }

    // Get email verification content in multiple languages
    const emailContent = await getVerificationEmailContent(verificationLink);

    // Send multilanguage verification email based on user's locale preference
    await sendMultilanguageEmail({
      to: email,
      content: emailContent,
      preferredLanguage: selectedLocale as SupportedLanguage,
    });

    return NextResponse.json({
      message: "Verification email sent",
    });
  } catch (error: any) {
    console.error("Newsletter subscription error:", error);
    return NextResponse.json(
      {
        error: "Failed to process subscription",
      },
      { status: 500 }
    );
  }
}
