// filepath: src\app\api\repair\send-confirmation-email\route.ts
import { NextRequest, NextResponse } from "next/server";
import { sendRepairAppointmentEmail } from "@/lib/repair-email-notifications";

/**
 * API route to send repair appointment confirmation emails
 * @param request - The Next.js request object
 * @returns JSON response indicating success or failure
 */
export async function POST(request: NextRequest) {
  try {
    // Get appointment ID and locale from query parameters
    const searchParams = request.nextUrl.searchParams;
    const appointmentId = searchParams.get("id");
    const locale = searchParams.get("locale") || "en";

    if (!appointmentId) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 }
      );
    }

    // Send confirmation email
    const result = await sendRepairAppointmentEmail(Number(appointmentId), locale);

    if (!result) {
      return NextResponse.json(
        { error: "Failed to send confirmation email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in send-confirmation-email API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
