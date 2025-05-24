import { createClient } from "@/lib/supabase/server";
import { sendMultilanguageEmail } from "@/lib/multi-language-email";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";

export async function POST(
  request: Request,
  { params }: { params: { locale: string } }
) {
  try {
    const { locale } = params;
    const supabase = createClient();
    const data = await request.json();

    // Verify that the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "User is not authenticated" },
        { status: 401 }
      );
    }

    // Basic validation of required fields
    if (!data.deviceName || !data.problemDescription || !data.customerEmail) {
      return NextResponse.json(
        { error: "Bad Request", message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get customer information if available
    let customerId = null;
    const { data: customerData } = await supabase
      .from("customers")
      .select("id")
      .eq("email", data.customerEmail)
      .maybeSingle();

    if (customerData) {
      customerId = customerData.id;
    }

    // Insert the repair request into the database
    const { data: requestData, error } = await supabase
      .from("repair_requests")
      .insert({
        device_name: data.deviceName,
        device_type: data.deviceType || null,
        device_brand: data.deviceBrand || null,
        device_color: data.deviceColor || null,
        device_model_year: data.deviceModelYear || null,
        device_serial_number: data.deviceSerialNumber || null,
        problem_description: data.problemDescription,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone || null,
        status: "pending",
        user_uid: user.id,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating repair request:", error);
      return NextResponse.json(
        { error: "Database Error", message: "Failed to create repair request" },
        { status: 500 }
      );
    }

    // Get translations for email content
    const t = await getTranslations({ locale, namespace: "repair" });

    // Send confirmation email to customer
    await sendMultilanguageEmail({
      to: data.customerEmail,
      preferredLanguage: locale,
      content: {        subject: {
          en: `Repair Request Confirmation - ${data.deviceName}`,
          es: `Confirmación de Solicitud de Reparación - ${data.deviceName}`,
          nl: `Reparatieverzoek Bevestiging - ${data.deviceName}`,
        },
        htmlBody: {
          en: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a56db;">Repair Request Received</h2>
              <p>Thank you for submitting a repair request for your <strong>${
                data.deviceName
              }</strong>.</p>
              <p>Your repair request has been received and is being reviewed by our technical team. We will contact you shortly to discuss your repair needs and provide a quote.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Repair Details:</h3>
                <p><strong>Device:</strong> ${data.deviceName}</p>
                ${
                  data.deviceBrand
                    ? `<p><strong>Brand:</strong> ${data.deviceBrand}</p>`
                    : ""
                }
                ${
                  data.deviceType
                    ? `<p><strong>Type:</strong> ${data.deviceType}</p>`
                    : ""
                }
                <p><strong>Issue:</strong> ${data.problemDescription}</p>
                <p><strong>Reference ID:</strong> ${requestData.id}</p>
              </div>
              <p>What happens next:</p>
              <ol>
                <li>Our technicians will review your request.</li>
                <li>We will contact you to discuss details and assess the repair.</li>
                <li>We'll provide a quote for the repair service.</li>
                <li>Once approved, we'll proceed with the repair process.</li>
              </ol>
              <p>If you have any questions, please contact our support team.</p>
              <p>Thank you for choosing our services.</p>
            </div>
          `,
          es: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a56db;">Solicitud de Reparación Recibida</h2>
              <p>Gracias por enviar una solicitud de reparación para su <strong>${
                data.deviceName
              }</strong>.</p>
              <p>Su solicitud de reparación ha sido recibida y está siendo revisada por nuestro equipo técnico. Nos pondremos en contacto con usted en breve para discutir sus necesidades de reparación y proporcionar un presupuesto.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Detalles de la Reparación:</h3>
                <p><strong>Dispositivo:</strong> ${data.deviceName}</p>
                ${
                  data.deviceBrand
                    ? `<p><strong>Marca:</strong> ${data.deviceBrand}</p>`
                    : ""
                }
                ${
                  data.deviceType
                    ? `<p><strong>Tipo:</strong> ${data.deviceType}</p>`
                    : ""
                }
                <p><strong>Problema:</strong> ${data.problemDescription}</p>
                <p><strong>ID de Referencia:</strong> ${requestData.id}</p>
              </div>
              <p>Próximos pasos:</p>
              <ol>
                <li>Nuestros técnicos revisarán su solicitud.</li>
                <li>Nos comunicaremos con usted para discutir los detalles y evaluar la reparación.</li>
                <li>Le proporcionaremos un presupuesto para el servicio de reparación.</li>
                <li>Una vez aprobado, procederemos con el proceso de reparación.</li>
              </ol>              <p>Si tiene alguna pregunta, comuníquese con nuestro equipo de soporte.</p>
              <p>Gracias por elegir nuestros servicios.</p>
            </div>
          `,
          nl: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a56db;">Reparatieverzoek Ontvangen</h2>
              <p>Bedankt voor het indienen van een reparatieverzoek voor uw <strong>${
                data.deviceName
              }</strong>.</p>
              <p>Uw reparatieverzoek is ontvangen en wordt beoordeeld door ons technisch team. Wij nemen binnenkort contact met u op om uw reparatiebehoeften te bespreken en een offerte te verstrekken.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Reparatiedetails:</h3>
                <p><strong>Apparaat:</strong> ${data.deviceName}</p>
                ${
                  data.deviceBrand
                    ? `<p><strong>Merk:</strong> ${data.deviceBrand}</p>`
                    : ""
                }
                ${
                  data.deviceType
                    ? `<p><strong>Type:</strong> ${data.deviceType}</p>`
                    : ""
                }
                <p><strong>Probleem:</strong> ${data.problemDescription}</p>
                <p><strong>Referentie-ID:</strong> ${requestData.id}</p>
              </div>
              <p>Wat gebeurt er nu:</p>
              <ol>
                <li>Onze technici beoordelen uw verzoek.</li>
                <li>Wij nemen contact met u op om details te bespreken en de reparatie te beoordelen.</li>
                <li>Wij verstrekken een offerte voor de reparatieservice.</li>
                <li>Na goedkeuring gaan wij door met het reparatieproces.</li>
              </ol>
              <p>Als u vragen heeft, neem dan contact op met ons ondersteuningsteam.</p>
              <p>Bedankt voor het kiezen van onze diensten.</p>
            </div>
          `,
        },
        textBody: {
          en: `
            Repair Request Received
            
            Thank you for submitting a repair request for your ${
              data.deviceName
            }.
            
            Your repair request has been received and is being reviewed by our technical team. We will contact you shortly to discuss your repair needs and provide a quote.
            
            Repair Details:
            - Device: ${data.deviceName}
            ${data.deviceBrand ? `- Brand: ${data.deviceBrand}` : ""}
            ${data.deviceType ? `- Type: ${data.deviceType}` : ""}
            - Issue: ${data.problemDescription}
            - Reference ID: ${requestData.id}
            
            What happens next:
            1. Our technicians will review your request.
            2. We will contact you to discuss details and assess the repair.
            3. We'll provide a quote for the repair service.
            4. Once approved, we'll proceed with the repair process.
            
            If you have any questions, please contact our support team.
            
            Thank you for choosing our services.
          `,
          es: `
            Solicitud de Reparación Recibida
            
            Gracias por enviar una solicitud de reparación para su ${
              data.deviceName
            }.
            
            Su solicitud de reparación ha sido recibida y está siendo revisada por nuestro equipo técnico. Nos pondremos en contacto con usted en breve para discutir sus necesidades de reparación y proporcionar un presupuesto.
            
            Detalles de la Reparación:
            - Dispositivo: ${data.deviceName}
            ${data.deviceBrand ? `- Marca: ${data.deviceBrand}` : ""}
            ${data.deviceType ? `- Tipo: ${data.deviceType}` : ""}
            - Problema: ${data.problemDescription}
            - ID de Referencia: ${requestData.id}
            
            Próximos pasos:
            1. Nuestros técnicos revisarán su solicitud.
            2. Nos comunicaremos con usted para discutir los detalles y evaluar la reparación.            3. Le proporcionaremos un presupuesto para el servicio de reparación.
            4. Una vez aprobado, procederemos con el proceso de reparación.
            
            Si tiene alguna pregunta, comuníquese con nuestro equipo de soporte.
            
            Gracias por elegir nuestros servicios.
          `,
          nl: `
            Reparatieverzoek Ontvangen
            
            Bedankt voor het indienen van een reparatieverzoek voor uw ${
              data.deviceName
            }.
            
            Uw reparatieverzoek is ontvangen en wordt beoordeeld door ons technisch team. Wij nemen binnenkort contact met u op om uw reparatiebehoeften te bespreken en een offerte te verstrekken.
            
            Reparatiedetails:
            - Apparaat: ${data.deviceName}
            ${data.deviceBrand ? `- Merk: ${data.deviceBrand}` : ""}
            ${data.deviceType ? `- Type: ${data.deviceType}` : ""}
            - Probleem: ${data.problemDescription}
            - Referentie-ID: ${requestData.id}
            
            Wat gebeurt er nu:
            1. Onze technici beoordelen uw verzoek.
            2. Wij nemen contact met u op om details te bespreken en de reparatie te beoordelen.
            3. Wij verstrekken een offerte voor de reparatieservice.
            4. Na goedkeuring gaan wij door met het reparatieproces.
            
            Als u vragen heeft, neem dan contact op met ons ondersteuningsteam.
            
            Bedankt voor het kiezen van onze diensten.
          `,
        },
      },
    });

    // Also send notification to admin/staff
    // Get admin emails from the environment variable or use a default
    const adminEmails = process.env.ADMIN_NOTIFICATION_EMAILS
      ? process.env.ADMIN_NOTIFICATION_EMAILS.split(",")
      : ["admin@finopenspos.com"];    await sendMultilanguageEmail({
      to: adminEmails,
      preferredLanguage: "en", // Default admin notification to English
      content: {
        subject: {
          en: `New Custom Repair Request (#${requestData.id}) - ${data.deviceName}`,
          es: `Nueva Solicitud de Reparación Personalizada (#${requestData.id}) - ${data.deviceName}`,
          nl: `Nieuw Aangepast Reparatieverzoek (#${requestData.id}) - ${data.deviceName}`,
        },
        htmlBody: {
          en: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a56db;">New Custom Repair Request</h2>
              <p>A new repair request has been submitted for a device not in the standard catalog.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Request Details:</h3>
                <p><strong>Request ID:</strong> ${requestData.id}</p>
                <p><strong>Device:</strong> ${data.deviceName}</p>
                ${
                  data.deviceBrand
                    ? `<p><strong>Brand:</strong> ${data.deviceBrand}</p>`
                    : ""
                }
                ${
                  data.deviceType
                    ? `<p><strong>Type:</strong> ${data.deviceType}</p>`
                    : ""
                }
                ${
                  data.deviceColor
                    ? `<p><strong>Color:</strong> ${data.deviceColor}</p>`
                    : ""
                }
                ${
                  data.deviceModelYear
                    ? `<p><strong>Model Year:</strong> ${data.deviceModelYear}</p>`
                    : ""
                }
                ${
                  data.deviceSerialNumber
                    ? `<p><strong>Serial Number:</strong> ${data.deviceSerialNumber}</p>`
                    : ""
                }
                <p><strong>Issue:</strong> ${data.problemDescription}</p>
              </div>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Customer Information:</h3>
                <p><strong>Email:</strong> ${data.customerEmail}</p>
                ${
                  data.customerPhone
                    ? `<p><strong>Phone:</strong> ${data.customerPhone}</p>`
                    : ""
                }
                <p><strong>User ID:</strong> ${user.id}</p>
                ${
                  customerId
                    ? `<p><strong>Customer ID:</strong> ${customerId}</p>`
                    : ""
                }
              </div>
              <p>Please review this request and contact the customer to provide a repair quote.</p>
              <p>To manage this request, log in to the admin dashboard.</p>
            </div>
          `,
          es: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a56db;">Nueva Solicitud de Reparación Personalizada</h2>
              <p>Se ha enviado una nueva solicitud de reparación para un dispositivo que no está en el catálogo estándar.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Detalles de la Solicitud:</h3>
                <p><strong>ID de Solicitud:</strong> ${requestData.id}</p>
                <p><strong>Dispositivo:</strong> ${data.deviceName}</p>
                ${
                  data.deviceBrand
                    ? `<p><strong>Marca:</strong> ${data.deviceBrand}</p>`
                    : ""
                }
                ${
                  data.deviceType
                    ? `<p><strong>Tipo:</strong> ${data.deviceType}</p>`
                    : ""
                }
                ${
                  data.deviceColor
                    ? `<p><strong>Color:</strong> ${data.deviceColor}</p>`
                    : ""
                }
                ${
                  data.deviceModelYear
                    ? `<p><strong>Año del Modelo:</strong> ${data.deviceModelYear}</p>`
                    : ""
                }
                ${
                  data.deviceSerialNumber
                    ? `<p><strong>Número de Serie:</strong> ${data.deviceSerialNumber}</p>`
                    : ""
                }
                <p><strong>Problema:</strong> ${data.problemDescription}</p>
              </div>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Información del Cliente:</h3>
                <p><strong>Correo Electrónico:</strong> ${
                  data.customerEmail
                }</p>
                ${
                  data.customerPhone
                    ? `<p><strong>Teléfono:</strong> ${data.customerPhone}</p>`
                    : ""
                }
                <p><strong>ID de Usuario:</strong> ${user.id}</p>
                ${
                  customerId
                    ? `<p><strong>ID de Cliente:</strong> ${customerId}</p>`
                    : ""
                }
              </div>              <p>Por favor, revise esta solicitud y contacte al cliente para proporcionar un presupuesto de reparación.</p>
              <p>Para gestionar esta solicitud, inicie sesión en el panel de administración.</p>
            </div>
          `,
          nl: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1a56db;">Nieuw Aangepast Reparatieverzoek</h2>
              <p>Er is een nieuw reparatieverzoek ingediend voor een apparaat dat niet in de standaardcatalogus staat.</p>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Verzoekdetails:</h3>
                <p><strong>Verzoek-ID:</strong> ${requestData.id}</p>
                <p><strong>Apparaat:</strong> ${data.deviceName}</p>
                ${
                  data.deviceBrand
                    ? `<p><strong>Merk:</strong> ${data.deviceBrand}</p>`
                    : ""
                }
                ${
                  data.deviceType
                    ? `<p><strong>Type:</strong> ${data.deviceType}</p>`
                    : ""
                }
                ${
                  data.deviceColor
                    ? `<p><strong>Kleur:</strong> ${data.deviceColor}</p>`
                    : ""
                }
                ${
                  data.deviceModelYear
                    ? `<p><strong>Modeljaar:</strong> ${data.deviceModelYear}</p>`
                    : ""
                }
                ${
                  data.deviceSerialNumber
                    ? `<p><strong>Serienummer:</strong> ${data.deviceSerialNumber}</p>`
                    : ""
                }
                <p><strong>Probleem:</strong> ${data.problemDescription}</p>
              </div>
              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Klantinformatie:</h3>
                <p><strong>E-mail:</strong> ${data.customerEmail}</p>
                ${
                  data.customerPhone
                    ? `<p><strong>Telefoon:</strong> ${data.customerPhone}</p>`
                    : ""
                }
                <p><strong>Gebruikers-ID:</strong> ${user.id}</p>
                ${
                  customerId
                    ? `<p><strong>Klant-ID:</strong> ${customerId}</p>`
                    : ""
                }
              </div>
              <p>Beoordeel dit verzoek en neem contact op met de klant om een reparatieofferte te verstrekken.</p>
              <p>Om dit verzoek te beheren, log in op het beheerdashboard.</p>
            </div>
          `,
        },
        textBody: {
          en: `
            New Custom Repair Request
            
            A new repair request has been submitted for a device not in the standard catalog.
            
            Request Details:
            - Request ID: ${requestData.id}
            - Device: ${data.deviceName}
            ${data.deviceBrand ? `- Brand: ${data.deviceBrand}` : ""}
            ${data.deviceType ? `- Type: ${data.deviceType}` : ""}
            ${data.deviceColor ? `- Color: ${data.deviceColor}` : ""}
            ${
              data.deviceModelYear
                ? `- Model Year: ${data.deviceModelYear}`
                : ""
            }
            ${
              data.deviceSerialNumber
                ? `- Serial Number: ${data.deviceSerialNumber}`
                : ""
            }
            - Issue: ${data.problemDescription}
            
            Customer Information:
            - Email: ${data.customerEmail}
            ${data.customerPhone ? `- Phone: ${data.customerPhone}` : ""}
            - User ID: ${user.id}
            ${customerId ? `- Customer ID: ${customerId}` : ""}
            
            Please review this request and contact the customer to provide a repair quote.
            To manage this request, log in to the admin dashboard.
          `,
          es: `
            Nueva Solicitud de Reparación Personalizada
            
            Se ha enviado una nueva solicitud de reparación para un dispositivo que no está en el catálogo estándar.
            
            Detalles de la Solicitud:
            - ID de Solicitud: ${requestData.id}
            - Dispositivo: ${data.deviceName}
            ${data.deviceBrand ? `- Marca: ${data.deviceBrand}` : ""}
            ${data.deviceType ? `- Tipo: ${data.deviceType}` : ""}
            ${data.deviceColor ? `- Color: ${data.deviceColor}` : ""}
            ${
              data.deviceModelYear
                ? `- Año del Modelo: ${data.deviceModelYear}`
                : ""
            }
            ${
              data.deviceSerialNumber
                ? `- Número de Serie: ${data.deviceSerialNumber}`
                : ""
            }
            - Problema: ${data.problemDescription}
            
            Información del Cliente:
            - Correo Electrónico: ${data.customerEmail}
            ${data.customerPhone ? `- Teléfono: ${data.customerPhone}` : ""}
            - ID de Usuario: ${user.id}
            ${customerId ? `- ID de Cliente: ${customerId}` : ""}
              Por favor, revise esta solicitud y contacte al cliente para proporcionar un presupuesto de reparación.
            Para gestionar esta solicitud, inicie sesión en el panel de administración.
          `,
          nl: `
            Nieuw Aangepast Reparatieverzoek
            
            Er is een nieuw reparatieverzoek ingediend voor een apparaat dat niet in de standaardcatalogus staat.
            
            Verzoekdetails:
            - Verzoek-ID: ${requestData.id}
            - Apparaat: ${data.deviceName}
            ${data.deviceBrand ? `- Merk: ${data.deviceBrand}` : ""}
            ${data.deviceType ? `- Type: ${data.deviceType}` : ""}
            ${data.deviceColor ? `- Kleur: ${data.deviceColor}` : ""}
            ${
              data.deviceModelYear
                ? `- Modeljaar: ${data.deviceModelYear}`
                : ""
            }
            ${
              data.deviceSerialNumber
                ? `- Serienummer: ${data.deviceSerialNumber}`
                : ""
            }
            - Probleem: ${data.problemDescription}
            
            Klantinformatie:
            - E-mail: ${data.customerEmail}
            ${data.customerPhone ? `- Telefoon: ${data.customerPhone}` : ""}
            - Gebruikers-ID: ${user.id}
            ${customerId ? `- Klant-ID: ${customerId}` : ""}
            
            Beoordeel dit verzoek en neem contact op met de klant om een reparatieofferte te verstrekken.
            Om dit verzoek te beheren, log in op het beheerdashboard.
          `,
        },
      },
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Repair request submitted successfully",
      requestId: requestData.id,
    });
  } catch (error) {
    console.error("Error processing repair request:", error);
    return NextResponse.json(
      { error: "Server Error", message: "Failed to process repair request" },
      { status: 500 }
    );
  }
}
