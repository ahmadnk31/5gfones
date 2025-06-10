export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Skip prerendering and force server-side rendering
export const generateStaticParams = () => {
  return [];
};
