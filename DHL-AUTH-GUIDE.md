# DHL Authentication Implementation Guide

This guide explains the implementation of the DHL eCommerce Europe API authentication system in the application.

## Overview

The DHL integration has been implemented with a dedicated authentication test module that allows:
1. Testing with exact authentication code
2. Testing with custom parameters
3. Testing with saved credentials

## File Structure

- `src/app/[locale]/admin/dhl-auth-test/page.tsx` - Authentication test UI
- `src/app/[locale]/admin/dhl-experimental/page.tsx` - Main DHL integration page
- `src/app/api/dhl/auth.ts` - Authentication utility functions
- `src/app/api/dhl/test-auth/route.ts` - API endpoint for testing authentication

## Authentication Methods

### 1. Direct API Authentication

The system supports direct authentication against the DHL API using clientId, key, userId (UUID format), and account numbers:

```typescript
const myHeaders = new Headers();
myHeaders.append("content-type", "application/json");

const raw = JSON.stringify({
  "clientId": "YOUR_CLIENT_ID", // Required - from DHL_CLIENT_ID env var
  "key": "YOUR_API_KEY",        // Required - from DHL_CLIENT_SECRET env var
  "userId": "00000000-0000-0000-0000-000000000000", // Required - must be valid UUID format
  "accountNumbers": ["YOUR_ACCOUNT_NUMBER"]         // Optional - can be 'string' for testing
});

const requestOptions = {
  method: "POST",
  headers: myHeaders,
  body: raw,
  redirect: "follow" as RequestRedirect
};

fetch("https://api-gw.dhlparcel.nl/authenticate/api-key", requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

### 2. Stored Credentials Authentication

For secured authentication using stored credentials:

```typescript
// Server side (api/dhl/auth.ts)
export async function getDHLAccessToken() {
  const credentials = await getDHLCredentials(); // From database
  const baseUrl = credentials.testMode ? 'https://api-sandbox.dhl.com' : 'https://api.dhl.com';
  const authHeader = 'Basic ' + Buffer.from(`${credentials.apiKey}:${credentials.apiSecret}`).toString('base64');
  
  const response = await fetch(`${baseUrl}/ccc/v1/auth/accesstoken`, {
    method: 'GET',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json'
    }
  });
  
  const result = await response.json();
  return {
    accessToken: result.access_token,
    expires: result.expires_in,
    baseUrl
  };
}
```

## Configuration

DHL API credentials can be configured in two ways:

### Environment Variables (Preferred)

Add the following to your `.env.local` file:
```
DHL_CLIENT_ID=your_client_id
DHL_CLIENT_SECRET=your_client_secret
DHL_ACCOUNT_NUMBER=your_account_number (optional)
```

### Database Storage

DHL API credentials can also be stored in the Supabase database in the `settings` table with:
- Type: 'dhl'
- Settings JSON containing:
  - apiKey (client ID)
  - apiSecret (client secret)
  - accountNumber
  - testMode (boolean)

The system prioritizes environment variables over database settings if both are available.

## Usage

1. Navigate to the Authentication Test page: `/[locale]/admin/dhl-auth-test`
2. Choose one of the testing methods:
   - Test with original sample code
   - Test with custom credentials
   - Test with saved database credentials
3. View authentication results and any errors
4. Use the successful authentication to call other DHL endpoints

## Integration with Other Features

Once authenticated, the access token can be used for:
- Creating shipments
- Tracking packages
- Managing returns
- Other DHL eCommerce Europe API features

## Error Handling

The system handles various authentication errors:
- Invalid credentials
- API connectivity issues
- Missing required parameters
- Server errors

Error messages are displayed in the UI and logged to the console for debugging.

## Security Considerations

- API credentials are stored securely in the database
- The access token is only used server-side and not exposed to clients
- Test mode can be toggled to prevent accidental production API calls
- Authentication responses are sanitized before being shown in the UI
