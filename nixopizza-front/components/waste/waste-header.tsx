"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus, Search, X, Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IStock } from "@/lib/apis/stocks";
import { useState, useEffect, useRef } from "react";
import { getProducts } from "@/lib/apis/products";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface IProduct {
  _id: string;
  name: string;
  imageUrl?: string;
}

interface WasteHeaderProps {
  onAddClick: () => void;
  productFilter: string;
  setProductFilter: (product: string) => void;
  stockFilter: string;
  setStockFilter: (stock: string) => void;
  stocks: IStock[];
  dateRange: { from: Date | null; to: Date | null };
  setDateRange: (range: { from: Date | null; to: Date | null }) => void;
}

export function WasteHeader({
  onAddClick,
  productFilter,
  setProductFilter,
  stockFilter,
  setStockFilter,
  stocks,
  dateRange,
  setDateRange,
}: WasteHeaderProps) {
  const t = useTranslations("waste");
  const [products, setProducts] = useState<IProduct[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [selectedProductName, setSelectedProductName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
  }, [productSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    const params: any = { limit: 50 };
    if (productSearch) params.name = productSearch;
    
    const { products: fetchedProducts, success } = await getProducts(params);
    if (success) {
      setProducts(fetchedProducts || []);
    }
  };

  const handleProductSelect = (product: IProduct) => {
    setProductFilter(product._id);
    setSelectedProductName(product.name);
    setIsProductDropdownOpen(false);
    setProductSearch("");
  };

  const handleClearProduct = () => {
    setProductFilter("all");
    setSelectedProductName("");
    setProductSearch("");
  };

  const clearDateRange = () => {
    setDateRange({ from: null, to: null });
  };

  const dateLabel = dateRange.from
    ? dateRange.to
      ? `${format(dateRange.from, "dd/MM/yyyy")} – ${format(dateRange.to, "dd/MM/yyyy")}`
      : format(dateRange.from, "dd/MM/yyyy")
    : t("selectDateRange");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t("title")}
          </h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button onClick={onAddClick} size="default">
          <Plus className="mr-2 h-4 w-4" />
          {t("addWaste")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 flex-wrap">
        {/* Product filter */}
        <div className="relative flex-1 min-w-[180px]" ref={dropdownRef}>
          <div
            className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm cursor-text hover:border-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors"
            onClick={() => setIsProductDropdownOpen(true)}
          >
            {selectedProductName ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="truncate">{selectedProductName}</span>
              </div>
            ) : (
              <input
                type="text"
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProductDropdownOpen(true);
                }}
                placeholder={t("filterByProduct")}
                className="w-full bg-transparent border-none focus:outline-none focus:ring-0"
              />
            )}
            <div className="flex items-center gap-1">
              {selectedProductName && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearProduct();
                  }}
                  className="p-0.5 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <Search className="h-4 w-4 ml-1" />
            </div>
          </div>

          {isProductDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
              <div className="max-h-[200px] overflow-auto">
                <div
                  className="flex items-center gap-3 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    handleClearProduct();
                    setIsProductDropdownOpen(false);
                  }}
                >
                  <div className="flex flex-col font-medium">{t("allProducts")}</div>
                </div>
                {products && products.length > 0 ? (
                  products.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center gap-3 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex flex-col font-medium">{product.name}</div>
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                    {t("noProductsFound")}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stock filter */}
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="flex-1 min-w-[180px]">
            <SelectValue placeholder={t("filterByStock")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStocks")}</SelectItem>
            {stocks.map((stock) => (
              <SelectItem key={stock._id} value={stock._id}>
                {stock.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date range filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "flex-1 min-w-[220px] justify-start text-left font-normal",
                !dateRange.from && !dateRange.to && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              <span className="truncate">{dateLabel}</span>
              {(dateRange.from || dateRange.to) && (
                <X
                  className="ml-auto h-4 w-4 shrink-0 opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearDateRange();
                  }}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from ?? undefined, to: dateRange.to ?? undefined }}
              onSelect={(range) =>
                setDateRange({ from: range?.from ?? null, to: range?.to ?? null })
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
