/**
 * Product recommendation utility for the FinOpenPOS system
 * This module provides functions to recommend related products based on
 * various factors like category, brand, price range, etc.
 */

/**
 * Interface for a product that can be used for recommendation
 */
export interface RecommendableProduct {
  id: number;
  name: string;
  base_price: number;
  brands?: { id: number; name: string } | null;
  categories?: { id: number; name: string } | null;
  in_stock: number;
  image_url?: string;
  variant_count?: number;
  // Can be expanded with other properties like tags, views, etc.
}

/**
 * Calculate a similarity score between two products
 * Higher score means more similar products
 *
 * @param product1 The reference product
 * @param product2 The product to compare against
 * @returns A similarity score between 0 and 1
 */
export function calculateSimilarityScore(
  product1: RecommendableProduct,
  product2: RecommendableProduct
): number {
  if (product1.id === product2.id) return 0; // Don't recommend the same product

  let score = 0;

  // Category match (highest weight)
  if (product1.categories?.id === product2.categories?.id) {
    score += 0.5;
  } else {
    // Even if categories don't exactly match, there might be some similarity
    // For example, different types of phone cases might be in different categories
    // but still related in terms of function
    if (
      product1.categories?.name
        ?.toLowerCase()
        .includes(product2.categories?.name?.toLowerCase() || "") ||
      product2.categories?.name
        ?.toLowerCase()
        .includes(product1.categories?.name?.toLowerCase() || "")
    ) {
      score += 0.2;
    }
  }

  // Brand match (significant weight)
  if (product1.brands?.id === product2.brands?.id) {
    score += 0.3;
  }

  // Price similarity (products in similar price range)
  const priceRatio =
    Math.min(product1.base_price, product2.base_price) /
    Math.max(product1.base_price, product2.base_price);

  // Close price range increases similarity
  if (priceRatio > 0.8) {
    score += 0.2; // Very similar price
  } else if (priceRatio > 0.6) {
    score += 0.15; // Somewhat similar price
  } else if (priceRatio > 0.4) {
    score += 0.1; // Moderately different price
  }

  // Bonus for complementary price points
  // More expensive products might complement cheaper ones (accessory relationship)
  if (product1.base_price > product2.base_price * 3) {
    score += 0.05; // Product 1 might be a primary item that product 2 accessorizes
  } else if (product2.base_price > product1.base_price * 3) {
    score += 0.05; // Product 2 might be a primary item that product 1 accessorizes
  }

  return score;
}

/**
 * Get related products based on similarity score
 *
 * @param product The reference product
 * @param allProducts All available products to choose from
 * @param limit Maximum number of recommendations to return
 * @returns Array of recommended products sorted by relevance
 */
export function getRelatedProducts(
  product: RecommendableProduct,
  allProducts: RecommendableProduct[],
  limit: number = 4
): RecommendableProduct[] {
  if (!product || !allProducts || allProducts.length === 0) {
    return [];
  }

  // Calculate similarity scores for all products
  const productsWithScores = allProducts
    .filter((p) => p.id !== product.id) // Exclude the current product
    .map((p) => ({
      product: p,
      score: calculateSimilarityScore(product, p),
    }));

  // Sort by similarity score (highest first)
  productsWithScores.sort((a, b) => b.score - a.score);

  // Return the top N most similar products
  return productsWithScores.slice(0, limit).map((item) => item.product);
}

/**
 * Get products that are frequently bought together
 * This is a placeholder for a more sophisticated implementation that would
 * use actual purchase data from the database
 *
 * @param productId The product ID to find companions for
 * @param allProducts All available products
 * @param limit Maximum number of products to return
 * @returns Array of products often bought with the given product
 */
export function getFrequentlyBoughtTogether(
  productId: number,
  allProducts: RecommendableProduct[],
  limit: number = 3
): RecommendableProduct[] {
  // In a production system, this would query purchase history data
  // to find actual products that are frequently purchased together
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return [];

  // Calculate a "complementary score" for each product
  const productsWithScores = allProducts
    .filter((p) => p.id !== productId) // Don't include the current product
    .map((p) => {
      let score = 0;

      // Same brand but different category suggests accessory relationship
      if (
        p.brands?.id === product.brands?.id &&
        p.categories?.id !== product.categories?.id
      ) {
        score += 50;
      }

      // Different brand but same category suggests alternatives/competitors
      if (
        p.brands?.id !== product.brands?.id &&
        p.categories?.id === product.categories?.id
      ) {
        score += 20;
      }

      // Price relationship - accessories are typically cheaper than the main product
      if (p.base_price < product.base_price * 0.5) {
        score += 30; // Likely an accessory
      }

      // Small price increase suggests an upgrade/better version
      if (
        p.base_price > product.base_price &&
        p.base_price < product.base_price * 1.5
      ) {
        score += 15;
      }

      // In-stock items are prioritized
      score += Math.min(p.in_stock, 10) * 2;

      return { product: p, score };
    })
    .sort((a, b) => b.score - a.score); // Sort by score (highest first)

  // Return the top complementary products
  return productsWithScores.slice(0, limit).map((item) => item.product);
}

/**
 * Get recently viewed products for the user
 * In a real implementation, this would utilize localStorage or a server-side session
 *
 * @param currentProductId The current product ID to exclude
 * @param allProducts All available products
 * @param limit Maximum number of products to return
 * @returns Array of recently viewed products
 */
export function getRecentlyViewedProducts(
  currentProductId: number,
  allProducts: RecommendableProduct[],
  limit: number = 5
): RecommendableProduct[] {
  // In a real system, we would fetch this from localStorage or user session
  // For now, let's simulate it with a random selection excluding the current product

  // Filter out the current product
  const otherProducts = allProducts.filter((p) => p.id !== currentProductId);

  // Sort randomly to simulate different viewing history
  // In a real implementation, we would sort by actual view timestamp
  return otherProducts.sort(() => 0.5 - Math.random()).slice(0, limit);
}
