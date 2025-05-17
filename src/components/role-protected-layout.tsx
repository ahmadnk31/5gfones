import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function hasRequiredRole(requiredRoles: string[]) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return false;
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || !requiredRoles.includes(profile.role)) {
    return false;
  }

  return true;
}

interface RoleProtectedLayoutProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export default async function RoleProtectedLayout({
  children,
  requiredRoles = ['admin', 'technician'],
}: RoleProtectedLayoutProps) {
  const hasRole = await hasRequiredRole(requiredRoles);

  if (!hasRole) {
    redirect('/unauthorized');
  }

  return <>{children}</>;
}
