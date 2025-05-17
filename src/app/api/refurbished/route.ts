import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);

  const page = parseInt(searchParams.get("page") || "1");
  const perPage = parseInt(searchParams.get("perPage") || "10");
  const condition = searchParams.get("condition");
  const categoryId = searchParams.get("categoryId");
  const brandId = searchParams.get("brandId");
  const sortBy = searchParams.get("sortBy");
  const featured = searchParams.get("featured");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");

  // Start range for pagination
  const start = (page - 1) * perPage;
  const end = start + perPage - 1;

  // Start building query
  let query = supabase.from("refurbished_products").select(
    `
      *,
      brands (id, name, image_url),
      categories (id, name, image_url),
      refurbished_product_images (id, image_url, is_primary),
      refurbished_product_specs (id, spec_name, spec_value)
    `,
    { count: "exact" }
  );

  // Apply filters
  if (condition) {
    query = query.eq("condition", condition);
  }

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }

  if (brandId) {
    query = query.eq("brand_id", brandId);
  }

  if (featured === "true") {
    query = query.eq("is_featured", true);
  }

  if (minPrice) {
    query = query.gte("refurbished_price", minPrice);
  }

  if (maxPrice) {
    query = query.lte("refurbished_price", maxPrice);
  }

  // Apply sorting
  if (sortBy) {
    switch (sortBy) {
      case "price_asc":
        query = query.order("refurbished_price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("refurbished_price", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "discount":
        query = query.order("discount_percentage", { ascending: false });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }
  } else {
    // Default sorting
    query = query.order("created_at", { ascending: false });
  }

  // Apply pagination
  query = query.range(start, end);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    products: data,
    pagination: {
      page,
      perPage,
      total: count || 0,
      totalPages: count ? Math.ceil(count / perPage) : 0,
    },
  });
}

export async function POST(request: Request) {
  const supabase = createClient();

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Parse the multipart form data request
    const formData = await request.formData();

    // Extract product data
    const productData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      condition: formData.get("condition") as string,
      original_price: parseFloat(formData.get("original_price") as string),
      refurbished_price: parseFloat(
        formData.get("refurbished_price") as string
      ),
      brand_id: formData.get("brand_id")
        ? parseInt(formData.get("brand_id") as string)
        : null,
      category_id: formData.get("category_id")
        ? parseInt(formData.get("category_id") as string)
        : null,
      compatible_with_model_id: formData.get("compatible_with_model_id")
        ? parseInt(formData.get("compatible_with_model_id") as string)
        : null,
      warranty_months: parseInt(
        (formData.get("warranty_months") as string) || "6"
      ),
      in_stock: parseInt((formData.get("in_stock") as string) || "1"),
      is_featured: formData.get("is_featured") === "true",
      user_uid: user.id,
    };

    // Insert product data
    const { data: productResult, error: productError } = await supabase
      .from("refurbished_products")
      .insert(productData)
      .select("id")
      .single();

    if (productError) {
      return NextResponse.json(
        { error: productError.message },
        { status: 500 }
      );
    }

    const productId = productResult.id;

    // Extract and process specs
    const specs = JSON.parse((formData.get("specs") as string) || "[]");

    if (specs.length > 0) {
      const specsData = specs.map((spec: any) => ({
        refurbished_product_id: productId,
        spec_name: spec.name,
        spec_value: spec.value,
        user_uid: user.id,
      }));

      const { error: specsError } = await supabase
        .from("refurbished_product_specs")
        .insert(specsData);

      if (specsError) {
        return NextResponse.json(
          { error: specsError.message },
          { status: 500 }
        );
      }
    }

    // Process image uploads
    const imagePromises = [];
    const images = formData.getAll("images") as File[];

    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const isPrimary = i === 0; // First image is primary
      const timestamp = Date.now();
      const fileExt = image.name.split(".").pop();
      const filePath = `refurbished/${user.id}/${productId}/${timestamp}.${fileExt}`;

      // Upload image to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, image);

      if (uploadError) {
        return NextResponse.json(
          { error: uploadError.message },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from("products")
        .getPublicUrl(filePath);

      // Insert image metadata
      const imageData = {
        refurbished_product_id: productId,
        image_url: publicUrlData.publicUrl,
        is_primary: isPrimary,
        user_uid: user.id,
      };

      imagePromises.push(
        supabase.from("refurbished_product_images").insert(imageData)
      );
    }

    // Wait for all image inserts to complete
    await Promise.all(imagePromises);

    return NextResponse.json(
      {
        success: true,
        productId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
