import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveImage } from "@/lib/resolveImage";
import { Search, X } from "lucide-react";

interface StockItem {
  _id: string;
  product?: {
    name: string;
    imageUrl?: string;
    barcode?: string;
  };
  quantity: number;
}

interface Props {
  stockItems: StockItem[];
  selectedStockItem: StockItem | null;
  onSelect: (item: StockItem | null) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  selectedItemIds?: Set<string>;
}

export function StockItemSelect({
  stockItems,
  selectedStockItem,
  onSelect,
  placeholder = "Select product...",
  className,
  isLoading = false,
  disabled = false,
  onLoadMore,
  hasMore = false,
  selectedItemIds = new Set(),
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: StockItem) => {
    onSelect(item);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null);
    setSearchTerm("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchTerm(e.target.value);

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (!disabled && !isOpen) setIsOpen(true);
  };

  const handleDropdownScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (
      hasMore &&
      onLoadMore &&
      target.scrollTop + target.clientHeight >= target.scrollHeight - 24
    ) {
      onLoadMore();
    }
  };

  const filteredStockItems = stockItems.filter((item) => {
    const productName = item.product?.name || "Unknown";
    const matchesSearch = searchTerm.trim() === "" ||
      productName.toLowerCase().includes(searchTerm.toLowerCase());
    const isNotAlreadySelected = item._id === selectedStockItem?._id ||
      !selectedItemIds.has(item._id);
    return matchesSearch && isNotAlreadySelected;
  });

  if (isLoading && stockItems.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md border bg-background px-3 py-2 text-sm",
          className
        )}
      >
        <span className="text-muted-foreground">Loading products...</span>
      </div>
    );
  }

  const displayName = selectedStockItem?.product?.name || "";

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <div
        className={cn(
          "flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-text hover:border-accent hover:text-accent-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "transition-colors"
        )}
        onClick={() => {
          if (disabled) return;
          setIsOpen(true);
          if (selectedStockItem) {
            setSearchTerm(displayName);
          }
        }}
      >
        {selectedStockItem && !searchTerm ? (
          <div className="flex items-center gap-2">
            {selectedStockItem.product?.imageUrl ? (
              <img
                src={resolveImage(selectedStockItem.product.imageUrl)}
                alt={displayName}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs font-medium">
                  {displayName.charAt(0)}
                </span>
              </div>
            )}
            <span className="truncate">{displayName} — Qty: {selectedStockItem.quantity}</span>
          </div>
        ) : (
          <input
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onClick={handleInputClick}
            placeholder={selectedStockItem ? displayName : placeholder}
            className={cn(
              "w-full bg-transparent border-none focus:outline-none focus:ring-0",
              disabled && "cursor-not-allowed"
            )}
            disabled={disabled}
          />
        )}

        <div className="flex items-center gap-1">
          {selectedStockItem && !searchTerm && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                "p-0.5 rounded-full hover:bg-muted",
                disabled && "pointer-events-none opacity-50"
              )}
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <Search className="h-4 w-4 ml-1" />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          <div
            ref={dropdownRef}
            className="max-h-60 overflow-auto"
            onScroll={handleDropdownScroll}
          >
            {filteredStockItems && filteredStockItems.length > 0 ? (
              <>
                {filteredStockItems.map((stockItem) => {
                  const productName = stockItem.product?.name || "Unknown";
                  const productImage = stockItem.product?.imageUrl;
                  const barcode = stockItem.product?.barcode;

                  return (
                    <div
                      key={stockItem._id}
                      className={cn(
                        "flex items-center gap-3 rounded-sm px-2 py-1.5 text-sm",
                        "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                        selectedStockItem?._id === stockItem._id && "bg-accent"
                      )}
                      onClick={() => handleSelect(stockItem)}
                    >
                      {productImage ? (
                        <img
                          src={resolveImage(productImage)}
                          alt={productName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {productName.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">{productName} — Qty: {stockItem.quantity}</span>
                        {barcode && (
                          <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {barcode}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="px-2 py-2 text-xs text-muted-foreground">
                    Loading more...
                  </div>
                )}
              </>
            ) : (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                {searchTerm ? "No matching products found" : "No products available"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}