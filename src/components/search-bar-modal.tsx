"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { vectorSearchProducts } from "@/lib/search/vector-search";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";

interface SearchResult {
  id: number;
  name: string;
  image_url: string | null;
  price: number;
  category_name?: string;
  similarity?: number;
}

interface SearchBarModalProps {
  iconOnly?: boolean;
}

const SearchBarModal = ({ iconOnly = false }: SearchBarModalProps) => {
  const t = useTranslations("search");
  const router = useRouter();

  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  // We're no longer using different layouts based on screen size
  // const isMobile = useMediaQuery("(max-width: 768px)");

  // Close search results when clicking outside (we're no longer using dropdown)
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
  // Import the vector search functionality

  // Enhanced search functionality with vector search
  const searchProducts = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    try {
      // Use our vector search utility function
      const searchResults = await vectorSearchProducts(searchQuery, {
        limit: 6,
        threshold: 0.4, // Lower threshold for more inclusive results
      });

      if (searchResults && searchResults.length > 0) {
        // Map the results to our expected format
        setResults(
          searchResults.map((item) => ({
            id: item.id,
            name: item.name,
            image_url: item.image_url,
            price: item.price,
            category_name: item.category_name,
            similarity: item.similarity,
          }))
        );
        setIsLoading(false);
        return;
      }

      // If no vector search results, fall back to regular text search
      const { data: textResults, error } = await supabase
        .from("products")
        .select("id, name, image_url, base_price, categories(name)")
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
            price: item.base_price,
            category_name: item.categories?.name
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
      if (query && (isSearching || isOpen)) {
        searchProducts(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isSearching, isOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearching(false);
      setIsOpen(false);
      router.push(`/en/search?q=${encodeURIComponent(query.trim())}`);
    }
  };
  const handleDialogChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      // Focus the input when the dialog opens
      setTimeout(() => {
        const input = document.getElementById('search-input');
        if (input) {
          input.focus();
        }
      }, 100);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
  };  const renderSearchResults = () => (
    <div className='bg-white w-full rounded-md'>
      {isLoading ? (
        <div className='p-6 text-center text-gray-500 flex flex-col items-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-emerald-600 mb-2'></div>
          {t("searching")}
        </div>
      ) : results.length > 0 ? (
        <div>
          <div className='px-3 py-2 text-sm text-gray-500 font-medium border-b bg-gray-50'>
            {t("suggestions")}
          </div>
          <ul className='max-h-[60vh] overflow-auto'>
            {results.map((product) => (
              <li
                key={product.id}
                className='border-b last:border-b-0 transition-colors duration-200'
              >
                <Link
                  href={`/en/products/${product.id}`}
                  className='flex items-center p-4 hover:bg-emerald-50'
                  onClick={() => {
                    setIsSearching(false);
                    setIsOpen(false);
                  }}
                >
                  <div className='h-16 w-16 relative flex-shrink-0'>
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className='object-cover rounded shadow-sm'
                      sizes='64px'
                    />
                  </div>
                  <div className='ml-4 overflow-hidden flex-1'>
                    <p className='text-sm font-medium text-gray-900 truncate'>
                      {product.name}
                    </p>
                    <p className='text-sm text-gray-500 mt-1 flex justify-between'>
                      <span className='font-semibold text-emerald-700'>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: "USD",
                        }).format(product.price)}
                      </span>
                      {product.category_name && (
                        <span className='text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full'>
                          {product.category_name}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className='p-4 border-t'>
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsSearching(false);
                setIsOpen(false);
                router.push(`/en/search?q=${encodeURIComponent(query.trim())}`);
              }}
              className='w-full text-center text-sm bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md transition-colors duration-200'
            >
              {t("viewAllResults")}
            </button>
          </div>
        </div>
      ) : query ? (
        <div className='p-8 text-center text-gray-500 flex flex-col items-center'>
          <Search className='h-10 w-10 text-gray-300 mb-2' />
          <p className='mb-1'>{t("noResults")}</p>
          <p className='text-sm text-gray-400'>{t("tryDifferentSearch")}</p>
        </div>
      ) : null}
    </div>
  );  // Fullscreen search dialog for all devices
  return (
    <div className='w-full'>
      <Dialog open={isOpen} onOpenChange={handleDialogChange}>
        <DialogTrigger asChild>
          {iconOnly ? (
            <Button
              variant='ghost'
              size='icon'
              className='text-gray-700 hover:bg-gray-100'
            >
              <Search className='h-5 w-5' />
            </Button>
          ) : (
            <Button
              variant='outline'
              className='relative w-full pl-10 justify-start text-left text-muted-foreground font-normal border border-gray-300 rounded-md h-10 hover:bg-gray-50 transition-colors duration-200'
            >
              <Search className='absolute left-3 h-5 w-5 text-gray-400' />
              <span className='truncate'>{t("placeholder")}</span>
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className='max-w-4xl p-0 max-h-[90vh] overflow-hidden'>
          <div className='p-3 border-b sticky top-0 bg-white z-10'>
            <form onSubmit={handleSearch} className='relative'>
              <input
                id='search-input'
                type='text'
                placeholder={t("placeholder")}
                className='w-full border border-gray-300 rounded-md pl-10 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200'
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete='off'
                onClick={(e) => e.currentTarget.focus()}
              />
              <Search className='absolute left-3 top-2.5 h-5 w-5 text-gray-400' />
              {query && (
                <button
                  type='button'
                  onClick={clearSearch}
                  className='absolute right-3 top-2.5 transition-opacity duration-200'
                >
                  <X className='h-5 w-5 text-gray-400 hover:text-gray-700' />
                </button>
              )}
            </form>
          </div>
          {renderSearchResults()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SearchBarModal;
