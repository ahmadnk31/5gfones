"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ListFilter } from "lucide-react";
import { SortOption } from "@/lib/search/filter-utils";

interface SortMenuProps {
  selectedSort: SortOption;
  onSortChange: (sortOption: SortOption) => void;
}

export function SortMenu({ selectedSort, onSortChange }: SortMenuProps) {
  const t = useTranslations("sort");

  // Get the display text for the current sort option
  const getSortDisplayText = (option: SortOption) => {
    switch (option) {
      case "newest":
        return t("newest");
      case "oldest":
        return t("oldest");
      case "priceAsc":
        return t("priceAsc");
      case "priceDesc":
        return t("priceDesc");
      case "nameAsc":
        return t("nameAsc");
      case "nameDesc":
        return t("nameDesc");
      case "relevance":
      default:
        return t("relevance");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='flex items-center gap-1'>
          <ListFilter className='h-4 w-4 mr-1' />
          {t("title")}: {getSortDisplayText(selectedSort)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-48'>
        <DropdownMenuItem onClick={() => onSortChange("relevance")}>
          {t("relevance")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("priceAsc")}>
          {t("priceAsc")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("priceDesc")}>
          {t("priceDesc")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("newest")}>
          {t("newest")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("oldest")}>
          {t("oldest")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("nameAsc")}>
          {t("nameAsc")}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange("nameDesc")}>
          {t("nameDesc")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
