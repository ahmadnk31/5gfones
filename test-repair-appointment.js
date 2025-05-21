// Test script for the repair appointment form
// This is a simple script to verify that the appointment creation works

/**
 * This function simulates filling out and submitting the repair form
 * Run this in your browser's console when on the repair scheduling page
 */
function testRepairAppointmentCreation() {
  console.log('Starting repair appointment test...');
  
  // Step 1: Check if we're on the right page
  if (!window.location.pathname.includes('/repair/schedule')) {
    console.error('Test must be run on the repair schedule page');
    return;
  }
  
  // Step 2: Check if the form is present
  const nameField = document.querySelector('input[name="name"]');
  const emailField = document.querySelector('input[name="email"]');
  const phoneField = document.querySelector('input[name="phone"]');
  
  if (!nameField || !emailField || !phoneField) {
    console.error('Form fields not found - make sure you are on step 4 of the form');
    return;
  }
  
  console.log('Form found, preparing to fill with test data...');
  
  // Step 3: Fill form with test data
  // Note: This assumes you've already selected a device model, repair type, and appointment date/time
  const testData = {
    name: 'Test Customer',
    email: 'test@example.com',
    phone: '5551234567',
    problem: 'Test problem description for this repair',
  };
  
  // Set values for form fields
  if (nameField) nameField.value = testData.name;
  if (emailField) emailField.value = testData.email;
  if (phoneField) phoneField.value = testData.phone;
  
  // Find the problem description textarea and fill it
  const problemField = document.querySelector('textarea[name="problem"]');
  if (problemField) problemField.value = testData.problem;
  
  console.log('Form filled with test data');
  
  // Trigger change events to make sure React state is updated
  [nameField, emailField, phoneField, problemField].forEach(field => {
    if (field) {
      const event = new Event('input', { bubbles: true });
      field.dispatchEvent(event);
    }
  });
  
  console.log('Form data should now be set in React state');
  console.log('Ready for manual submission - please click "Complete Booking" button to finish the test');
}

// Instructions to run this test:
// 1. Navigate to the repair scheduling page
// 2. Complete steps 1-3 (select device, repair type, appointment time)
// 3. When you get to the customer information page (step 4), paste this script in the console and run it
// 4. After the script runs, click the "Complete Booking" button to submit the form
console.log('Repair appointment test script loaded. Run testRepairAppointmentCreation() when ready.');
