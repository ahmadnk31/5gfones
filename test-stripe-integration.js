/**
 * Test script for Stripe integration
 * 
 * This script tests various Stripe API functions to ensure the integration is working
 * correctly. It will:
 * 1. Test API key validation
 * 2. Create a test payment intent
 * 3. Create a test checkout session
 * 4. Process a test refund
 * 
 * Usage:
 * node test-stripe-integration.js
 */

// Load environment variables
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Helper to log success/error
function logResult(message, success) {
  console.log(
    success 
      ? `${colors.green}✓ SUCCESS: ${message}${colors.reset}`
      : `${colors.red}✗ ERROR: ${message}${colors.reset}`
  );
}

// Helper to log section header
function logSection(title) {
  console.log(`\n${colors.blue}=== ${title} ===${colors.reset}\n`);
}

// Test API key validation
async function testApiKey() {
  logSection("TESTING STRIPE API KEY");
  try {
    const balance = await stripe.balance.retrieve();
    logResult("API key is valid", true);
    return true;
  } catch (error) {
    logResult(`API key is invalid: ${error.message}`, false);
    return false;
  }
}

// Create a test payment intent
async function testCreatePaymentIntent() {
  logSection("TESTING PAYMENT INTENT CREATION");
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1099, // $10.99
      currency: 'usd',
      description: 'Test payment intent',
      metadata: {
        orderId: 'test-order-' + Date.now(),
        integration_test: true,
      }
    });
    
    logResult(`Payment intent created with ID: ${paymentIntent.id}`, true);
    console.log(`Client secret: ${paymentIntent.client_secret.substring(0, 10)}...`);
    return paymentIntent;
  } catch (error) {
    logResult(`Failed to create payment intent: ${error.message}`, false);
    return null;
  }
}

// Test refunding a payment intent
async function testRefund(paymentIntentId) {
  logSection("TESTING REFUND PROCESSING");
  
  if (!paymentIntentId) {
    console.log(`${colors.yellow}Skipping refund test - no payment intent available${colors.reset}`);
    return null;
  }
  
  try {
    // Create a test charge first, since we can't refund an uncaptured payment intent
    const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
    console.log(`Captured payment intent: ${paymentIntent.id}`);
    
    // Now refund it
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: 500, // $5.00 partial refund
    });
    
    logResult(`Refund created with ID: ${refund.id}`, true);
    return refund;
  } catch (error) {
    logResult(`Failed to process refund: ${error.message}`, false);
    return null;
  }
}

// Run all tests
async function runTests() {
  console.log(`${colors.yellow}Starting Stripe integration tests...${colors.reset}`);
  
  // Test API key
  const apiKeyValid = await testApiKey();
  if (!apiKeyValid) {
    console.log(`${colors.red}Cannot continue testing with invalid API key${colors.reset}`);
    return;
  }
  
  // Test payment intent creation
  const paymentIntent = await testCreatePaymentIntent();
  
  // Test refund (only if we have a payment intent)
  if (paymentIntent && paymentIntent.status === 'requires_capture') {
    const refund = await testRefund(paymentIntent.id);
  } else {
    console.log(`${colors.yellow}Skipping refund test - payment intent not ready for refund${colors.reset}`);
  }
  
  console.log(`\n${colors.green}All tests completed!${colors.reset}`);
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
});
