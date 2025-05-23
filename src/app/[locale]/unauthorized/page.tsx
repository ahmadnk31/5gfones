"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  const t = useTranslations();

  return (
    <div className='flex flex-col items-center justify-center min-h-[70vh] px-4 text-center'>
      <div className='rounded-full bg-yellow-100 p-4 mb-6'>
        <AlertTriangle className='h-12 w-12 text-yellow-600' />
      </div>
      <h1 className='text-3xl font-bold mb-2'>Access Denied</h1>      <p className='text-muted-foreground mb-6 max-w-md'>
        You don&apos;t have permission to access this page. If you believe this is an
        error, please contact support.
      </p>
      <div className='flex flex-col sm:flex-row gap-4'>
        <Button asChild variant='default'>
          <Link href='/'>Return to Home</Link>
        </Button>
        <Button asChild variant='outline'>
          <Link href='/account'>Go to My Account</Link>
        </Button>
      </div>
    </div>
  );
}
