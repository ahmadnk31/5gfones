import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createRefund } from "@/lib/stripe";

export async function POST(req: Request) {
  try {
    // Get refund details from request
    const { paymentIntentId, amount, reason, orderId } = await req.json();

    // Validate inputs
    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = createClient();

    // Check if order exists and is eligible for refund
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_status, total_amount")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if order is in a refundable state
    if (!["paid", "partially_refunded"].includes(order.payment_status)) {
      return NextResponse.json(
        { error: "Order is not eligible for refund" },
        { status: 400 }
      );
    }

    // Process the refund via Stripe API
    const { success, refund, error } = await createRefund(paymentIntentId, amount);

    if (!success) {
      return NextResponse.json(
        { error: error || "Failed to process refund" },
        { status: 500 }
      );
    }

    // Calculate if this is a full or partial refund
    const orderTotal = parseFloat(order.total_amount) * 100; // Convert to cents for comparison
    const isFullRefund = amount >= orderTotal;

    // Update order in database
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: isFullRefund ? "refunded" : "partially_refunded",
        refund_amount: amount / 100, // Store in database currency units
        refund_reason: reason || null,
        refund_date: new Date().toISOString(),
        refund_details: refund,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order after refund:", updateError);
      // Don't return error to client since the refund was already processed
    }

    // Log the refund transaction
    const { error: logError } = await supabase.from("payment_transactions").insert({
      order_id: orderId,
      transaction_type: "refund",
      amount: amount / 100, // Store in database currency units
      payment_processor: "stripe",
      transaction_id: refund?.id,
      status: "completed",
      details: refund,
    });

    if (logError) {
      console.error("Error logging refund transaction:", logError);
    }

    // Return success response
    return NextResponse.json({
      success: true,
      refundId: refund.id,
      status: isFullRefund ? "refunded" : "partially_refunded",
      amount: amount / 100, // Return in dollars
    });
  } catch (error: any) {
    console.error("Error processing refund:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while processing the refund" },
      { status: 500 }
    );
  }
}
