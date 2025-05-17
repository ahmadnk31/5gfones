import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses-client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { contactId, subject, htmlContent, textContent } = body;

    if (!contactId || !subject || !htmlContent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get contact request
    const { data: contact, error: contactError } = await supabase
      .from("contact_requests")
      .select("*")
      .eq("id", contactId)
      .single();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact request not found" },
        { status: 404 }
      );
    }

    // Send email to the user
    await sendEmail({
      to: contact.email,
      subject: subject,
      htmlBody: htmlContent,
      textBody: textContent || htmlContent.replace(/<[^>]*>/g, ""),
    });

    // Update contact request status
    const { error: updateError } = await supabase
      .from("contact_requests")
      .update({
        status: "replied",
        response_subject: subject,
        response_message: htmlContent,
        response_date: new Date().toISOString(),
      })
      .eq("id", contactId);

    if (updateError) {
      console.error("Error updating contact request:", updateError);
      return NextResponse.json(
        { error: "Failed to update contact request" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reply sent successfully",
    });
  } catch (error) {
    console.error("Error sending reply:", error);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}
