// Test script for the email notification API
// This is a simple script to verify that the email notification API works correctly

/**
 * This function tests the email notification API directly
 * Run this in your browser's console when you have a valid appointment ID
 * @param {number} appointmentId - The ID of an existing appointment to test with
 * @param {string} locale - The locale to use (default: 'en')
 */
async function testEmailNotificationApi(appointmentId, locale = 'en') {
  if (!appointmentId) {
    console.error('An appointment ID is required');
    return;
  }
  
  console.log(`Testing email notification API for appointment #${appointmentId}...`);
  
  try {
    // Call the API endpoint
    const response = await fetch(`/api/repair/send-confirmation-email?id=${appointmentId}&locale=${locale}`, {
      method: 'POST',
    });
    
    // Parse the response
    const result = await response.json();
    
    // Check if the request was successful
    if (response.ok) {
      console.log('✅ Email notification API test PASSED');
      console.log('API Response:', result);
    } else {
      console.error('❌ Email notification API test FAILED');
      console.error('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Email notification API test FAILED');
    console.error('Exception:', error);
  }
}

// Instructions to run this test:
// 1. After creating an appointment, get the appointment ID from the URL or confirmation page
// 2. Run this test with the appointment ID: testEmailNotificationApi(123)
// 3. Check the browser console and server logs to verify the email sending process
console.log('Email notification API test script loaded. Run testEmailNotificationApi(appointmentId) with a valid appointment ID.');
