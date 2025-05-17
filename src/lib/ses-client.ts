import {
  SESClient,
  SendEmailCommand,
  SendTemplatedEmailCommand,
} from "@aws-sdk/client-ses";
import sanitizeHtml from 'sanitize-html';

// AWS SES client configuration
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

// HTML sanitizing options
const sanitizeOptions = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
    'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
    'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'img', 'span'
  ],
  allowedAttributes: {
    a: ['href', 'name', 'target'],
    img: ['src', 'alt', 'height', 'width', 'style'],
    div: ['style', 'class'],
    span: ['style', 'class'],
    table: ['style', 'class'],
    th: ['style', 'class'],
    td: ['style', 'class']
  },
  allowedStyles: {
    '*': {
      'color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i, /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i],
      'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      'font-size': [/^\d+(?:px|em|rem|%)$/],
      'background-color': [/^#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i],
      'text-decoration': [/^none$/],
      'padding': [/^\d+(?:px|em|rem|%)$/],
      'margin': [/^\d+(?:px|em|rem|%)$/],
      'width': [/^\d+(?:px|em|rem|%)$/],
      'border': [/^[\d\w\s\.\,%\(\)]+$/]
    }
  }
};

// Source email that has been verified in AWS SES
const SOURCE_EMAIL = process.env.SES_SOURCE_EMAIL || "noreply@finopenspos.com";

/**
 * Send a simple email using AWS SES
 */
export async function sendEmail({
  to,
  subject,
  htmlBody,
  textBody,
}: {
  to: string | string[];
  subject: string;
  htmlBody: string;
  textBody: string;
}) {
  const toAddresses = Array.isArray(to) ? to : [to];
  // Sanitize HTML content to prevent XSS attacks
  const sanitizedHtml = sanitizeHtml(htmlBody, sanitizeOptions);
  
  const params = {
    Source: SOURCE_EMAIL,
    Destination: {
      ToAddresses: toAddresses,
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: "UTF-8",
      },
      Body: {
        Text: {
          Data: textBody,
          Charset: "UTF-8",
        },
        Html: {
          Data: sanitizedHtml,
          Charset: "UTF-8",
        },
      },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const response = await sesClient.send(command);
    return response;
  } catch (error) {
    console.error("Error sending email with SES:", error);
    throw error;
  }
}

/**
 * Send a templated email using AWS SES
 */
export async function sendTemplatedEmail({
  to,
  templateName,
  templateData,
}: {
  to: string | string[];
  templateName: string;
  templateData: Record<string, any>;
}) {
  const toAddresses = Array.isArray(to) ? to : [to];

  const params = {
    Source: SOURCE_EMAIL,
    Destination: {
      ToAddresses: toAddresses,
    },
    Template: templateName,
    TemplateData: JSON.stringify(templateData),
  };

  try {
    const command = new SendTemplatedEmailCommand(params);
    const response = await sesClient.send(command);
    return response;
  } catch (error) {
    console.error("Error sending templated email with SES:", error);
    throw error;
  }
}
