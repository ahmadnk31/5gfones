# DHL eCommerce Europe API Integration

This document provides information about the DHL eCommerce Europe API integration in the 5GPhones admin panel.

## Features

The DHL integration provides the following features:
- Creating new shipments
- Generating shipping labels
- Tracking existing shipments
- Configuring API credentials

## Setup Instructions

### 1. DHL Account Setup

1. Sign up for a DHL eCommerce Europe account at [DHL Developer Portal](https://developer.dhl.com/)
2. Create an application and request access to the eCommerce Europe API
3. After approval, note your API key, API secret, and account number

### 2. Configuration in 5GPhones Admin

1. Navigate to the admin panel: `/admin/dhl-experimental`
2. Click on the "API Settings" tab
3. Enter your DHL API credentials:
   - API Key
   - API Secret
   - Account Number
4. Toggle "Test Mode" on/off depending on whether you're using the sandbox or production environment
5. Save your settings

## Using the Integration

### Creating a Shipment

1. Go to the "Create Shipment" tab
2. Fill in the recipient information
3. Enter package details (weight, dimensions)
4. Select the DHL product type
5. Optionally enable return label
6. Click "Create Shipment"
7. Once created, you can download the shipping label

### Tracking a Shipment

1. Go to the "Track Shipment" tab
2. Enter the tracking number
3. Click "Track Package"
4. View the shipment events and status information

## API Endpoints

The integration uses the following API endpoints:

- `/api/dhl/create-shipment` - Creates a new shipment
- `/api/dhl/track-shipment` - Tracks an existing shipment
- `/api/dhl/test-auth` - Tests authentication with DHL API

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify that your API credentials are correct
   - Ensure the test mode setting matches your credentials type (sandbox vs production)
   
2. **Shipment Creation Fails**
   - Check that all required fields are filled in correctly
   - Verify your DHL account number is valid
   - Check that package dimensions and weight are within allowed limits

3. **Tracking Not Working**
   - Ensure the tracking number is entered correctly
   - New shipments may take time to appear in the tracking system

### API Documentation

For detailed API information, refer to the [DHL eCommerce Europe API Documentation](https://developer.dhl.com/api-reference/ecommerce-europe).
