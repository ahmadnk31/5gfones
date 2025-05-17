import { test, expect } from '@playwright/test';

// Newsletter Admin page tests
test.describe('Newsletter Admin Page', () => {
  test('should display the newsletter form', async ({ page }) => {
    // Mock authenticated state and navigate to newsletter admin page
    await page.goto('/en/admin/newsletter');
    
    // Check if page title exists
    await expect(page.locator('h1')).toContainText('Send Newsletter');
    
    // Verify newsletter stats card is visible
    await expect(page.locator(':text("Newsletter Statistics")')).toBeVisible();
    
    // Verify compose newsletter card is visible
    await expect(page.locator(':text("Compose Newsletter")')).toBeVisible();
    
    // Check subject input exists
    await expect(page.locator('input#subject')).toBeVisible();
    
    // Check tab navigation exists
    await expect(page.locator('button:text("HTML Content")')).toBeVisible();
    await expect(page.locator('button:text("Plain Text")')).toBeVisible();
    await expect(page.locator('button:text("Preview")')).toBeVisible();
    
    // Check Quill editor is rendered
    await expect(page.locator('.quill-editor-container')).toBeVisible();
    
    // Check submit button exists
    await expect(page.locator('button:text("Send Newsletter")')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    await page.goto('/en/admin/newsletter');
    
    // Start at HTML tab by default
    await expect(page.locator('.quill-editor-container')).toBeVisible();
    
    // Click on Plain Text tab
    await page.click('button:text("Plain Text")');
    await expect(page.locator('textarea#textContent')).toBeVisible();
    
    // Click on Preview tab
    await page.click('button:text("Preview")');
    await expect(page.locator('.newsletter-preview')).toBeVisible();
  });

  test('should validate form submission', async ({ page }) => {
    await page.goto('/en/admin/newsletter');
    
    // Try to submit empty form
    await page.click('button:text("Send Newsletter")');
    
    // Should show an error toast
    await expect(page.locator(':text("Please fill out all fields")')).toBeVisible();
    
    // Fill in required fields
    await page.fill('input#subject', 'Test Newsletter');
    
    // Fill HTML content using Quill editor
    await page.evaluate(() => {
      // This adds content to the Quill editor
      const quill = document.querySelector('.ql-editor');
      if (quill) quill.innerHTML = '<p>Test HTML content</p>';
    });
    
    // Switch to plain text tab
    await page.click('button:text("Plain Text")');
    await page.fill('textarea#textContent', 'Test plain text content');
    
    // Mock the API call
    await page.route('/*/api/newsletter/send', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, total: 10 }),
      });
    });
    
    // Submit form
    await page.click('button:text("Send Newsletter")');
    
    // Check for success message
    await expect(page.locator(':text("Newsletter sent to 10 subscribers")')).toBeVisible();
  });
});
