import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function AdminAppointmentsPage() {
  // Get the accept-language header to determine locale
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Simple locale detection - default to 'en' if not specified
  const locale = acceptLanguage.startsWith('es') ? 'es' : 
                acceptLanguage.startsWith('pt') ? 'pt' : 'en';
  
  // Redirect to the localized version
  redirect(`/${locale}/admin/appointments`);
}
