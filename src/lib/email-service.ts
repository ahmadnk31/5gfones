// filepath: src\lib\email-service.ts
// This is a basic email service that can be replaced with an actual email provider like SendGrid, AWS SES, etc.

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  from?: string;
}

/**
 * Send an email
 * This is a placeholder function that would typically connect to a real email service.
 * In a production environment, you'd want to replace this with a service like SendGrid, AWS SES, etc.
 */
export async function sendEmail(options: EmailOptions) {
  // In a real implementation, this would send the email using a proper service
  // For now, we'll just log that we would have sent an email
  console.log('Would send email with options:', {
    to: options.to,
    subject: options.subject,
    from: options.from || 'noreply@5gphones.com'
  });
  
  // Log that we're in development mode and not actually sending emails
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode: Email not actually sent');
    console.log('Email HTML content:', options.html.substring(0, 500) + '...');
    console.log('Email Text content:', options.text.substring(0, 500) + '...');
  }
  
  // Return a success response (this would typically be the response from your email provider)
  return {
    success: true,
    id: `email_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    message: 'Email queued for delivery (mock)'
  };
}

/**
 * Production implementation with a proper email service would go here
 * Below is pseudocode for different email providers:
 * 
 * // SendGrid example:
 * import sendgrid from '@sendgrid/mail';
 * sendgrid.setApiKey(process.env.SENDGRID_API_KEY);
 * 
 * export async function sendEmail(options: EmailOptions) {
 *   const msg = {
 *     to: options.to,
 *     from: options.from || 'noreply@5gphones.com',
 *     subject: options.subject,
 *     text: options.text,
 *     html: options.html,
 *   };
 *   return await sendgrid.send(msg);
 * }
 * 
 * // AWS SES example:
 * import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
 * const sesClient = new SESClient({ region: process.env.AWS_REGION });
 * 
 * export async function sendEmail(options: EmailOptions) {
 *   const params = {
 *     Source: options.from || 'noreply@5gphones.com',
 *     Destination: {
 *       ToAddresses: Array.isArray(options.to) ? options.to : [options.to],
 *     },
 *     Message: {
 *       Subject: { Data: options.subject },
 *       Body: {
 *         Text: { Data: options.text },
 *         Html: { Data: options.html },
 *       },
 *     },
 *   };
 *   const command = new SendEmailCommand(params);
 *   return await sesClient.send(command);
 * }
 */
