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

  // Get all transactions ordered by date
  const { data, error } = await supabase
    .from("transactions")
    .select("amount, type, created_at")
    .eq("user_uid", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Process transactions into daily cash flow
  const cashFlowByDate = data.reduce(
    (acc: Record<string, number>, transaction) => {
      const date = new Date(transaction.created_at).toISOString().split("T")[0];

      if (!acc[date]) {
        acc[date] = 0;
      }

      // Add income, subtract expenses
      if (transaction.type === "income") {
        acc[date] += transaction.amount;
      } else if (transaction.type === "expense") {
        acc[date] -= transaction.amount;
      }

      return acc;
    },
    {}
  );

  return NextResponse.json({ cashFlow: cashFlowByDate });
}
