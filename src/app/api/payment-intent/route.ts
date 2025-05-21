import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentIntent } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    // Get the user from the session
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const {
      orderId,
      amount,
      currency = 'usd',
      discounts = [],
      description,
    } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get the user's email from the database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email')
      .eq('id', session.user.id)
      .single();

    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Error retrieving user information' },
        { status: 500 }
      );
    }

    // Create a payment intent
    const result = await createPaymentIntent({
      amount,
      currency,
      orderId,
      discounts,
      userId: session.user.id,
      customerEmail: userData.email,
      description: description || `Payment for order ${orderId}`,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Update the order with the Stripe payment intent ID
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        stripe_payment_id: result.paymentIntentId,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order with Stripe payment intent ID:', updateError);
      // Continue anyway since the payment intent is created
    }

    // Return the client secret needed for Stripe Elements
    return NextResponse.json({
      clientSecret: result.clientSecret,
      paymentIntentId: result.paymentIntentId,
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}
