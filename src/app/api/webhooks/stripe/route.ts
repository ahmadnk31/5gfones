import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import getStripe from '@/lib/stripe';

// This is your Stripe webhook secret for testing your endpoint locally
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const signature = (await headers()).get('stripe-signature')!;    // Verify the webhook signature
    let event: Stripe.Event;
    try {
      const stripe = await getStripe();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    const supabase = createClient();

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update order status in the database
        if (paymentIntent.metadata?.orderId) {
          const orderId = paymentIntent.metadata.orderId;
          
          // Update the order status to 'paid'
          const { error } = await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              updated_at: new Date().toISOString(),
              payment_id: paymentIntent.id,
              payment_details: paymentIntent
            })
            .eq('id', orderId);
            
          if (error) {
            console.error('Error updating order:', error);
            return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
          }
          
          // If the order includes discount information, track usage
          if (paymentIntent.metadata?.discountIds) {
            try {
              const discountIds = JSON.parse(paymentIntent.metadata.discountIds);
              // Record discount usage in your database
              for (const discountId of discountIds) {
                await supabase
                  .from('discount_usage')
                  .insert({
                    discount_id: discountId,
                    order_id: orderId,
                    user_id: paymentIntent.metadata?.userId || null,
                    used_at: new Date().toISOString()
                  });
              }
            } catch (err) {
              console.error('Error recording discount usage:', err);
            }
          }
        }
        break;
      }
      
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update order status in the database
        if (session.metadata?.orderId) {
          const orderId = session.metadata.orderId;
          
          // Update the order status to 'paid'
          const { error } = await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              updated_at: new Date().toISOString(),
              payment_id: session.id,
              payment_details: session
            })
            .eq('id', orderId);
            
          if (error) {
            console.error('Error updating order:', error);
            return NextResponse.json({ error: 'Error updating order' }, { status: 500 });
          }
          
          // If the order includes discount information, you can track usage here
          if (session.metadata?.discountIds) {
            try {
              const discountIds = JSON.parse(session.metadata.discountIds);
              // Record discount usage in your database
              for (const discountId of discountIds) {
                await supabase
                  .from('discount_usage')
                  .insert({
                    discount_id: discountId,
                    order_id: orderId,
                    user_id: session.metadata?.userId || null,
                    used_at: new Date().toISOString()
                  });
              }
            } catch (err) {
              console.error('Error recording discount usage:', err);
            }
          }
        }
        break;
      }
      
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        // Find the order associated with this charge
        const { data: orders, error } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_id', charge.payment_intent);
          
        if (error || !orders || orders.length === 0) {
          console.error('Error finding order for refund:', error);
          break;
        }
        
        // Update the order status to 'refunded'
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: charge.refunded ? 'refunded' : 'partially_refunded',
            refund_amount: charge.amount_refunded / 100, // Convert cents to dollars
            updated_at: new Date().toISOString(),
            refund_details: charge
          })
          .eq('id', orders[0].id);
          
        if (updateError) {
          console.error('Error updating order for refund:', updateError);
        }
        break;
      }
      
      // Add more event types as needed for your application
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Find the order associated with this payment intent
        const { data: orders, error } = await supabase
          .from('orders')
          .select('id')
          .eq('payment_id', paymentIntent.id);
          
        if (error || !orders || orders.length === 0) {
          console.error('Error finding order for failed payment:', error);
          break;
        }
        
        // Update the order status to 'failed'
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            updated_at: new Date().toISOString(),
            payment_details: paymentIntent
          })
          .eq('id', orders[0].id);
          
        if (updateError) {
          console.error('Error updating order for failed payment:', updateError);
        }
        break;
      }
      
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return NextResponse.json(
      { error: 'An error occurred processing the webhook' },
      { status: 500 }
    );
  }
}
