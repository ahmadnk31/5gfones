import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { orderId, reason, additionalInfo } = await req.json();

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: "Order ID and reason are required" },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = createClient();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if order exists and belongs to the user
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, payment_status, status, payment_id, total_amount, user_uid")
      .eq("id", orderId)
      .eq("user_uid", user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: "Order not found or does not belong to you" },
        { status: 404 }
      );
    }

    // Check if order is eligible for refund
    // Only delivered orders with paid status can be refunded
    if (order.status !== "delivered" || order.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Order is not eligible for refund" },
        { status: 400 }
      );
    }

    // Check if a refund request already exists for this order
    const { data: existingRequest, error: existingError } = await supabase
      .from("refund_requests")
      .select("id, status")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false })
      .maybeSingle();

    if (existingRequest) {
      // Don't allow new requests if there's a pending or approved one
      if (["pending", "approved"].includes(existingRequest.status)) {
        return NextResponse.json(
          { error: "A refund request already exists for this order" },
          { status: 400 }
        );
      }
    }

    // Create refund request
    const { error: requestError } = await supabase
      .from("refund_requests")
      .insert({
        order_id: orderId,
        user_uid: user.id,
        payment_id: order.payment_id,
        reason,
        additional_info: additionalInfo || null,
        status: "pending",
      });

    if (requestError) {
      console.error("Error creating refund request:", requestError);
      return NextResponse.json(
        { error: "Failed to create refund request" },
        { status: 500 }
      );
    }

    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        refund_status: "pending",
        refund_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Error updating order after refund request:", updateError);
      // Continue anyway since the refund request was created
    }

    return NextResponse.json({
      success: true,
      message: "Refund request submitted successfully",
    });
  } catch (error: any) {
    console.error("Error processing refund request:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while processing the request" },
      { status: 500 }
    );
  }
}
