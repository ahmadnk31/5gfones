"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface SearchResult {
  id: number;
  name: string;
  image_url: string | null;
  price: number;
  category_name?: string;
  similarity?: number;
}

const SearchBar = () => {
  const t = useTranslations("search");
  const router = useRouter();
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearching(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Vector search functionality
  const searchProducts = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      // Try vector search if available
      try {
        const { data: vectorResults, error: vectorError } = await supabase.rpc(
          "search_products_vector",
          { query_text: searchQuery, match_limit: 6 }
        );

        if (!vectorError && vectorResults && vectorResults.length > 0) {
          setResults(vectorResults);
          setIsLoading(false);
          return;
        }
      } catch (err) {
        console.log("Vector search unavailable, falling back to text search");
      }

      // Fall back to regular text search
      const { data: textResults, error } = await supabase
        .from("products")
        .select("id, name, image_url, base_price as price, categories(name)")
        .textSearch("name", searchQuery, {
          type: "websearch",
          config: "english",
        })
        .limit(6);

      if (error) {
        console.error("Error searching products:", error);
        setResults([]);
      } else {
        setResults(
          textResults.map((item) => ({
            id: item.id,
            name: item.name,
            image_url: item.image_url,
            price: item.price,
            category_name: item.categories?.name,
          }))
        );
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query && isSearching) {
        searchProducts(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isSearching]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(false);
      router.push(`/en/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div ref={searchRef} className='relative max-w-md w-full'>
      <form onSubmit={handleSearch} className='relative'>
        <input
          type='text'
          placeholder={t("placeholder")}
          className='w-full border border-gray-300 rounded-md pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsSearching(true)}
        />
        <Search className='absolute left-3 top-2.5 h-5 w-5 text-gray-400' />
        {query && (
          <button
            type='button'
            onClick={() => {
              setQuery("");
              setResults([]);
            }}
            className='absolute right-3 top-2.5'
          >
            <X className='h-5 w-5 text-gray-400' />
          </button>
        )}
      </form>

      {/* Search results dropdown */}
      {isSearching && (query || results.length > 0) && (
        <div className='absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-auto'>
          {isLoading ? (
            <div className='p-4 text-center text-gray-500'>
              {t("searching")}
            </div>
          ) : results.length > 0 ? (
            <div>
              <div className='p-2 text-xs text-gray-500 font-medium border-b'>
                {t("suggestions")}
              </div>
              <ul>
                {results.map((product) => (
                  <li key={product.id} className='border-b last:border-b-0'>
                    <Link
                      href={`/en/products/${product.id}`}
                      className='flex items-center p-2 hover:bg-gray-50'
                      onClick={() => setIsSearching(false)}
                    >
                      <div className='h-12 w-12 relative flex-shrink-0'>
                        <Image
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className='object-cover rounded'
                          sizes='48px'
                        />
                      </div>
                      <div className='ml-3 overflow-hidden'>
                        <p className='text-sm font-medium text-gray-900 truncate'>
                          {product.name}
                        </p>
                        <p className='text-sm text-gray-500'>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: "USD",
                          }).format(product.price)}
                          {product.category_name &&
                            ` · ${product.category_name}`}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className='p-2 border-t'>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setIsSearching(false);
                    router.push(
                      `/en/search?q=${encodeURIComponent(query.trim())}`
                    );
                  }}
                  className='w-full text-center text-sm text-blue-600 hover:text-blue-800 py-1'
                >
                  View all results
                </button>
              </div>
            </div>
          ) : query ? (
            <div className='p-4 text-center text-gray-500'>
              {t("noResults")}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
