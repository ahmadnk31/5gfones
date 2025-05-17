# Refurbished Products with Variants Implementation

## Overview

This document outlines the implementation of variants support for refurbished products in FinOpenPOS. The feature allows adding multiple variants (like different colors or storage capacities) to refurbished products, similar to the existing accessory variant functionality.

## Features Implemented

1. Added a "has variants" option to refurbished products
2. Added support for multiple images per variant
3. Implemented edit and delete functionality for variants
4. Created UI for selecting variants on the product detail page
5. Updated cart handling to properly manage variant-specific information

## Database Changes

The following tables were added to support refurbished product variants:

### 1. Added Column to Refurbished Products Table

```sql
ALTER TABLE refurbished_products ADD COLUMN has_variations BOOLEAN NOT NULL DEFAULT FALSE;
```

### 2. Refurbished Product Variants Table

```sql
CREATE TABLE refurbished_product_variants (
    id SERIAL PRIMARY KEY,
    refurbished_product_id INTEGER REFERENCES refurbished_products(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    variant_value VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(10, 2) NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    sku VARCHAR(100),
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. Variant Images Table

```sql
CREATE TABLE refurbished_variant_images (
    id SERIAL PRIMARY KEY,
    variant_id INTEGER REFERENCES refurbished_product_variants(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    user_uid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Key Components Modified

1. **Admin Page** (`src/app/[locale]/admin/refurbished/page.tsx`)

   - Added UI for managing variants
   - Implemented variant creation, editing, and deletion
   - Added image upload functionality for variants

2. **Product Detail Page** (`src/app/[locale]/refurbished/[id]/page.tsx`)

   - Added variant selection UI
   - Implemented dynamic price calculations based on selected variant
   - Updated stock display to reflect variant-specific stock
   - Modified image gallery to show variant-specific images

3. **Cart Functionality** (`src/lib/cart.ts`)
   - Enhanced `addRefurbishedToCart` function to handle variants
   - Modified cart item structure to store variant information

## UI Changes

### Admin Page

- Added a "Has variants" toggle switch in the product details tab
- Added a Variants tab in the product editor
- Implemented a variant editor form for adding/editing variants
- Added a table to display existing variants with actions

### Product Detail Page

- Added variant selection buttons showing variant name and price adjustment
- Updated price display to include variant price adjustments
- Modified stock display to show variant-specific stock levels
- Enhanced "Add to Cart" functionality to include variant data

## Testing

A test script has been provided (`scripts/test-refurbished-variants.ts`) to verify:

- Creating refurbished products with variants
- Adding variants to the cart
- Proper price calculations with variant adjustments
- Cart data structure for variant products

## Deployment Steps

1. Apply database changes using the SQL script (`add-refurbished-variants.sql`)
2. Deploy updated frontend components
3. Verify admin functionality by creating a product with variants
4. Test customer-facing functionality by browsing and adding variants to cart

## Future Enhancements

- Bulk variant creation functionality
- Variant-specific discounts
- Color/attribute swatches for more visual variant selection
- Variant stock alerts
- Variant performance analytics
