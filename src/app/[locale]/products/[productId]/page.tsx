import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import ProductDetail from '@/components/product-detail';

export default async function ProductPage({
  params
}: {
  params: { locale: string; productId: string }
}) {
  const t = await getTranslations('product')
  const {productId}=await params
  const supabase = await createClient();
  

  
  // Fetch product details
  const { data: product, error } = await supabase
    .from('products')
    .select(`
      *,
      brands (id, name),
      categories (id, name)
    `)
    .eq('id', productId)
    .single();
  
  if (error || !product) {
    notFound();
  }
  
  // Fetch product variants
  const { data: variants } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('variant_name', { ascending: true });
  
  // Fetch related products from the same category
  const { data: relatedProducts } = await supabase
    .from('products')
    .select(`
      id, 
      name, 
      base_price,
      image_url,
      in_stock,
      brands (name),
      (select count(*) from product_variants where product_id = products.id) as variant_count
    `)
    .eq('category_id', product.category_id)
    .neq('id', productId)
    .limit(4);
      // Fetch product images (including variant images)
  const { data: variantImages } = await supabase
    .from('variant_images')
    .select('*')
    .eq('product_id', productId);
  
  // Fetch category discount if product has a category_id
  let categoryDiscount = 0;
  if (product.category_id) {
    const { data: discountData } = await supabase
      .from('category_discounts')
      .select('discount_percentage')
      .eq('category_id', product.category_id)
      .eq('is_active', true)
      .lte('start_date', new Date().toISOString())
      .or(`end_date.gt.${new Date().toISOString()},end_date.is.null`)
      .order('discount_percentage', { ascending: false })
      .limit(1);
    
    if (discountData && discountData.length > 0) {
      categoryDiscount = discountData[0].discount_percentage;
    }
  }
  
  return (
    <ProductDetail 
      product={product} 
      variants={variants || []} 
      relatedProducts={relatedProducts || []}
      variantImages={variantImages || []}
      categoryDiscount={categoryDiscount}
    />
  );
}
