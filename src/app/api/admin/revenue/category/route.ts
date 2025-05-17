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

  // Get all income transactions with categories
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, category")
    .eq("user_uid", user.id)
    .eq("type", "income")
    .eq("status", "completed")
    .not("category", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Group revenue by category
  const revenueByCategory = data.reduce(
    (acc: Record<string, number>, transaction) => {
      const category = transaction.category || "Uncategorized";

      if (!acc[category]) {
        acc[category] = 0;
      }

      acc[category] += transaction.amount || 0;
      return acc;
    },
    {}
  );

  return NextResponse.json({ revenueByCategory });
}
