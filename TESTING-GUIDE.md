# Repair Appointment Fix - Testing Guide

This guide will help you test the fixes made to the repair appointment system to verify that:
1. Appointments can be created successfully without the "Missing required appointment information" error
2. Email notifications are sent correctly after appointment creation

## Testing the Fix

### Manual Testing

1. **Complete the repair appointment form:**
   - Go to the repair scheduling page (`/[locale]/repair/schedule`)
   - Select a device brand, type, series, and model
   - Select one or more repair types
   - Select an appointment date and time
   - Fill in customer information (name, email, phone)
   - Select a delivery method (pickup or shipping)
   - Submit the form by clicking "Complete Booking"

2. **Verify successful appointment creation:**
   - You should be redirected to the confirmation page
   - Check the URL to see if it contains an appointment ID (`/[locale]/repair/confirmation?id=[appointment_id]`)
   - The confirmation page should display appointment details

3. **Check server logs for email notification:**
   - Since we're using a mock email service in development mode, check the server logs
   - You should see log entries indicating an email would have been sent
   - The logs should include the email subject, recipient, and preview of content

### Using Test Scripts

Two test scripts have been created to help with testing:

1. **Test Appointment Creation (`test-repair-appointment.js`):**
   ```javascript
   // In browser console on the repair form page (step 4)
   testRepairAppointmentCreation()
   // Then click "Complete Booking" button
   ```

2. **Test Email Notification API (`test-email-notification.js`):**
   ```javascript
   // In browser console with a valid appointment ID
   testEmailNotificationApi(123) // Replace 123 with a real appointment ID
   ```

## Checking Database

To verify the fix is working at the database level:

1. **Check the appointments table:**
   ```sql
   SELECT * FROM appointments ORDER BY created_at DESC LIMIT 1;
   ```
   - Confirm the most recent appointment has customer_name, customer_email, and customer_phone fields populated

2. **Check the appointment_items table:**
   ```sql
   SELECT * FROM appointment_items 
   WHERE appointment_id = (SELECT id FROM appointments ORDER BY created_at DESC LIMIT 1);
   ```
   - Verify repair items were linked to the appointment

## Expected Results

- The form submits without any "Missing required appointment information" error
- A new record is created in the appointments table with customer information
- The API endpoint for sending emails returns a success response
- Server logs show that the email would have been sent (in development mode)

If you want to implement a real email provider in production:
1. Update the `email-service.ts` file with your chosen provider (SendGrid, AWS SES, etc.)
2. Set the appropriate environment variables for your email service
3. Test again in the production environment
