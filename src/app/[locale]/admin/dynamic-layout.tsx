// This configuration excludes admin pages from static generation process
// Force all admin routes to use server-side rendering instead of static generation

// Set dynamic rendering mode to prevent static generation during build
export const dynamic = 'force-dynamic';

// Set revalidation to 0 to prevent caching
export const revalidate = 0;

export default function AdminLayout({ children }:{
    children: React.ReactNode;
}) {
  return <>{children}</>;
}
