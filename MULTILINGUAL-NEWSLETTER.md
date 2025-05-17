# Multilingual Newsletter System for FinOpenPOS

This document explains how the multilingual newsletter system works in FinOpenPOS and how to maintain and extend it.

## Overview

The FinOpenPOS newsletter system supports multilingual emails for:

- Subscription verification
- Newsletter sending
- Unsubscription

The system identifies a user's preferred language based on:

1. The locale they used when subscribing
2. The locale in their account settings (if logged in)
3. The locale in their browser settings

## Architecture

The multilingual system consists of these main components:

### 1. Multi-Language Email Library

- Located at: `src/lib/multi-language-email.ts`
- Handles email sending in multiple languages
- Supports auto-translation for languages not directly supported
- Core functions:
  - `sendMultilanguageEmail`: Sends emails in the recipient's preferred language
  - `getVerificationEmailContent`: Generates verification email content
  - `getNewsletterEmailContent`: Generates newsletter email content
  - `translateText`: Translates text to a specific language

### 2. Translation API

- Located at: `src/app/[locale]/api/translate/route.ts`
- Provides automatic translation via OpenAI API
- Used as a fallback for languages not directly supported

### 3. Newsletter API Routes

- Subscribe: `src/app/[locale]/api/newsletter/subscribe/route.ts`
- Verify: `src/app/[locale]/api/newsletter/verify/route.ts`
- Unsubscribe: `src/app/[locale]/api/newsletter/unsubscribe/route.ts`
- Send: `src/app/[locale]/api/newsletter/send/route.ts`

### 4. Confirmation Page

- Located at: `src/app/[locale]/newsletter-confirmation/page.tsx`
- Handles both verification and unsubscribe confirmations
- Fully localized with next-intl

### 5. Translation Files

- Located in `messages/` directory
- Contains translations for all UI elements and email content
- Email-specific translations are under the "emails" namespace
- Newsletter UI translations are under the "newsletter" namespace

## Supported Languages

Currently, the following languages are directly supported:

- English (en)
- Spanish (es)

For other languages, the system uses auto-translation via the OpenAI API.

## Adding New Languages

To add a new directly supported language:

1. Create a new translation file in the `messages/` directory (e.g., `fr.json`)
2. Add email translations under the "emails" namespace
3. Add UI translations under the "newsletter" namespace
4. Update the `SupportedLanguage` type in `multi-language-email.ts` to include the new language
5. Add templates for the new language in the email content functions

## Maintenance Tips

- **Testing**: Use the `scripts/test-newsletter-emails.js` script to test the multilingual email functionality
- **Adding Content**: When adding new email content, make sure to add translations for all supported languages
- **Debugging**: Check logs for translation failures when auto-translation is enabled
- **Performance**: For frequently used languages, consider adding direct support instead of relying on auto-translation

## Environment Variables

The following environment variables are used:

- `NEXT_PUBLIC_BASE_URL`: Base URL for the application (used for generating links)
- `OPENAI_API_KEY`: OpenAI API key for auto-translation feature

Make sure these are correctly set in your `.env` file.

## Database Schema

The newsletter subscribers are stored in the `newsletter_subscribers` table with these fields:

- `id`: Unique identifier
- `email`: Email address
- `locale`: Preferred language code
- `verification_token`: Token for verifying subscription or unsubscribing
- `token_expires_at`: Expiration time for the token
- `verified`: Whether the subscription has been verified
- `verified_at`: When the subscription was verified
- `unsubscribed`: Whether the user has unsubscribed
- `unsubscribed_at`: When the user unsubscribed
