"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslations("auth.resetPassword");

  // Calculate password strength (0-100)
  const getPasswordStrength = (pwd: string): number => {
    if (!pwd) return 0;

    let strength = 0;

    // Length
    if (pwd.length >= 6) strength += 20;
    if (pwd.length >= 10) strength += 10;

    // Complexity
    if (/[a-z]/.test(pwd)) strength += 10; // lowercase
    if (/[A-Z]/.test(pwd)) strength += 20; // uppercase
    if (/[0-9]/.test(pwd)) strength += 20; // numbers
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 20; // special chars

    return Math.min(100, strength);
  };

  const passwordStrength = getPasswordStrength(password);

  const getStrengthColor = (strength: number): string => {
    if (strength < 30) return "bg-red-500";
    if (strength < 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate password
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setError(t("passwordsNotMatch") || "Passwords don't match");
      return;
    }

    const supabase = createClient();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      // Show success notification instead of redirecting
      toast?.success?.(t("success") || "Password updated successfully");

      // Close the dialog by dispatching a custom event
      window.dispatchEvent(new CustomEvent("password-updated"));

      // Reset the form
      setPassword("");
      setConfirmPassword("");
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <form onSubmit={handleUpdatePassword}>
        <div className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='newPassword'>{t("password")}</Label>
            <Input
              id='newPassword'
              type='password'
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='••••••••'
              autoComplete='new-password'
            />
            {password && (
              <div className='mt-2'>
                <div className='flex items-center justify-between mb-1 text-xs'>
                  <span>Password strength</span>
                  <span
                    className={
                      passwordStrength < 30
                        ? "text-red-500"
                        : passwordStrength < 60
                        ? "text-yellow-500"
                        : "text-green-500"
                    }
                  >
                    {passwordStrength < 30
                      ? "Weak"
                      : passwordStrength < 60
                      ? "Medium"
                      : "Strong"}
                  </span>
                </div>
                <div className='h-1.5 w-full bg-gray-200 rounded-full overflow-hidden'>
                  <div
                    className={`h-full ${getStrengthColor(
                      passwordStrength
                    )} transition-all duration-300`}
                    style={{ width: `${passwordStrength}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>{t("confirmPassword")}</Label>
            <Input
              id='confirmPassword'
              type='password'
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder='••••••••'
              autoComplete='new-password'
            />
          </div>

          {error && <p className='text-sm text-red-500'>{error}</p>}

          <div className='flex justify-end mt-4 gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() =>
                window.dispatchEvent(new CustomEvent("password-updated"))
              }
            >
              {t("cancel") || "Cancel"}
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t("processing")}
                </>
              ) : (
                t("submit")
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
