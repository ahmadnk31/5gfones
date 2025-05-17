import { sendEmail } from "./ses-client";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";

/**
 * Supported languages for email communications
 */
export type SupportedLanguage = "en" | "es";

/**
 * Interface for multilingual email content
 */
export interface MultilanguageEmailContent {
  subject: {
    [key in SupportedLanguage]: string;
  };
  htmlBody: {
    [key in SupportedLanguage]: string;
  };
  textBody: {
    [key in SupportedLanguage]: string;
  };
}

/**
 * Send an email in the recipient's preferred language
 * @param to - Email address(es) of the recipient(s)
 * @param content - Multilingual content for the email
 * @param preferredLanguage - The preferred language of the recipient
 * @param autoTranslate - Whether to attempt automatic translation for unsupported languages
 * @returns The response from AWS SES
 */
export async function sendMultilanguageEmail({
  to,
  content,
  preferredLanguage = "en",
  autoTranslate = false,
}: {
  to: string | string[];
  content: MultilanguageEmailContent;
  preferredLanguage?: string;
  autoTranslate?: boolean;
}) {
  // Check if the preferred language is directly supported
  const isSupportedLanguage = (lang: string): lang is SupportedLanguage => {
    return content.subject[lang as SupportedLanguage] !== undefined;
  };

  const language = isSupportedLanguage(preferredLanguage)
    ? preferredLanguage
    : "en";

  let subject = content.subject[language as SupportedLanguage];
  let htmlBody = content.htmlBody[language as SupportedLanguage];
  let textBody = content.textBody[language as SupportedLanguage];

  // If auto-translation is enabled and the language is not directly supported
  if (
    autoTranslate &&
    !isSupportedLanguage(preferredLanguage) &&
    preferredLanguage !== "en"
  ) {
    try {
      // Translate email content
      const [translatedSubject, translatedHtmlBody, translatedTextBody] =
        await Promise.all([
          translateText(content.subject.en, preferredLanguage),
          translateText(content.htmlBody.en, preferredLanguage),
          translateText(content.textBody.en, preferredLanguage),
        ]);

      subject = translatedSubject;
      htmlBody = translatedHtmlBody;
      textBody = translatedTextBody;
    } catch (error) {
      console.error(
        `Failed to translate email to ${preferredLanguage}:`,
        error
      );
      // Fallback to supported language if translation fails
    }
  }

  // Send the email in the preferred language
  return sendEmail({
    to,
    subject,
    htmlBody,
    textBody,
  });
}

/**
 * Get translations for email templates
 * @param locale - The locale to get translations for
 * @param namespace - The translation namespace
 * @returns A translation function
 */
export async function getEmailTranslations(locale: string, namespace: string) {
  return await getTranslations({ locale, namespace });
}

/**
 * Template function to generate a verification email in multiple languages
 * @param verificationLink - The link for verifying the email
 * @returns MultilanguageEmailContent object with translations in all supported languages
 */
export async function getVerificationEmailContent(
  verificationLink: string
): Promise<MultilanguageEmailContent> {
  // Get translations for each supported language
  const enT = await getEmailTranslations("en", "emails");
  const esT = await getEmailTranslations("es", "emails");

  return {
    subject: {
      en: enT("verificationSubject"),
      es: esT("verificationSubject"),
    },
    htmlBody: {
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${enT("verificationHeading")}</h2>
          <p>${enT("verificationIntro")}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px;">
              ${enT("verifyButton")}
            </a>
          </div>
          <p>${enT("verificationExpires")}</p>
          <p>${enT("regards")},<br>FinOpenPOS</p>
        </div>
      `,
      es: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${esT("verificationHeading")}</h2>
          <p>${esT("verificationIntro")}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px;">
              ${esT("verifyButton")}
            </a>
          </div>
          <p>${esT("verificationExpires")}</p>
          <p>${esT("regards")},<br>FinOpenPOS</p>
        </div>
      `,
    },
    textBody: {
      en: `
${enT("verificationHeading")}

${enT("verificationIntro")}

${enT("verifyButtonText")}: ${verificationLink}

${enT("verificationExpires")}

${enT("regards")},
FinOpenPOS
      `,
      es: `
${esT("verificationHeading")}

${esT("verificationIntro")}

${esT("verifyButtonText")}: ${verificationLink}

${esT("verificationExpires")}

${esT("regards")},
FinOpenPOS
      `,
    },
  };
}

/**
 * Template function to generate a newsletter email in multiple languages
 * @param subject - The subject line of the newsletter
 * @param htmlContent - The HTML content of the newsletter
 * @param textContent - The plain text content of the newsletter
 * @param unsubscribeBaseUrl - The base URL for unsubscribing
 * @param token - Optional verification token for the subscriber
 * @returns MultilanguageEmailContent object with newsletter content
 */
/**
 * Translate text to a specific language using OpenAI API
 * @param text The text to translate
 * @param targetLanguage The target language code
 * @param sourceLanguage The source language code (default: 'en')
 * @returns Translated text or original text if translation fails
 */
export async function translateText(
  text: string,
  targetLanguage: string,
  sourceLanguage: string = "en"
): Promise<string> {
  try {
    // If the target language is already supported, return the text as is
    if (["en", "es"].includes(targetLanguage)) {
      return text;
    }

    // Base URL for API call
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Call the translation API
    const response = await fetch(`${baseUrl}/api/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        targetLanguage,
        sourceLanguage,
      }),
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error("Translation error:", error);
    return text; // Return original text if translation fails
  }
}

export async function getNewsletterEmailContent(
  subject: string,
  htmlContent: string,
  textContent: string,
  unsubscribeBaseUrl: string,
  token?: string
): Promise<MultilanguageEmailContent> {
  // Get translations for each supported language
  const enT = await getEmailTranslations("en", "emails");
  const esT = await getEmailTranslations("es", "emails");

  // Append token to unsubscribe URL if provided
  const unsubscribeLink = token
    ? `${unsubscribeBaseUrl}?token=${token}`
    : unsubscribeBaseUrl;

  return {
    subject: {
      en: subject,
      es: subject, // We're using the same subject as it's custom per newsletter
    },
    htmlBody: {
      en: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${htmlContent}
          <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666;">
            <p>${enT("unsubscribeText")} <a href="${unsubscribeLink}">${enT(
        "unsubscribeLink"
      )}</a></p>
          </div>
        </div>
      `,
      es: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          ${htmlContent}
          <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #666;">
            <p>${esT("unsubscribeText")} <a href="${unsubscribeLink}">${esT(
        "unsubscribeLink"
      )}</a></p>
          </div>
        </div>
      `,
    },
    textBody: {
      en: `
${textContent}

---
${enT("unsubscribeText")} ${unsubscribeLink}
      `,
      es: `
${textContent}

---
${esT("unsubscribeText")} ${unsubscribeLink}
      `,
    },
  };
}
