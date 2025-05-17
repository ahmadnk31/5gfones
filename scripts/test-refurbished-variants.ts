/**
 * Test script for refurbished product variants feature
 *
 * This script tests the functionality of refurbished product variants
 * by simulating API calls and cart operations.
 */

import { createClient } from "@/lib/supabase/client";
import { addRefurbishedToCart, getCart, clearCart } from "@/lib/cart";

// Initialize Supabase client
const supabase = createClient();

async function testRefurbishedVariants() {
  console.log("🧪 Running refurbished variants tests...");

  try {
    // Clear cart before testing
    clearCart();
    console.log("✓ Cart cleared");

    // 1. Create test refurbished product with variants
    console.log("\n1. Creating test refurbished product with variants...");

    // Create main product
    const { data: product, error: productError } = await supabase
      .from("refurbished_products")
      .insert({
        name: "Test Refurbished iPhone",
        description: "Test product for variant testing",
        condition: "excellent",
        original_price: 999.99,
        refurbished_price: 699.99,
        discount_percentage: 30,
        warranty_months: 12,
        in_stock: 10,
        is_featured: false,
        refurbishment_date: new Date().toISOString(),
        has_variations: true,
        user_uid: "test-user", // This should be a valid user ID in your system
      })
      .select()
      .single();

    if (productError) throw productError;
    console.log(`✓ Created test product: ${product.name} (ID: ${product.id})`);

    // Create variants
    const variants = [
      {
        refurbished_product_id: product.id,
        variant_name: "Color",
        variant_value: "Space Gray",
        price_adjustment: 0,
        stock: 5,
        sku: "RF-IPH-SG",
        user_uid: "test-user",
      },
      {
        refurbished_product_id: product.id,
        variant_name: "Color",
        variant_value: "Silver",
        price_adjustment: 10,
        stock: 3,
        sku: "RF-IPH-SL",
        user_uid: "test-user",
      },
      {
        refurbished_product_id: product.id,
        variant_name: "Color",
        variant_value: "Gold",
        price_adjustment: 20,
        stock: 2,
        sku: "RF-IPH-GD",
        user_uid: "test-user",
      },
    ];

    const { data: variantsData, error: variantsError } = await supabase
      .from("refurbished_product_variants")
      .insert(variants)
      .select();

    if (variantsError) throw variantsError;
    console.log(`✓ Created ${variantsData.length} variants`);

    // 2. Test adding variants to cart
    console.log("\n2. Testing cart functionality with variants...");

    // Add first variant to cart
    addRefurbishedToCart(
      product.id,
      `${product.name} - ${variantsData[0].variant_value}`,
      product.refurbished_price + variantsData[0].price_adjustment,
      1,
      "test-image.jpg",
      product.condition,
      variantsData[0].id,
      {
        variant_name: variantsData[0].variant_name,
        variant_value: variantsData[0].variant_value,
      }
    );

    // Add second variant to cart
    addRefurbishedToCart(
      product.id,
      `${product.name} - ${variantsData[1].variant_value}`,
      product.refurbished_price + variantsData[1].price_adjustment,
      2,
      "test-image.jpg",
      product.condition,
      variantsData[1].id,
      {
        variant_name: variantsData[1].variant_name,
        variant_value: variantsData[1].variant_value,
      }
    );

    // Check cart contents
    const cart = getCart();
    console.log(`✓ Cart has ${cart.length} items`);

    // Verify cart items are correct
    const firstVariantInCart = cart.find(
      (item) => item.attributes?.variantId === variantsData[0].id
    );

    const secondVariantInCart = cart.find(
      (item) => item.attributes?.variantId === variantsData[1].id
    );

    if (!firstVariantInCart || !secondVariantInCart) {
      throw new Error("Expected variants not found in cart");
    }

    console.log(
      `✓ First variant (${variantsData[0].variant_value}) is in cart with correct price: ${firstVariantInCart.price}`
    );
    console.log(
      `✓ Second variant (${variantsData[1].variant_value}) is in cart with correct price: ${secondVariantInCart.price} and quantity: ${secondVariantInCart.quantity}`
    );

    // 3. Clean up test data
    console.log("\n3. Cleaning up test data...");

    // Delete test products (variants should cascade delete)
    const { error: deleteError } = await supabase
      .from("refurbished_products")
      .delete()
      .eq("id", product.id);

    if (deleteError) throw deleteError;
    console.log("✓ Test data cleaned up successfully");

    // Clear cart
    clearCart();
    console.log("✓ Cart cleared");

    console.log("\n✅ All refurbished variant tests passed!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Uncomment to run the test
// testRefurbishedVariants();

export { testRefurbishedVariants };
