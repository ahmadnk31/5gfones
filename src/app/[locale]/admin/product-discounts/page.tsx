"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import CategoryProductSelector from "@/components/category-product-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";


export default function ProductSpecificDiscounts() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [discountPercentage, setDiscountPercentage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProducts.length) {
      toast.error("Please select at least one product");
      return;
    }

    if (!discountPercentage || isNaN(parseFloat(discountPercentage))) {
      toast.error("Please enter a valid discount percentage");
      return;
    }

    const discountValue = parseFloat(discountPercentage);
    if (discountValue < 0 || discountValue > 100) {
      toast.error("Discount percentage must be between 0 and 100");
      return;
    }
    
    setLoading(true);
    
    try {
      const supabase = createClient();
        // Update each selected product with the discount
      const updates = selectedProducts.map(async (productId) => {
        // Update the base product discount
        await supabase
          .from('products')
          .update({ 
            discount_percentage: discountValue,
            discount_start_date: new Date().toISOString()
          })
          .eq('id', productId);
          
        // Check if this product has variants, and update those too
        const { data: variants } = await supabase
          .from('product_variants')
          .select('id')
          .eq('product_id', productId);
          
        // If variants exist, update their discounts as well
        if (variants && variants.length > 0) {
          await supabase
            .from('product_variants')
            .update({ 
              discount_percentage: discountValue,
              discount_start_date: new Date().toISOString()
            })
            .eq('product_id', productId);
        }
      });
      
      await Promise.all(updates);
      
      toast.success("Discounts applied successfully!");
      
      // Reset form
      setSelectedProducts([]);
      setDiscountPercentage("");
    } catch (error) {
      console.error("Error applying discounts:", error);
      toast.error("Failed to apply discounts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Apply Product-Specific Discounts</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <CategoryProductSelector
              selectedProducts={selectedProducts}
              onProductsChange={setSelectedProducts}
              categoryLabel="Select Category"
              productLabel="Select Products for Discount"
              productPlaceholder="Search for products to apply discount..."
            />

            <div className="space-y-2">
              <Label htmlFor="discount-percentage">Discount Percentage</Label>
              <Input
                id="discount-percentage"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                placeholder="Enter discount percentage"
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                Enter a value between 0 and 100
              </p>
            </div>            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Applying..." : "Apply Discounts"}
              </Button>
              
              <Button 
                type="button"
                variant="destructive"
                disabled={loading || !selectedProducts.length}
                onClick={async () => {
                  if (confirm("Are you sure you want to remove all discounts from the selected products?")) {
                    setLoading(true);
                    try {
                      const supabase = createClient();
                      
                      // Remove discounts from selected products
                      const updates = selectedProducts.map(async (productId) => {
                        // Clear product discount
                        await supabase
                          .from('products')
                          .update({ 
                            discount_percentage: 0,
                            discount_start_date: null,
                            discount_end_date: null
                          })
                          .eq('id', productId);
                          
                        // Clear variant discounts
                        await supabase
                          .from('product_variants')
                          .update({ 
                            discount_percentage: 0,
                            discount_start_date: null,
                            discount_end_date: null
                          })
                          .eq('product_id', productId);
                      });
                      
                      await Promise.all(updates);
                      toast.success("Discounts removed successfully!");
                      
                      // Reset form
                      setSelectedProducts([]);
                      setDiscountPercentage("");
                    } catch (error) {
                      console.error("Error removing discounts:", error);
                      toast.error("Failed to remove discounts. Please try again.");
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
              >
                Remove Discounts
              </Button>
              
              <Button 
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => {
                  setSelectedProducts([]);
                  setDiscountPercentage("");
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>      {selectedProducts.length > 0 && (
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-medium mb-2">Selected Products: {selectedProducts.length}</h3>
          <p className="text-sm text-muted-foreground">
            You are about to apply a discount of {discountPercentage || "0"}% to {selectedProducts.length} selected products.
          </p>
        </div>
      )}
      
      <ProductDiscountsTable />
    </div>
  );
}

// Component to display current product discounts
function ProductDiscountsTable() {
  const [discountedProducts, setDiscountedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchDiscountedProducts() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('products')
          .select(`
            id, 
            name, 
            discount_percentage,
            discount_start_date,
            discount_end_date,
            categories:category_id (name),
            brands:brand_id (name)
          `)
          .gt('discount_percentage', 0)
          .order('discount_percentage', { ascending: false });
        
        if (error) throw error;
        setDiscountedProducts(data || []);
      } catch (error) {
        console.error("Error fetching discounted products:", error);
        toast.error("Failed to fetch discounted products");
      } finally {
        setLoading(false);
      }
    }
    
    fetchDiscountedProducts();
  }, []);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Products with Active Discounts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (discountedProducts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Products with Active Discounts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            No products have discounts applied
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products with Active Discounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Brand
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Start Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {discountedProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.categories?.name || 'Uncategorized'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {product.brands?.name || 'No Brand'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {product.discount_percentage}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.discount_start_date ? new Date(product.discount_start_date).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.discount_end_date ? new Date(product.discount_end_date).toLocaleDateString() : 'No end date'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
