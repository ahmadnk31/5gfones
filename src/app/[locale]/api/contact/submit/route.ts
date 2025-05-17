import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message } = body;
    const url = new URL(request.url);
    const locale = url.pathname.split("/")[1] || "en";

    // Validate input
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create a verification token
    const verificationToken = crypto.randomBytes(32).toString("hex");

    // Set token expiration to 24 hours from now
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 24);

    const supabase = createClient();

    // Store the contact request in database
    const { data: contact, error } = await supabase
      .from("contact_requests")
      .insert({
        name,
        email,
        subject,
        message,
        verification_token: verificationToken,
        token_expires_at: tokenExpiresAt.toISOString(),
        verified: false,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Error storing contact request:", error);
      return NextResponse.json(
        { error: "Failed to store contact request" },
        { status: 500 }
      );
    }

    // Generate verification URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || url.origin;
    const verificationUrl = `${baseUrl}/${locale}/api/contact/verify?token=${verificationToken}`;

    // Send verification email
    await sendEmail({
      to: email,
      subject: `Verify Your Contact Request - 5GPhones`,
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Verify Your Contact Request</h2>
          <p>Hello ${name},</p>
          <p>Thank you for contacting us. To confirm your contact request, please click the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Contact Request</a>
          </div>
          <p>Your request will be processed after verification.</p>
          <p>If you did not submit a contact request, please ignore this email.</p>
          <p>This verification link will expire in 24 hours.</p>
          <p>Best regards,<br>5GPhones Team</p>
        </div>
      `,
      textBody: `
        Verify Your Contact Request
        
        Hello ${name},
        
        Thank you for contacting us. To confirm your contact request, please click the link below:
        
        ${verificationUrl}
        
        Your request will be processed after verification.
        
        If you did not submit a contact request, please ignore this email.
        
        This verification link will expire in 24 hours.
        
        Best regards,
        5GPhones Team
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Contact request submitted. Please check your email to verify.",
    });
  } catch (error) {
    console.error("Error processing contact request:", error);
    return NextResponse.json(
      { error: "Failed to process contact request" },
      { status: 500 }
    );
  }
}
