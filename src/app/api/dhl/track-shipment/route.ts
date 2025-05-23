import { NextResponse } from 'next/server';
import { getDHLAccessToken } from '../auth';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get('trackingNumber');
    
    if (!trackingNumber) {
      return NextResponse.json(
        { error: 'Tracking number is required' }, 
        { status: 400 }
      );
    }
    
    // Get authentication token and base URL
    const { accessToken, baseUrl } = await getDHLAccessToken();
    
    // Make API call to DHL to track the shipment
    const response = await fetch(`${baseUrl}/ecom/eu/v1/tracking?trackingNumber=${trackingNumber}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('DHL tracking API error:', responseData);
      return NextResponse.json(
        { error: responseData.message || 'Failed to track shipment' }, 
        { status: response.status }
      );
    }
    
    // Transform the tracking response to our expected format
    // Note: Adjust this based on the actual DHL API response structure
    const events = responseData.shipments?.[0]?.events || 
                  responseData.events || 
                  [];
                  
    const formattedEvents = events.map((event: any) => ({
      status: event.status || event.statusCode || 'Unknown',
      timestamp: event.timestamp || event.date || new Date().toISOString(),
      description: event.description || event.statusDescription || 'No description available',
      location: event.location?.address?.addressLocality || 
                event.location || 
                'Location not available'
    }));
    
    return NextResponse.json({
      trackingNumber,
      events: formattedEvents,
      status: responseData.shipments?.[0]?.status || responseData.status || 'Unknown'
    });
    
  } catch (error: any) {
    console.error('Error tracking DHL shipment:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while tracking the shipment' }, 
      { status: 500 }
    );
  }
}
