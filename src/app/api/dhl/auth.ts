import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Gets DHL API credentials from the database or environment variables
 */
export async function getDHLCredentials() {
  // Check if environment variables are available first
  if (process.env.DHL_CLIENT_ID && process.env.DHL_CLIENT_SECRET) {
    console.log('Using DHL credentials from environment variables');
    return {
      apiKey: process.env.DHL_CLIENT_ID,
      apiSecret: process.env.DHL_CLIENT_SECRET,
      accountNumber: process.env.DHL_ACCOUNT_NUMBER || 'string',
      testMode: true
    };
  }
  
  // Fallback to database
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('settings')
    .select('settings')
    .eq('type', 'dhl')
    .single();
    
  if (error) {
    console.error('Error fetching DHL settings:', error);
    throw new Error('Failed to retrieve DHL settings');
  }
  
  const credentials = data?.settings || {};
  
  // Check if we have the required credentials
  if (!credentials.apiKey || !credentials.apiSecret || !credentials.accountNumber) {
    throw new Error('DHL API credentials are not properly configured');
  }
  
  return {
    apiKey: credentials.apiKey,
    apiSecret: credentials.apiSecret,
    accountNumber: credentials.accountNumber,
    testMode: credentials.testMode !== false
  };
}

/**
 * Gets an access token from DHL API
 */
export async function getDHLAccessToken() {
  try {
    const credentials = await getDHLCredentials();
    
    // Determine the API URL based on test mode
    const baseUrl = credentials.testMode 
      ? 'https://api-sandbox.dhl.com' 
      : 'https://api.dhl.com';
      
    // Create authorization header with API key and secret
    const authHeader = 'Basic ' + Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString('base64');
    
    const response = await fetch(`${baseUrl}/ccc/v1/auth/accesstoken`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('DHL auth error:', errorText);
      throw new Error(`Failed to authenticate with DHL API: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.access_token) {
      throw new Error('No access token received from DHL API');
    }
    
    return {
      accessToken: result.access_token,
      expires: result.expires_in,
      baseUrl
    };
  } catch (error) {
    console.error('Error getting DHL access token:', error);
    throw error;
  }
}
