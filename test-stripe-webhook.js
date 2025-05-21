// This script helps you test your Stripe webhook without having to make actual payments
// You'll need to have the Stripe CLI installed to use this script
// See: https://stripe.com/docs/stripe-cli

// Script to simulate Stripe webhook events for testing

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function simulateCheckoutSessionCompleted() {
  try {
    // Create a test checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Product',
            },
            unit_amount: 2000, // $20.00
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      metadata: {
        orderId: 'test-order-123',
        userId: 'test-user-456',
      },
    });

    console.log('Created test checkout session:', session.id);
    console.log('\nTo simulate this event, run:');
    console.log(`stripe trigger checkout.session.completed --add checkout_session:${session.id}`);
    
    return session;
  } catch (error) {
    console.error('Error creating test session:', error);
    throw error;
  }
}

// Run the simulation
simulateCheckoutSessionCompleted().catch(console.error);

/*
Instructions for testing with Stripe CLI:

1. Install the Stripe CLI from https://stripe.com/docs/stripe-cli
2. Log in with: stripe login
3. Set up webhook forwarding:
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
4. In a new terminal, run this script: node test-stripe-webhook.js
5. Use the command output to trigger an event:
   stripe trigger checkout.session.completed --add checkout_session:cs_test_XXX

This will send a webhook to your local endpoint as if a real payment had been completed.
*/
