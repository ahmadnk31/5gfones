"use client";

import React, { useState, useEffect } from "react";
import { CustomerSupportBubble } from "@/components/customer-support-bubble";
import { createClient } from "@/lib/supabase/client";

export const ClientSupportProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [username, setUsername] = useState<string>("Guest User");
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Check if user is logged in and get their details
  useEffect(() => {
    const loadUserDetails = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Check if user is admin
          const { data: profile } = await supabase
            .from("profiles")
            .select("role, full_name")
            .eq("id", user.id)
            .single();

          if (profile?.role === "admin") {
            setIsAdmin(true);
          }

          // Set username
          if (profile?.full_name) {
            setUsername(profile.full_name);
          } else {
            setUsername(user.email?.split("@")[0] || "User");
          }
        }

        setIsLoaded(true);
      } catch (error) {
        console.error("Error loading user details:", error);
        setIsLoaded(true);
      }
    };

    loadUserDetails();
  }, []);

  if (!isLoaded) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {/* Only show support bubble for non-admin users and when the page is loaded */}
      {!isAdmin && <CustomerSupportBubble username={username} />}
    </>
  );
};
