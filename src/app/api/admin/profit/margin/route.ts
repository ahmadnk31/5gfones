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

  const { data: transactionsData, error: transactionsError } = await supabase
    .from("transactions")
    .select("amount, type, category, created_at")
    .eq("status", "completed")
    .eq("user_uid", user.id)
    .order("created_at", { ascending: true });

  if (transactionsError) {
    console.error("Error fetching transactions:", transactionsError);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }

  if (!transactionsData) {
    return NextResponse.json(
      { error: "No transactions found" },
      { status: 404 }
    );
  }

  const profitMargin = calculateProfitMarginSeries(transactionsData);

  return NextResponse.json({ profitMargin });
}

// Helper function to calculate profit margin over time
function calculateProfitMarginSeries(transactions: any[]) {
  const transactionsByDate: Record<
    string,
    { income: number; expense: number }
  > = {};

  // Group transactions by date and type
  transactions.forEach((tx) => {
    const date = new Date(tx.created_at).toISOString().split("T")[0];

    if (!transactionsByDate[date]) {
      transactionsByDate[date] = { income: 0, expense: 0 };
    }

    if (tx.type === "income") {
      transactionsByDate[date].income += tx.amount || 0;
    } else if (tx.type === "expense") {
      transactionsByDate[date].expense += tx.amount || 0;
    }
  });

  // Calculate profit margin for each day
  return Object.entries(transactionsByDate)
    .map(([date, { income, expense }]) => {
      // Avoid division by zero
      const margin = income > 0 ? ((income - expense) / income) * 100 : 0;
      return {
        date,
        margin: Math.round(margin * 100) / 100, // Round to 2 decimal places
      };
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
