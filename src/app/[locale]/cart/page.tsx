'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/lib/cart-provider';
import { Button } from '@/components/ui/button';
import { Trash, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Cart() {
  const t = useTranslations('cart');
  const { items, removeItem, updateQuantity, subtotal, itemCount } = useCart();
  
  // Calculate shipping cost (free if subtotal is >= $50, otherwise $5.99)
  const shippingCost = subtotal >= 50 ? 0 : 5.99;
  
  // Calculate tax (assume 8% tax rate)
  const taxRate = 0.08;
  const taxAmount = subtotal * taxRate;
  
  // Calculate total
  const total = subtotal + shippingCost + taxAmount;
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto my-12 px-4 max-w-6xl">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('title')}</h1>
        <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-lg">
          <div className="rounded-full bg-gray-100 p-4 mb-4">
            <ShoppingBag className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t('empty')}</h2>
          <p className="text-gray-500 mb-6">{t('continueShoppingText')}</p>
          <Link href="/en/products">
            <Button>{t('continueShoppingBtn')}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto my-8 px-4 max-w-6xl">
      <h1 className="text-2xl md:text-3xl font-bold mb-6">{t('title')}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm">
            {items.map((item) => (
              <div 
                key={`${item.product_id}-${item.variant_id || 'no-variant'}`} 
                className="flex flex-col sm:flex-row p-4 border-b last:border-b-0"
              >
                <div className="sm:w-24 sm:h-24 h-32 w-full relative mb-4 sm:mb-0">
                  <Image
                    src={item.image_url || '/placeholder.svg'}
                    alt={item.name}
                    fill
                    className="object-cover rounded"
                    sizes="(max-width: 768px) 100vw, 96px"
                  />
                </div>
                <div className="flex-grow sm:ml-4 flex flex-col sm:flex-row sm:justify-between">
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    {item.variant_name && (
                      <p className="text-sm text-gray-600">
                        {item.variant_name}: {item.variant_value}
                      </p>
                    )}
                    <p className="font-medium text-blue-600 mt-1">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  
                  <div className="mt-4 sm:mt-0 flex items-center justify-between sm:flex-col sm:items-end">
                    <div className="flex items-center border rounded">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1, item.variant_id)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="px-4 py-1">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1, item.variant_id)}
                        className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.product_id, item.variant_id)}
                      className="text-red-500 hover:text-red-700 mt-2 sm:mt-4"
                      aria-label="Remove item"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Link href="/en/products">
              <Button variant="outline" className="text-sm">
                {t('continueShoppingBtn')}
              </Button>
            </Link>
          </div>
        </div>
        
        {/* Order summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">{t('orderSummary')}</h2>
              
              <div className="space-y-3">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">{t('itemCount', { count: itemCount })}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">{t('shipping')}</span>
                  <span>
                    {shippingCost === 0 
                      ? 'Free' 
                      : formatCurrency(shippingCost)
                    }
                  </span>
                </div>
                
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">{t('tax')}</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between font-bold">
                    <span>{t('total')}</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Link href="/en/checkout">
                  <Button className="w-full">{t('checkout')}</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
