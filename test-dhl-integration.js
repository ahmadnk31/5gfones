// Test script for DHL API integration
// Run with: node test-dhl-integration.js

// Replace with actual API credentials for testing
const apiKey = 'YOUR_API_KEY';
const apiSecret = 'YOUR_API_SECRET';

// Test DHL authentication
async function testDHLAuth() {
  try {
    console.log('Testing DHL API Authentication...');
    
    // Create authorization header with API key and secret
    const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
    
    // Make the request to DHL sandbox auth endpoint
    const response = await fetch('https://api-sandbox.dhl.com/ccc/v1/auth/accesstoken', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✓ Authentication successful!');
      console.log('Access Token:', result.access_token);
      console.log('Expires in:', result.expires_in, 'seconds');
    } else {
      console.error('✗ Authentication failed:', result);
    }
    
    return result;
  } catch (error) {
    console.error('Error during DHL API test:', error);
  }
}

// Run tests
testDHLAuth();
