import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all income transactions
  const { data, error } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_uid", user.id)
    .eq("type", "income")
    .eq("status", "completed");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Calculate total revenue
  const totalRevenue = data.reduce(
    (sum, transaction) => sum + (transaction.amount || 0),
    0
  );

  return NextResponse.json({ totalRevenue });
}
