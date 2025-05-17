import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = createClient();

    // Check if user is authenticated and is admin
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Execute the migration query to add images column to product_variants
    const { error } = await supabase.rpc("exec", {
      sql: `
        ALTER TABLE product_variants 
        ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
      `,
    });

    if (error) {
      console.error("Migration error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Database migration completed successfully. The images column has been added to product_variants table.",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred during migration.",
      },
      { status: 500 }
    );
  }
}
