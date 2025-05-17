import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
});

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      appointmentId,
      amount,
      paymentMethodId,
      customerId,
      deliveryMethod,
      shippingAddress,
      metadata = {},
    } = await request.json();

    // Check if appointment exists and belongs to the user
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, customer_id")
      .eq("id", appointmentId)
      .eq("user_uid", user.id)
      .single();

    if (appointmentError || !appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 }
      );
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      payment_method: paymentMethodId,
      confirm: true,
      description: `Shipping payment for repair #${appointmentId}`,
      metadata: {
        ...metadata,
        appointmentId: appointmentId.toString(),
        customerId: customerId,
        deliveryMethod,
      },
      shipping: shippingAddress
        ? {
            name: shippingAddress.name,
            address: {
              line1: shippingAddress.address.line1,
              line2: shippingAddress.address.line2 || "",
              city: shippingAddress.address.city,
              state: shippingAddress.address.state,
              postal_code: shippingAddress.address.postal_code,
              country: shippingAddress.address.country,
            },
          }
        : undefined,
    });

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        { error: "Payment failed", status: paymentIntent.status },
        { status: 400 }
      );
    }

    // Update appointment with shipping details and payment ID
    const { error: updateError } = await supabase
      .from("appointments")
      .update({
        delivery_method: deliveryMethod,
        stripe_payment_id: paymentIntent.id,
        shipping_cost: amount,
        shipping_address: shippingAddress?.address.line1,
        shipping_address_line2: shippingAddress?.address.line2,
        shipping_city: shippingAddress?.address.city,
        shipping_state: shippingAddress?.address.state,
        shipping_postal_code: shippingAddress?.address.postal_code,
        shipping_country: shippingAddress?.address.country,
        shipping_name: shippingAddress?.name,
      })
      .eq("id", appointmentId);

    if (updateError) {
      // Payment succeeded but database update failed
      // You might want to log this for manual intervention
      console.error("Error updating appointment:", updateError);

      return NextResponse.json({
        id: paymentIntent.id,
        warning: "Payment processed but database update failed",
      });
    }

    // Add a transaction record
    await supabase.from("transactions").insert({
      description: `Shipping payment for appointment #${appointmentId}`,
      appointment_id: appointmentId,
      amount: amount,
      user_uid: user.id,
      type: "income",
      category: "shipping",
      status: "completed",
    });

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (error: any) {
    console.error("Stripe payment error:", error);

    return NextResponse.json(
      { error: error.message || "Payment processing failed" },
      { status: 500 }
    );
  }
}
