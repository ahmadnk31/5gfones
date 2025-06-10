import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export default function AdminAccessoriesPage() {
  // Get the accept-language header to determine locale
  const headersList = headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Simple locale detection - default to 'en' if not specified
  const locale = acceptLanguage.startsWith('es') ? 'es' : 
                acceptLanguage.startsWith('pt') ? 'pt' : 'en';
  
  // Redirect to the localized version
  redirect(`/${locale}/admin/accessories`);
}