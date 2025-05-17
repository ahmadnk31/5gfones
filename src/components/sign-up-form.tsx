"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth.register");
  const locale=useLocale();
  
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    // Password validation
    if (password.length < 6) {
      setError(t("passwordTooShort") || "Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    if (password !== repeatPassword) {
      setError(t("passwordsNotMatch"));
      setIsLoading(false);
      return;
    }

    try {
      console.log("Attempting signup with email:", email);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/${locale}/`
        },
      });
      if(data?.user?.id){
        const { error: profileError } = await supabase
          .from("profiles")
          .insert([
            {
              id: data.user.id,
              role:"customer",
              preferred_language: locale,
            },
          ]);
        if (profileError) {
          console.error("Profile Insert Error:", profileError);
          throw profileError;
        }
        console.log("Profile Inserted Successfully");
      }
      console.log("Profile Insert Result:", { data, error });
      if (error) {
        console.error("Profile Insert Error:", error);
        throw error;
      }
      console.log("SignUp Result:", { data, error });
      
      if (error) {
        console.error("SignUp Error:", error);
        throw error;
      }
      
      // Check if we need email confirmation
      if (data?.user?.identities?.length === 0) {
        setError(t("emailAlreadyInUse"));
        return;
      }
      
      router.push(`/${locale}/auth/sign-up-success`);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl'>{t("title")}</CardTitle>
          <CardDescription>{t("subtitle")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className='flex flex-col gap-6'>
              <div className='grid gap-2'>
                <Label htmlFor='email'>{t("email")}</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder={t("emailPlaceholder")}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label htmlFor='password'>{t("password")}</Label>
                </div>
                <Input
                  id='password'
                  type='password'
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className='grid gap-2'>
                <div className='flex items-center'>
                  <Label htmlFor='repeat-password'>
                    {t("confirmPassword")}
                  </Label>
                </div>
                <Input
                  id='repeat-password'
                  type='password'
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                />
              </div>
              {error && <p className='text-sm text-red-500'>{error}</p>}
              <Button type='submit' className='w-full' disabled={isLoading}>
                {isLoading ? t("creatingAccount") : t("createAccount")}
              </Button>
            </div>
            <div className='mt-4 text-center text-sm'>
              {t("haveAccount")}{" "}
              <Link href='/auth/login' className='underline underline-offset-4'>
                {t("signIn")}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
