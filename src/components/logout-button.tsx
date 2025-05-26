'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

export function LogoutButton() {
  const router = useRouter()
  const t = useTranslations('auth')
  const locale=useLocale()
  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/${locale}/auth/login`)
  }
  return <Button 
    onClick={logout} 
    variant="ghost" 
    className="w-full justify-start pl-4 font-normal text-sm text-gray-700 hover:text-gray-900"
  >
    {t('logout')}
  </Button>
}
