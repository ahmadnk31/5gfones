// filepath: src\lib\repair-email-templates.ts
import { format } from "date-fns";

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

/**
 * Generate a repair appointment confirmation email
 * @param appointmentId - The ID of the repair appointment
 * @param customerName - The name of the customer
 * @param appointmentDate - The date and time of the appointment
 * @param deviceInfo - Information about the device being repaired
 * @param repairs - List of repair services
 * @param statusCheckLink - Link to check repair status
 * @param locale - The locale/language for the email
 * @returns Email content object with subject, HTML and text versions
 */
export function getRepairAppointmentEmailContent(
  appointmentId: number,
  customerName: string,
  appointmentDate: Date,
  deviceInfo: string,
  repairs: string[],
  statusCheckLink: string,
  locale: string = "en"
): EmailContent {
  // Format the appointment date
  const formattedDate = format(appointmentDate, "PPP");
  const formattedTime = format(appointmentDate, "p");

  // Create repair list HTML and text
  const repairsListHtml = repairs.map(r => `<li>${r}</li>`).join('');
  const repairsListText = repairs.map(r => `- ${r}`).join('\n');
  
  // Email content based on locale
  const content = locale === "es" ? {
    subject: `Confirmación de reparación #${appointmentId}`,
    heading: "Confirmación de Reparación",
    greeting: `Hola ${customerName},`,
    intro: "Gracias por programar una reparación con nosotros. Hemos recibido su solicitud y estamos listos para ayudarle con su dispositivo.",
    appointmentId: "ID de la cita",
    appointmentDate: "Fecha",
    appointmentTime: "Hora",
    deviceInfo: "Dispositivo",
    services: "Servicios de reparación",
    instructions: "Por favor traiga su dispositivo a nuestra tienda en la fecha y hora programadas. Nuestro equipo lo estará esperando.",
    checkStatus: "Verificar Estado de Reparación",
    closing: "Si necesita hacer algún cambio en su cita, contáctenos lo antes posible.",
    regards: "Saludos cordiales",
  } : {
    subject: `Repair Appointment Confirmation #${appointmentId}`,
    heading: "Repair Appointment Confirmation",
    greeting: `Hello ${customerName},`,
    intro: "Thank you for scheduling a repair with us. We have received your request and are ready to help with your device.",
    appointmentId: "Appointment ID",
    appointmentDate: "Date",
    appointmentTime: "Time",
    deviceInfo: "Device",
    services: "Repair Services",
    instructions: "Please bring your device to our store at the scheduled date and time. Our team will be waiting for you.",
    checkStatus: "Check Repair Status",
    closing: "If you need to make any changes to your appointment, please contact us as soon as possible.",
    regards: "Best regards",
  };

  // HTML version
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${content.heading}</h2>
      <p>${content.greeting}</p>
      <p>${content.intro}</p>
      
      <div style="background-color: #f5f5f5; border-radius: 5px; padding: 15px; margin: 20px 0;">
        <p><strong>${content.appointmentId}:</strong> #${appointmentId}</p>
        <p><strong>${content.appointmentDate}:</strong> ${formattedDate}</p>
        <p><strong>${content.appointmentTime}:</strong> ${formattedTime}</p>
        <p><strong>${content.deviceInfo}:</strong> ${deviceInfo}</p>
        
        <p><strong>${content.services}:</strong></p>
        <ul>
          ${repairsListHtml}
        </ul>
      </div>
      
      <p>${content.instructions}</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${statusCheckLink}" style="background-color: #4CAF50; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px;">
          ${content.checkStatus}
        </a>
      </div>
      
      <p>${content.closing}</p>
      <p>${content.regards},<br>5G Phones</p>
    </div>
  `;

  // Plain text version
  const text = `
${content.heading}

${content.greeting}

${content.intro}

${content.appointmentId}: #${appointmentId}
${content.appointmentDate}: ${formattedDate}
${content.appointmentTime}: ${formattedTime}
${content.deviceInfo}: ${deviceInfo}

${content.services}:
${repairsListText}

${content.instructions}

${content.checkStatus}: ${statusCheckLink}

${content.closing}

${content.regards},
5G Phones
  `;

  return {
    subject: content.subject,
    html,
    text
  };
}
