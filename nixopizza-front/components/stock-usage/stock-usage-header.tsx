"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface StockUsageHeaderProps {
  productFilter: string;
  setProductFilter: (product: string) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
}

export function StockUsageHeader({
  productFilter,
  setProductFilter,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
}: StockUsageHeaderProps) {
  const handleClearProduct = () => {
    setProductFilter("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Stock Usage
          </h2>
          <p className="text-muted-foreground">Track and filter utilized products.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Product Filter */}
        <div className="relative flex-1">
          <Input
            type="text"
            value={productFilter === "all" ? "" : productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value);
            }}
            placeholder="Filter by product name..."
            className="pr-10"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          {productFilter && productFilter !== "all" && (
            <button
              onClick={handleClearProduct}
              className="absolute inset-y-0 right-8 flex items-center pr-1 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Date Filter From */}
        <div className="flex-1">
          <Input 
            type="date" 
            value={dateFrom} 
            onChange={(e) => setDateFrom(e.target.value)} 
            placeholder="From Date"
            title="From Date"
            className="w-full"
          />
        </div>

        {/* Date Filter To */}
        <div className="flex-1">
          <Input 
            type="date" 
            value={dateTo} 
            onChange={(e) => setDateTo(e.target.value)} 
            placeholder="To Date"
            title="To Date"
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
