import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createCheckoutSession } from '@/lib/stripe';

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
      items,
      discounts = [],
      successUrl, 
      cancelUrl 
    } = await req.json();

    if (!orderId || !items || !successUrl || !cancelUrl) {
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

    // Format the line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
          images: item.image ? [item.image] : undefined,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Create a checkout session
    const result = await createCheckoutSession({
      items: lineItems,
      orderId,
      discounts,
      userId: session.user.id,
      customerEmail: userData.email,
      successUrl,
      cancelUrl,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    // Update the order with the Stripe session ID
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        stripe_payment_id: result.sessionId,
        payment_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      console.error('Error updating order with Stripe session ID:', updateError);
      // Continue anyway since the checkout session is created
    }

    return NextResponse.json({
      url: result.url,
      sessionId: result.sessionId,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred' }, 
      { status: 500 }
    );
  }
}
