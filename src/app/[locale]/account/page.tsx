"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { Link } from "@/i18n/navigation";

export default function AccountPage() {
  const t = useTranslations("auth.account");
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "customer", // Add role with default value
  });  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [language, setLanguage] = useState("en");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const supabase = createClient();

  // Event listener for password update
  useEffect(() => {
    const handlePasswordUpdated = () => {
      setPasswordDialogOpen(false);
    };

    window.addEventListener("password-updated", handlePasswordUpdated);
    return () => {
      window.removeEventListener("password-updated", handlePasswordUpdated);
    };
  }, []);

  // Fetch user profile data
  useEffect(() => {
    async function fetchProfile() {
      setIsLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // Get profile data
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (data) {
          setProfile({
            full_name: data.full_name || "",
            email: user.email || "",
            phone: data.phone || "",
            role: data.role || "customer", // Add role from fetched data
          });
          setEmailNotifications(data.email_notifications || true);
          setSmsNotifications(data.sms_notifications || false);
          setLanguage(data.language || "en");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  const updateProfile = async () => {
    setIsUpdating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          role: profile.role, // Include role in update
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
          language: language,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        toast.error(t("updateError"));
        console.error("Update error:", error);
      } else {
        toast.success(t("updateSuccess"));
      }
    } catch (error) {
      toast.error(t("updateError"));
      console.error("Update error:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteAccount = async () => {
    try {
      setIsUpdating(true);
      const { error } = await supabase.rpc("delete_user_account");

      if (error) {
        toast.error(t('deleteError'));
        console.error("Delete error:", error);
      } else {
        toast.success(t("deleteSuccess"));
        // Redirect to home page after account deletion
        window.location.href = "/";
      }
    } catch (error) {
      toast.error(t('deletingAccountError'));
      console.error("Delete error:", error);
    } finally {
      setIsUpdating(false);
      setDeleteDialogOpen(false);
    }
  };

  if (isLoading) {
    return (
      <div className='flex h-[50vh] w-full items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }
  return (
    <div>
      <Tabs defaultValue='personal'>
        <TabsList className='grid w-full max-w-md grid-cols-2'>
          <TabsTrigger value='personal'>{t("personalInfo")}</TabsTrigger>
          <TabsTrigger value='preferences'>{t("preferences")}</TabsTrigger>
          
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value='personal' className='mt-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t("personalInfo")}</CardTitle>
              <CardDescription>
                {t("personalInfoDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>{t("name")}</Label>
                  <Input
                    id='name'
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>{t("email")}</Label>
                  <Input
                    id='email'
                    type='email'
                    value={profile.email}
                    disabled
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='phone'>{t("phone")}</Label>
                  <Input
                    id='phone'
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                  />
                </div>                <div className='space-y-2'>
                  <Label htmlFor='role'>{t("role") || "Role"}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id='role'
                      value={profile.role || "customer"}
                      disabled
                    />
                    <Badge className={
                      profile.role === 'admin' 
                        ? 'bg-purple-500' 
                        : profile.role === 'technician' 
                          ? 'bg-blue-500' 
                          : 'bg-green-500'
                    }>
                      {profile.role === 'admin' 
                        ? t("roleAdmin") || "Administrator" 
                        : profile.role === 'technician' 
                          ? t("roleTechnician") || "Technician" 
                          : t("roleCustomer") || "Customer"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className='pt-4'>
                <Button
                  onClick={updateProfile}
                  disabled={isUpdating}
                  className='w-full sm:w-auto'
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      {t("updating")}
                    </>
                  ) : (
                    t("updateProfile")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>          
          <Card className='mt-6'>
            <CardHeader>
              <CardTitle>{t("password")}</CardTitle>
            </CardHeader>
            <CardContent>              
                <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant='outline' className='w-full sm:w-auto'>
                    {t("updatePassword")}
                  </Button>
                </DialogTrigger>                
                <DialogContent className="sm:max-w-[425px] p-0">
                  <DialogHeader>
                    <DialogDescription>
                    </DialogDescription>
                  </DialogHeader>
                  <ForgotPasswordForm className="mt-0 shadow-none" />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Role-specific options */}
          {(profile.role === 'admin' || profile.role === 'technician') && (
            <Card className='mt-6'>
              <CardHeader>
                <CardTitle>
                  {profile.role === 'admin' ? t("adminDashboard") : t("technicianDashboard")}
                </CardTitle>
                <CardDescription>
                    {profile.role === 'admin' 
                      ? t("adminDashboardDescription")
                      : t("technicianDashboardDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {profile.role === 'admin' && (
                    <>
                      <Button asChild variant='default' className='w-full sm:w-auto'>
                        <Link href="/admin">
                        {t('adminDashboard')}
                        </Link>
                      </Button>
                      <Button asChild variant='outline' className='w-full sm:w-auto'>
                        <Link href="/admin/users">
                        {t('manageUsers')}
                        </Link>
                      </Button>
                      <Button asChild variant='outline' className='w-full sm:w-auto'>
                        <Link href="/admin/products">
                        {t('manageProducts')}
                        </Link>
                      </Button>
                    </>
                  )}
                  {profile.role === 'technician' && (
                    <>
                      <Button asChild variant='default' className='w-full sm:w-auto'
                      disabled={true}
                      >
                        <Link href="/admin/repairs">
                        {t('repairDashboard')}
                        </Link>
                      </Button>
                      <Button asChild variant='outline' className='w-full sm:w-auto'>
                        <Link href="/admin/appointments">
                        {t('manageAppointments')}
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className='mt-6 border-red-200'>
            <CardHeader>
              <CardTitle className='text-red-600'>{t("danger")}</CardTitle>
              <CardDescription>{t("deleteWarning")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant='destructive'
                onClick={() => setDeleteDialogOpen(true)}
                className='w-full sm:w-auto'
              >
                {t("deleteAccount")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value='preferences' className='mt-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t("preferences")}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='space-y-2'>
                <Label htmlFor='language'>{t("language")}</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id='language' className='w-full sm:w-[240px]'>
                    <SelectValue placeholder='Select language' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='en'>English</SelectItem>
                    <SelectItem value='es'>Español</SelectItem>
                    <SelectItem value='fr'>Français</SelectItem>
                    <SelectItem value='de'>Deutsch</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className='mb-4 text-lg font-medium'>
                  {t("notifications")}
                </h3>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='email-notifications' className='flex-1'>
                      {t("emailNotifications")}
                    </Label>
                    <Switch
                      id='email-notifications'
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <div className='flex items-center justify-between'>
                    <Label htmlFor='sms-notifications' className='flex-1'>
                      {t("smsNotifications")}
                    </Label>
                    <Switch
                      id='sms-notifications'
                      checked={smsNotifications}
                      onCheckedChange={setSmsNotifications}
                    />
                  </div>
                </div>
              </div>

              <div className='pt-4'>
                <Button
                  onClick={updateProfile}
                  disabled={isUpdating}
                  className='w-full sm:w-auto'
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      {t("updating")}
                    </>
                  ) : (
                    t("updateProfile")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className='text-red-600'>
                {t('deleteAccount')}
            </DialogTitle>
            <DialogDescription>{t("deleteWarning")}</DialogDescription>
          </DialogHeader>
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertTitle>
                {t('warning')}
            </AlertTitle>
            <AlertDescription>
              {t('deleteAccountDescription')}
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setDeleteDialogOpen(false)}
              className='mr-2'
            >
              {t('cancel')}
            </Button>
            <Button
              variant='destructive'
              onClick={deleteAccount}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  {t("deleting")}
                </>
              ) : (
                t("deleteAccount")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
