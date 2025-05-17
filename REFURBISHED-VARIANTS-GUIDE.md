# Refurbished Products Variants Implementation Guide

This guide explains how to implement and deploy the refurbished products variants feature in FinOpenPOS.

## Overview

The refurbished products variants feature allows you to:

1. Add variants to refurbished products (e.g., different colors, storage capacities, etc.)
2. Manage variant-specific pricing, stock, and SKUs
3. Upload multiple images per variant
4. Display variants on the product detail page for customers to select

## Database Changes Required

The SQL script (`add-refurbished-variants.sql`) contains all necessary database changes:

1. Add `has_variations` field to the `refurbished_products` table
2. Create `refurbished_product_variants` table to store variant information
3. Create `refurbished_variant_images` table for variant-specific images
4. Add appropriate Row-Level Security policies

### Applying SQL Changes

Run the following command to apply the database changes (requires Supabase CLI):

```bash
supabase sql < add-refurbished-variants.sql
```

If you don't have Supabase CLI installed, you can apply the changes through:

1. Supabase Dashboard: Copy the SQL commands from `add-refurbished-variants.sql` and run them in the SQL Editor
2. Database CLI: If you have direct access to the PostgreSQL instance, run:
   ```bash
   psql -h [host] -p [port] -d [database] -U [user] -f add-refurbished-variants.sql
   ```

## Frontend Implementation

The feature is implemented across multiple files:

1. Admin refurbished product management page (`src/app/[locale]/admin/refurbished/page.tsx`)

   - Form fields for adding/editing variants
   - Variant management table
   - Image upload for variants

2. Product detail page (`src/app/[locale]/refurbished/[id]/page.tsx`)

   - Variant selection UI
   - Price adjustment display
   - Stock management based on selected variant

3. Cart library (`src/lib/cart.ts`)
   - Updated to handle variants with proper identification and pricing

## Testing the Feature

1. Create a new refurbished product or edit an existing one
2. Enable the "This product has variants" option
3. Add variants with different prices and stock levels
4. Upload images for each variant
5. View the product on the refurbished product detail page
6. Select different variants and verify:
   - Price updates correctly
   - Stock availability changes
   - Images update when selecting variants (if variant-specific images were added)
   - "Add to Cart" works correctly with the selected variant

## Troubleshooting

- If variants don't appear on the admin page, verify the SQL changes were applied properly
- If variant images don't display, check the permissions on the `refurbished_variant_images` table
- If cart functionality doesn't work with variants, ensure the `addRefurbishedToCart` function in `cart.ts` is handling variants correctly

## Future Enhancements

1. Bulk variant creation
2. Variant-specific discounts
3. Color/attribute swatches for visual variant selection
4. Low stock alerts for variants
