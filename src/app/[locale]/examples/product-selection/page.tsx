"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import CategoryProductSelector from "@/components/category-product-selector";
import ProductSelector from "@/components/product-selector";

export default function ProductSelectionExample() {
  const [selectedProductsByCategory, setSelectedProductsByCategory] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Selected products from a specific category:", selectedProductsByCategory);
    console.log("Selected products (any category):", selectedProducts);
    
    // Here you would typically send this data to your API
    alert(`Selected ${selectedProductsByCategory.length} products from category and ${selectedProducts.length} products overall`);
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Product Selection</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Select products from a specific category */}
        <Card>
          <CardHeader>
            <CardTitle>Category-Based Selection</CardTitle>
            <CardDescription>
              Select products from a specific category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="category-selection" onSubmit={handleSubmit}>
              <CategoryProductSelector
                selectedProducts={selectedProductsByCategory}
                onProductsChange={setSelectedProductsByCategory}
              />
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="category-selection">
              Apply Selection
            </Button>
          </CardFooter>
        </Card>
        
        {/* Select any products regardless of category */}
        <Card>
          <CardHeader>
            <CardTitle>Global Product Selection</CardTitle>
            <CardDescription>
              Select any products from any category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form id="global-selection" onSubmit={handleSubmit}>
              <ProductSelector
                selectedProducts={selectedProducts}
                onProductsChange={setSelectedProducts}
                label="Select Products"
                placeholder="Search for any product..."
              />
            </form>
          </CardContent>
          <CardFooter>
            <Button type="submit" form="global-selection">
              Apply Selection
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Selected Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">From Category:</h3>
            {selectedProductsByCategory.length > 0 ? (
              <ul className="list-disc pl-5">
                {selectedProductsByCategory.map((id) => (
                  <li key={id}>Product ID: {id}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No products selected</p>
            )}
          </div>
          
          <div>
            <h3 className="font-medium mb-2">All Products:</h3>
            {selectedProducts.length > 0 ? (
              <ul className="list-disc pl-5">
                {selectedProducts.map((id) => (
                  <li key={id}>Product ID: {id}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">No products selected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
