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
  const { data: incomeData, error: incomeError } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_uid", user.id)
    .eq("type", "income")
    .eq("status", "completed");

  if (incomeError) {
    return NextResponse.json({ error: incomeError.message }, { status: 500 });
  }

  // Get all expense transactions
  const { data: expenseData, error: expenseError } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_uid", user.id)
    .eq("type", "expense")
    .eq("status", "completed");

  if (expenseError) {
    return NextResponse.json({ error: expenseError.message }, { status: 500 });
  }

  // Calculate total revenue
  const totalIncome = incomeData.reduce(
    (sum, transaction) => sum + (transaction.amount || 0),
    0
  );

  // Calculate total expenses
  const totalExpenses = expenseData.reduce(
    (sum, transaction) => sum + (transaction.amount || 0),
    0
  );

  // Calculate total profit
  const totalProfit = totalIncome - totalExpenses;

  return NextResponse.json({ totalProfit });
}
