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

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("user_uid", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Parse any JSON strings in description and short_description fields
  const parsedProducts = data.map((product) => ({
    ...product,
    description: tryParseJSON(product.description),
    short_description: tryParseJSON(product.short_description),
  }));

  return NextResponse.json(parsedProducts);
}

export async function POST(request: Request) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const newProduct = await request.json();

  // Handle multilingual content by storing description and short_description as JSON
  const productToInsert = {
    ...newProduct,
    description:
      typeof newProduct.description === "object"
        ? JSON.stringify(newProduct.description)
        : newProduct.description,
    short_description:
      typeof newProduct.short_description === "object"
        ? JSON.stringify(newProduct.short_description)
        : newProduct.short_description,
    user_uid: user.id,
  };

  const { data, error } = await supabase
    .from("products")
    .insert([productToInsert])
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Parse the JSON fields back to objects for the response
  const parsedProduct = {
    ...data[0],
    description: tryParseJSON(data[0].description),
    short_description: tryParseJSON(data[0].short_description),
  };

  return NextResponse.json(parsedProduct);
}

// Helper function to safely parse JSON
function tryParseJSON(jsonString: any) {
  if (typeof jsonString !== "string") return jsonString;

  try {
    return JSON.parse(jsonString);
  } catch (e) {
    return jsonString;
  }
}
