"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Pencil, User, PhoneCall, Mail, MapPin, FileText, Clock, Package, CreditCard, Globe } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface CustomerInfoProps {
  username: string;
  roomName: string;
}

type CustomerData = {
  name: string;
  email: string;
  phone: string;
  notes: string;
  joinDate?: string;
  totalOrders?: number;
  totalSpent?: number;
  lastPurchase?: string;
  preferredLanguage?: string;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
};

export const CustomerInfo = ({ username, roomName }: CustomerInfoProps) => {
  const t = useTranslations("customerSupport");
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: username,
    email: `${username.toLowerCase().replace(/\s+/g, "")}@example.com`,
    phone: "+1 (555) 123-4567",
    notes: t("customerInfo.loyalCustomer"),
    joinDate: "2023-01-15",
    totalOrders: 8,
    totalSpent: 1240.50,
    lastPurchase: "2023-04-22",
    preferredLanguage: "en",
    emailNotifications: true,
    smsNotifications: false
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState(customerData.notes);
  const [activeTab, setActiveTab] = useState("details");  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    // Fetch customer data from the database using only profiles table
    const fetchCustomerData = async () => {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // Find the user profile by name
        // In a real-world scenario, we'd typically use user ID from the chat context
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, phone, email, email_notifications, sms_notifications, preferred_language, created_at")
          .ilike("full_name", `%${username}%`)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching profile:", profileError);
          setIsLoading(false);
          return;
        }

        // If no profile was found, exit early
        if (!profileData) {
          setIsLoading(false);
          return;
        }

        // Get orders for this user if available
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .select("id, total_amount, created_at")
          .eq("user_uid", profileData.id) // Assuming this is the correct foreign key
          .order("created_at", { ascending: false });
          
        if (orderError) {
          console.error("Error fetching orders:", orderError);
        }
          
        const totalOrders = orderData?.length || 0;
        const totalSpent = orderData?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;
        const lastPurchase = orderData && orderData.length > 0 ? orderData[0].created_at : undefined;

        // Set customer data from profile information
        setCustomerData({
          name: profileData.full_name || username,
          email: profileData.email || `${username.toLowerCase().replace(/\s+/g, "")}@example.com`,
          phone: profileData.phone || "",
          notes: t("customerInfo.loyalCustomer"),
          preferredLanguage: profileData.preferred_language || "en",
          emailNotifications: profileData.email_notifications || false,
          smsNotifications: profileData.sms_notifications || false,
          joinDate: profileData.created_at,
          totalOrders,
          totalSpent,
          lastPurchase,
        });
        setEditedNotes(t("customerInfo.loyalCustomer"));
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setIsLoading(false);
      }
    };

    if (
      username &&
      username !== "Admin Support" &&
      !username.includes("Admin")
    ) {
      fetchCustomerData();
    } else {
      setIsLoading(false);
    }  }, [
    username,
    roomName,
    t
  ]);

  const saveNotes = async () => {
    try {
      const supabase = createClient();

      // In a real application, you would save notes to your database
      // Example:
      // const { error } = await supabase
      //   .from("customer_notes")
      //   .upsert({
      //     username: username,
      //     room_name: roomName,
      //     notes: editedNotes,
      //   });

      setCustomerData((prev) => ({
        ...prev,
        notes: editedNotes,
      }));

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving notes:", error);
    }
  };

  // Format a date string to a more readable format
  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric", 
      month: "short", 
      day: "numeric"
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="w-full h-full bg-background overflow-y-auto">
      {/* Header with customer name and avatar */}      <div className="p-4 border-b sticky top-0 bg-background z-10">
        <div className="flex flex-col items-center mb-2">
          <Avatar className="h-16 w-16 mb-2">
            <AvatarImage 
              src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(customerData.name)}`} 
              alt={customerData.name} 
            />
            <AvatarFallback>{customerData.name.charAt(0)}</AvatarFallback>
          </Avatar>          <h2 className="text-lg font-semibold">{customerData.name}</h2>
          {customerData.preferredLanguage && (
            <Badge className="mt-1 bg-blue-100 text-blue-800">
              {customerData.preferredLanguage.toUpperCase()}
            </Badge>
          )}
        </div>
        
        <Tabs defaultValue="details" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="details">{t('customerInfo.customerDetails')}</TabsTrigger>
            <TabsTrigger value="notes">{t('customerInfo.notes')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
        {/* Tab content area */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            <TabsContent value="details" className="mt-0 space-y-4">
              {/* Customer details section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium">{t('customerInfo.email')}</p>
                    <p className="text-sm text-muted-foreground truncate">{customerData.email || '-'}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{t('customerInfo.phoneNumber')}</p>
                    <p className="text-sm text-muted-foreground">{customerData.phone || '-'}</p>
                  </div>
                </div>
                  <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{t('customerInfo.notifications')}</p>
                    <div className="flex gap-2">
                      <Badge variant={customerData.emailNotifications ? "default" : "outline"} className="text-xs">
                        {t('customerInfo.email')}
                      </Badge>
                      <Badge variant={customerData.smsNotifications ? "default" : "outline"} className="text-xs">
                        {t('customerInfo.sms')}
                      </Badge>
                    </div>
                  </div>
                </div>

                {customerData.preferredLanguage && (
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{t('customerInfo.preferredLanguage')}</p>
                      <p className="text-sm text-muted-foreground">{customerData.preferredLanguage.toUpperCase()}</p>
                    </div>
                  </div>
                )}
                
                <Separator />
                
                {/* Customer statistics */}
            <div className="space-y-3">              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('customerInfo.memberSince')}</p>
                  <p className="text-sm text-muted-foreground">{formatDate(customerData.joinDate)}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('customerInfo.totalOrders')}</p>
                  <p className="text-sm text-muted-foreground">{customerData.totalOrders || 0}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{t('customerInfo.totalSpent')}</p>
                  <p className="text-sm text-muted-foreground">{formatCurrency(customerData.totalSpent)}</p>
                </div>
              </div>
              
              {customerData.lastPurchase && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{t('customerInfo.lastPurchase')}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(customerData.lastPurchase)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="notes" className="mt-0 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-muted-foreground">{t('customerInfo.notes')}</h4>
            {!isEditing ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs" 
                onClick={() => setIsEditing(true)}
              >
                {t('customerInfo.edit')}
              </Button>
            ) : (
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 text-xs" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedNotes(customerData.notes);
                  }}
                >
                  {t('customerInfo.cancel')}
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="h-6 text-xs" 
                  onClick={saveNotes}
                >
                  {t('customerInfo.save')}
                </Button>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="border rounded-md p-3 bg-muted/30">
              <p className="text-sm whitespace-pre-wrap">{customerData.notes || "No notes yet."}</p>
            </div>
          ) : (
            <Textarea 
              value={editedNotes} 
              onChange={(e) => setEditedNotes(e.target.value)}
              className="min-h-[150px] text-sm"
              placeholder="Add notes about this customer..."
            />          )}
          
          {/* Customer support tags */}
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">{t('customerInfo.tags')}</h4>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="bg-muted/40">{t('customerInfo.tagPremium')}</Badge>
              <Badge variant="outline" className="bg-muted/40">{t('customerInfo.tagRepeatBuyer')}</Badge>
              <Badge variant="outline" className="bg-muted/40">{t('customerInfo.tagTechEnthusiast')}</Badge>
            </div>
          </div>
        </TabsContent>
      </>
      )}
    </div>
    </div>
  );
};
