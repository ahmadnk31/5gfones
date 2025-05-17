import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/ses-client";
import {
  sendMultilanguageEmail,
  getNewsletterEmailContent,
  SupportedLanguage,
} from "@/lib/multi-language-email";

// Authenticate admin users
async function isAdmin(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // Get user profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" || profile?.role === "super_admin";
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();

    // Check if user is admin
    const adminUser = await isAdmin(supabase);
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subject, htmlContent, textContent } = await request.json();

    if (!subject || !htmlContent || !textContent) {
      return NextResponse.json(
        {
          error: "Subject, HTML content and text content are required",
        },
        { status: 400 }
      );
    }

    // Get all verified subscribers
    const { data: subscribers, error } = await supabase
      .from("newsletter_subscribers")
      .select("email, locale")
      .eq("verified", true);

    if (error) {
      throw error;
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json(
        {
          message: "No subscribers found",
        },
        { status: 404 }
      );
    } // Group subscribers by locale to send emails in batches
    const subscribersByLocale = subscribers.reduce(
      (acc: Record<string, string[]>, sub: any) => {
        const locale = sub.locale || "en";
        if (!acc[locale]) acc[locale] = [];
        acc[locale].push(sub.email);
        return acc;
      },
      {}
    );

    // Base URL for unsubscribe links
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const unsubscribeBaseUrl = `${baseUrl}/api/newsletter/unsubscribe`;

    // We need to handle unsubscribe tokens per user now
    // Instead of sending in batches by locale only, we'll generate individual emails with proper tokens

    // First, let's get all subscribers with their tokens
    const { data: subscribersWithTokens, error: tokenError } = await supabase
      .from("newsletter_subscribers")
      .select("id, email, locale, verification_token")
      .in(
        "email",
        subscribers.map((s: any) => s.email)
      )
      .eq("verified", true)
      .eq("unsubscribed", false);

    if (tokenError) {
      console.error("Error getting subscriber tokens:", tokenError);
      return NextResponse.json(
        { error: "Failed to send newsletter" },
        { status: 500 }
      );
    }

    // Group subscribers by locale with their tokens
    const subscribersByLocaleWithTokens = subscribersWithTokens.reduce(
      (
        acc: Record<string, Array<{ email: string; token: string | null }>>,
        sub: any
      ) => {
        const locale = sub.locale || "en";
        if (!acc[locale]) acc[locale] = [];
        acc[locale].push({
          email: sub.email,
          token: sub.verification_token,
        });
        return acc;
      },
      {}
    ); // For subscribers without tokens, generate new ones
    try {
      const allTokensToUpdate = [];

      for (const locale in subscribersByLocaleWithTokens) {
        for (let i = 0; i < subscribersByLocaleWithTokens[locale].length; i++) {
          const subscriber = subscribersByLocaleWithTokens[locale][i];
          if (!subscriber.token) {
            // Generate a new token
            const token = uuidv4();
            subscriber.token = token;

            // Queue for update
            const subData = subscribersWithTokens.find(
              (s: any) => s.email === subscriber.email
            );
            if (subData) {
              allTokensToUpdate.push({
                id: subData.id,
                verification_token: token,
              });
            }
          }
        }
      }

      // Update tokens in the database (all at once to reduce DB calls)
      if (allTokensToUpdate.length > 0) {
        const { error: updateError } = await supabase
          .from("newsletter_subscribers")
          .upsert(allTokensToUpdate);

        if (updateError) {
          console.error("Error updating tokens:", updateError);
        }
      }
    } catch (tokenError) {
      console.error("Error generating tokens:", tokenError);
      // Continue with sending emails even if token generation fails
    } // Send emails by locale
    const results = [];
    const failedEmails = [];

    // Process each locale group sequentially to avoid overwhelming the email service
    for (const [locale, subscribers] of Object.entries(
      subscribersByLocaleWithTokens
    )) {
      // Split into batches of 10 emails to process
      const batches = [];
      for (let i = 0; i < subscribers.length; i += 10) {
        batches.push(subscribers.slice(i, i + 10));
      }

      // Process each batch
      for (const batch of batches) {
        try {
          // Process emails in the batch concurrently
          const batchResults = await Promise.all(
            batch.map(async (subscriber) => {
              try {
                // Generate email content with personal unsubscribe link
                const newsletterEmailContent = await getNewsletterEmailContent(
                  subject,
                  htmlContent,
                  textContent,
                  unsubscribeBaseUrl,
                  subscriber.token || undefined
                );

                // Send personalized email with auto-translation for unsupported languages
                await sendMultilanguageEmail({
                  to: subscriber.email,
                  content: newsletterEmailContent,
                  preferredLanguage: locale,
                  autoTranslate: true, // Enable auto-translation for languages not directly supported
                });

                return { email: subscriber.email, success: true };
              } catch (error) {
                console.error(
                  `Failed to send email to ${subscriber.email}:`,
                  error
                );
                failedEmails.push({
                  email: subscriber.email,
                  error: String(error),
                });
                return {
                  email: subscriber.email,
                  success: false,
                  error: String(error),
                };
              }
            })
          );

          results.push(...batchResults);
        } catch (batchError) {
          console.error(`Failed to process batch:`, batchError);
        }

        // Add a small delay between batches to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }
    const successCount = results.filter((r) => r.success).length;

    interface FailedEmail {
        email: string;
        error: string;
    }

    interface NewsletterResponse {
        message: string;
        total: number;
        sent: number;
        failed: number;
        failedEmails?: FailedEmail[];
    }

    return NextResponse.json<NewsletterResponse>({
        message:
            failedEmails.length > 0
                ? `Newsletter sent with ${failedEmails.length} failures`
                : "Newsletter sent successfully",
        total: subscribers.length,
        sent: successCount,
        failed: failedEmails.length,
        failedEmails: failedEmails.length > 0 ? failedEmails : undefined,
    });
  } catch (error: any) {
    console.error("Error sending newsletter:", error);
    return NextResponse.json(
      {
        error: "Failed to send newsletter",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
