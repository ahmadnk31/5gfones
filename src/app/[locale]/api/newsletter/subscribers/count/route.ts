import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Authenticate admin users
async function isAdmin(supabase: any) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  // Get user profile with role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return profile?.role === "admin" || profile?.role === "super_admin";
}

export async function GET() {
  try {
    const supabase = createClient();

    // Check if user is admin
    const adminUser = await isAdmin(supabase);
    if (!adminUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Count verified subscribers
    const { count, error } = await supabase
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("verified", true)
      .eq("unsubscribed", false);

    if (error) {
      throw error;
    }

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("Error counting subscribers:", error);
    return NextResponse.json(
      {
        error: "Failed to count subscribers",
      },
      { status: 500 }
    );
  }
}
