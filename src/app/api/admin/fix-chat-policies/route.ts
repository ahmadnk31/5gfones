import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    // Check if request is authorized
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 }
      );
    }

    // Read the SQL file
    const sqlPath = path.join(process.cwd(), "sql", "fix-chat-policies.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf8");

    // Split into statements and execute
    const statements = sqlContent
      .split(";")
      .filter((stmt) => stmt.trim() !== "")
      .map((stmt) => stmt.trim() + ";");

    const results = [];

    for (const statement of statements) {
      try {
        // Execute the SQL statement
        const { data, error } = await supabase.rpc("exec_sql", {
          sql_query: statement,
        });

        if (error) {
          results.push({
            success: false,
            sql: statement,
            error: error.message,
          });
        } else {
          results.push({ success: true, sql: statement });
        }
      } catch (err: any) {
        results.push({ success: false, sql: statement, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Chat policies SQL executed",
      results,
    });
  } catch (error: any) {
    console.error("Error fixing chat policies:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
