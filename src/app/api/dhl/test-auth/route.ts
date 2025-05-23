import { NextResponse } from 'next/server';
import { getDHLAccessToken } from '../auth';

export async function GET() {
  try {
    // Attempt to get an access token from DHL
    const { accessToken, expires, baseUrl } = await getDHLAccessToken();
    
    // Return the token info (but not the token itself for security)
    return NextResponse.json({
      success: true,
      authenticated: true,
      expiresIn: expires,
      environment: baseUrl.includes('sandbox') ? 'Sandbox' : 'Production'
    });
    
  } catch (error: any) {
    console.error('Error testing DHL authentication:', error);
    return NextResponse.json(
      { 
        success: false, 
        authenticated: false,
        error: error.message || 'Failed to authenticate with DHL API'
      }, 
      { status: 500 }
    );
  }
}
