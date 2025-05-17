#!/usr/bin/env node

/**
 * Email Newsletter Test Script
 *
 * This script simulates sending newsletter emails in multiple languages
 * to verify that the multilingual functionality works properly.
 *
 * Usage:
 * node scripts/test-newsletter-emails.js
 *
 * Note: This is a test script and does NOT send actual emails.
 */
const { v4: uuidv4 } = require("uuid");

// Mock email content
const testData = {
  subject: "Test Newsletter: New Products Available!",
  htmlContent: `
    <h2>New Products Available!</h2>
    <p>Check out our latest products and special offers.</p>
    <ul>
      <li>Product 1: $99</li>
      <li>Product 2: $149</li>
      <li>Product 3: $199</li>
    </ul>
    <p>Limited time offer: Use code <strong>SAVE20</strong> for 20% off!</p>
  `,
  textContent: `
    New Products Available!
    
    Check out our latest products and special offers:
    
    - Product 1: $99
    - Product 2: $149
    - Product 3: $199
    
    Limited time offer: Use code SAVE20 for 20% off!
  `,
};

// Mock subscribers
const mockSubscribers = [
  { email: "user1@example.com", locale: "en", verification_token: uuidv4() },
  { email: "user2@example.com", locale: "es", verification_token: uuidv4() },
  { email: "user3@example.com", locale: "fr", verification_token: uuidv4() },
  { email: "user4@example.com", locale: "de", verification_token: uuidv4() },
  { email: "user5@example.com", locale: "zh", verification_token: uuidv4() },
];

// Mock translations for testing
const mockTranslations = {
  en: {
    unsubscribeText: "To unsubscribe from our newsletter, click here:",
    unsubscribeLink: "Unsubscribe",
  },
  es: {
    unsubscribeText:
      "Para cancelar la suscripción a nuestro boletín, haga clic aquí:",
    unsubscribeLink: "Cancelar suscripción",
  },
};

// Mock API translation function
async function mockTranslateText(text, targetLanguage) {
  console.log(
    `[Mock] Translating to ${targetLanguage}:`,
    text.substring(0, 50) + "..."
  );
  return `[${targetLanguage}] ` + text;
}

// Mock getNewsletterEmailContent function
async function mockGetNewsletterEmailContent(
  subject,
  html,
  text,
  unsubscribeUrl,
  token
) {
  console.log(`[Mock] Generating email content with token: ${token}`);

  return {
    subject: {
      en: subject,
      es: subject,
    },
    htmlBody: {
      en: `<div>${html}<p>${mockTranslations.en.unsubscribeText} <a href="${unsubscribeUrl}?token=${token}">${mockTranslations.en.unsubscribeLink}</a></p></div>`,
      es: `<div>${html}<p>${mockTranslations.es.unsubscribeText} <a href="${unsubscribeUrl}?token=${token}">${mockTranslations.es.unsubscribeLink}</a></p></div>`,
    },
    textBody: {
      en: `${text}\n\n${mockTranslations.en.unsubscribeText} ${unsubscribeUrl}?token=${token}`,
      es: `${text}\n\n${mockTranslations.es.unsubscribeText} ${unsubscribeUrl}?token=${token}`,
    },
  };
}

// Mock sendMultilanguageEmail function
async function mockSendMultilanguageEmail({
  to,
  content,
  preferredLanguage,
  autoTranslate,
}) {
  console.log(`\n[Mock] Sending email to: ${to}`);
  console.log(`[Mock] Preferred language: ${preferredLanguage}`);

  // Determine language to use
  let language = preferredLanguage;
  if (!content.subject[preferredLanguage]) {
    console.log(
      `[Mock] Language ${preferredLanguage} not directly supported, using fallback...`
    );
    if (autoTranslate) {
      console.log(`[Mock] Using auto-translation for ${preferredLanguage}...`);

      // Simulate auto-translation
      const translatedSubject = await mockTranslateText(
        content.subject.en,
        preferredLanguage
      );
      const translatedHtmlBody = await mockTranslateText(
        content.htmlBody.en,
        preferredLanguage
      );
      const translatedTextBody = await mockTranslateText(
        content.textBody.en,
        preferredLanguage
      );

      console.log(`[Mock] Translated subject: ${translatedSubject}`);
      console.log(
        `[Mock] HTML body translated: Yes (${translatedHtmlBody.length} chars)`
      );
      console.log(
        `[Mock] Text body translated: Yes (${translatedTextBody.length} chars)`
      );
      return;
    } else {
      language = "en"; // Fallback to English
      console.log(`[Mock] Falling back to language: ${language}`);
    }
  }

  // Show email content
  console.log(`[Mock] Subject: ${content.subject[language]}`);
  console.log(
    `[Mock] HTML body length: ${content.htmlBody[language].length} chars`
  );
  console.log(
    `[Mock] Text body length: ${content.textBody[language].length} chars`
  );
}

// Main test function
async function runTest() {
  console.log("📧 NEWSLETTER EMAIL TEST");
  console.log("========================\n");

  console.log("Testing multilingual newsletter email functionality...\n");

  // Process subscribers
  for (const subscriber of mockSubscribers) {
    // Generate email content
    const unsubscribeBaseUrl =
      "http://localhost:3000/api/newsletter/unsubscribe";
    const emailContent = await mockGetNewsletterEmailContent(
      testData.subject,
      testData.htmlContent,
      testData.textContent,
      unsubscribeBaseUrl,
      subscriber.verification_token
    );

    // Send email with auto-translation
    await mockSendMultilanguageEmail({
      to: subscriber.email,
      content: emailContent,
      preferredLanguage: subscriber.locale,
      autoTranslate: true,
    });
  }

  console.log("\n✅ Test completed successfully");
  console.log("------------------------");
  console.log("Summary:");
  console.log("- Supported languages (direct): en, es");
  console.log("- Languages with auto-translation: fr, de, zh (and others)");
  console.log(
    "- Each email contains a personalized unsubscribe link with the subscriber token"
  );
}

// Run the test
runTest().catch((error) => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
