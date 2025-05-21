// filepath: src\lib\repair-email-notifications.ts
import { getRepairAppointmentEmailContent } from "./repair-email-templates";
import { sendEmail } from "./email-service";
import { createClient } from "./supabase/client";

/**
 * Send a confirmation email for a new repair appointment
 * @param appointmentId - The ID of the repair appointment
 * @param locale - The preferred language of the recipient
 * @returns The response from the email service
 */
export async function sendRepairAppointmentEmail(appointmentId: number, locale: string = "en") {
  try {
    const supabase = createClient();
    
    // Fetch the appointment details with related data
    const { data: appointment, error } = await supabase
      .from("appointments")
      .select(`
        *,
        device:device_model_id(
          id,
          name,
          device_series_id,
          device_series:device_series_id(
            name,
            device_type_id,
            device_type:device_type_id(
              name,
              brand_id,
              device_brand:brand_id(
                name
              )
            )
          )
        ),
        appointment_items(
          id,
          product_id,
          product:product_id(
            name,
            description
          ),
          product_variant_id,
          product_variant:product_variant_id(
            variant_name,
            variant_value
          )
        )
      `)
      .eq("id", appointmentId)
      .single();
    
    if (error || !appointment) {
      console.error("Error fetching appointment details:", error);
      return null;
    }
    
    // Format the device information
    const brand = appointment.device?.device_series?.device_type?.device_brand?.name || "";
    const model = appointment.device?.name || "";
    const deviceInfo = `${brand} ${model}`;
    
    // Extract repair services
    const repairServices = appointment.appointment_items.map((item: any) => {
      const serviceName = item.product?.name || "";
      const variantInfo = item.product_variant ? ` (${item.product_variant.variant_value})` : "";
      return `${serviceName}${variantInfo}`;
    });
    
    // Create the status check link
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const statusCheckLink = `${baseUrl}/${locale}/repair/status?id=${appointmentId}`;
    
    // Generate email content
    const emailContent = getRepairAppointmentEmailContent(
      appointmentId,
      appointment.customer_name,
      new Date(appointment.appointment_date),
      deviceInfo,
      repairServices,
      statusCheckLink,
      locale
    );
    
    // Send the email
    return await sendEmail({
      to: appointment.customer_email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });
    
  } catch (error) {
    console.error("Failed to send repair appointment email:", error);
    return null;
  }
}
