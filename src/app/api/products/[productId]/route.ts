import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: { productId: string; orderId: string } }
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const updatedProduct = await request.json();
  const productId = params.productId;
  const orderId = params.orderId;

  // Handle multilingual content by storing description and short_description as JSON
  const productToUpdate = {
    ...updatedProduct,
    description:
      typeof updatedProduct.description === "object"
        ? JSON.stringify(updatedProduct.description)
        : updatedProduct.description,
    short_description:
      typeof updatedProduct.short_description === "object"
        ? JSON.stringify(updatedProduct.short_description)
        : updatedProduct.short_description,
    user_uid: user.id,
  };

  const { data, error } = await supabase
    .from("products")
    .update(productToUpdate)
    .eq("id", productId)
    .eq("user_uid", user.id)
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data.length === 0) {
    return NextResponse.json(
      { error: "Product not found or not authorized" },
      { status: 404 }
    );
  }

  const orderUpdate = await supabase
    .from("orders")
    .update({ ...updatedProduct, user_uid: user.id })
    .eq("id", orderId)
    .eq("user_uid", user.id);

  if (orderUpdate.error) {
    return NextResponse.json(
      { error: orderUpdate.error.message },
      { status: 500 }
    );
  }

  // Parse the JSON fields back to objects for the response
  const parsedProduct = {
    ...data[0],
    description: tryParseJSON(data[0].description),
    short_description: tryParseJSON(data[0].short_description),
  };

  return NextResponse.json(parsedProduct);
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string; orderId: string } }
) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const productId = params.productId;
  const orderId = params.orderId;

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("user_uid", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orderDelete = await supabase
    .from("orders")
    .delete()
    .eq("id", orderId)
    .eq("user_uid", user.id);

  if (orderDelete.error) {
    return NextResponse.json(
      { error: orderDelete.error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({
    message: "Product and Order deleted successfully",
  });
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
