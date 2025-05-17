import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const productId = params.productId;

  if (!productId) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First verify the product exists and belongs to the user
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("user_uid", user.id)
      .single();

    if (productError) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get the variants for this product
    const { data, error } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("variant_name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ variants: data });
  } catch (error) {
    console.error("Error fetching variants:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const productId = params.productId;

  if (!productId) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First verify the product exists and belongs to the user
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("user_uid", user.id)
      .single();

    if (productError) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get the variant data from the request
    const variantData = await request.json();

    if (!variantData.variant_name || !variantData.variant_value) {
      return NextResponse.json(
        { error: "Variant name and value are required" },
        { status: 400 }
      );
    }

    // Add user_uid and product_id to the variant data
    const variantToInsert = {
      ...variantData,
      product_id: parseInt(productId),
      user_uid: user.id,
    };

    // Insert the new variant
    const { data, error } = await supabase
      .from("product_variants")
      .insert([variantToInsert])
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ variant: data[0] }, { status: 201 });
  } catch (error) {
    console.error("Error adding variant:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  const productId = params.productId;
  const url = new URL(request.url);
  const variantId = url.searchParams.get("variantId");

  if (!productId) {
    return NextResponse.json(
      { error: "Product ID is required" },
      { status: 400 }
    );
  }

  if (!variantId) {
    return NextResponse.json(
      { error: "Variant ID is required" },
      { status: 400 }
    );
  }

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // First verify the variant exists and belongs to the user
    const { data: variant, error: variantError } = await supabase
      .from("product_variants")
      .select("id, product_id, products:product_id(user_uid)")
      .eq("id", variantId)
      .eq("product_id", productId)
      .single();

    if (variantError) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    if (variant.products.user_uid !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete the variant
    const { error } = await supabase
      .from("product_variants")
      .delete()
      .eq("id", variantId)
      .eq("product_id", productId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
