import { NextResponse } from 'next/server';
import { getDHLAccessToken, getDHLCredentials } from '../auth';

export async function POST(request: Request) {
  try {
    // Get authentication token and credentials
    const { accessToken, baseUrl } = await getDHLAccessToken();
    const credentials = await getDHLCredentials();
    
    // Parse request data
    const shipmentData = await request.json();
    
    // Construct the DHL API request body
    const dhlRequestBody = {
      pickup: {
        location: {
          businessName: "5GPhones Store",
          addressLine1: "123 Main Street",
          city: "Brussels",
          postalCode: "1000",
          countryCode: "BE"
        }
      },
      sender: {
        name: "5GPhones",
        addressLine1: "123 Main Street",
        city: "Brussels",
        postalCode: "1000",
        countryCode: "BE",
        email: "contact@5gphones.com",
        phoneNumber: "+32123456789"
      },
      receiver: {
        name: shipmentData.recipientName,
        addressLine1: shipmentData.street,
        city: shipmentData.city,
        postalCode: shipmentData.postalCode,
        countryCode: shipmentData.country,
        email: "recipient@example.com", // Replace with actual email from form data
        phoneNumber: "+32987654321" // Replace with actual phone from form data
      },
      account: credentials.accountNumber,
      productCode: shipmentData.product,
      packages: [
        {
          weight: {
            value: parseFloat(shipmentData.weight),
            unit: "kg"
          },
          dimensions: {
            length: parseInt(shipmentData.length),
            width: parseInt(shipmentData.width),
            height: parseInt(shipmentData.height),
            unit: "cm"
          }
        }
      ],
      serviceOptions: shipmentData.includeReturnLabel ? {
        returnLabel: true
      } : {}
    };
    
    // Make API call to DHL to create the shipment
    console.log('Creating DHL shipment with data:', JSON.stringify(dhlRequestBody, null, 2));
    
    const response = await fetch(`${baseUrl}/ecom/eu/v1/shipment`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dhlRequestBody)
    });
    
    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('DHL API error:', responseData);
      return NextResponse.json(
        { error: responseData.message || 'Failed to create shipment' }, 
        { status: response.status }
      );
    }
    
    // Process the successful response
    // Note: This structure is based on assumed DHL API response, adjust according to actual response
    return NextResponse.json({
      trackingNumber: responseData.trackingNumber || responseData.id,
      labelUrl: responseData.documents?.label || responseData.labelUrl,
      shipmentId: responseData.id,
      status: responseData.status || 'created'
    });
    
  } catch (error: any) {
    console.error('Error creating DHL shipment:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred while creating the shipment' }, 
      { status: 500 }
    );
  }
}
