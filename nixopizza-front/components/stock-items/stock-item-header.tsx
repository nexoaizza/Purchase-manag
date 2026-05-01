"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { AddStockItemDialog } from "./add-stock-item-dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStocks } from "@/lib/apis/stocks";
import { getCategories } from "@/lib/apis/categories";

export function StockItemHeader({
  onProductNameChange,
  onCategoryChange,
  onStockChange,
  onExpirationStatusChange,
  onMinPriceChange,
  onMaxPriceChange,
  onStockItemCreated,
  categoryFilter,
  setCategoryFilter,
}: {
  onProductNameChange: (productName: string) => void;
  onCategoryChange: (category: string) => void;
  onStockChange: (stock: string) => void;
  onExpirationStatusChange: (status: string) => void;
  onMinPriceChange: (minPrice: string) => void;
  onMaxPriceChange: (maxPrice: string) => void;
  onStockItemCreated: () => void;
  categoryFilter: string;
  setCategoryFilter: (category: string) => void;
}) {
  const t = useTranslations("stockItems");
  const [productName, setProductName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStock, setSelectedStock] = useState("");
  const [expirationStatus, setExpirationStatus] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [stocks, setStocks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchStocks();
    fetchCategories();
  }, []);

  const fetchStocks = async () => {
    const { success, stocks: fetchedStocks } = await getStocks({ limit: 1000 });
    if (success) {
      setStocks(fetchedStocks);
    }
  };

  const fetchCategories = async () => {
    const { success, categories: fetchedCategories } = await getCategories({ limit: 1000 } as any);
    if (success) {
      setCategories(fetchedCategories || []);
    }
  };

  const handleProductNameChange = (value: string) => {
    setProductName(value);
    onProductNameChange(value);
  };

  const handleStockChange = (value: string) => {
    setSelectedStock(value);
    onStockChange(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    onCategoryChange(value);
  };

  const handleExpirationStatusChange = (value: string) => {
    setExpirationStatus(value);
    onExpirationStatusChange(value);
  };

  const handleMinPriceChange = (value: string) => {
    if (value === "") {
      setMinPrice("");
      onMinPriceChange("");
      return;
    }
    if (Number(value) < 0) return;
    setMinPrice(value);
    onMinPriceChange(value);
  };

  const handleMaxPriceChange = (value: string) => {
    if (value === "") {
      setMaxPrice("");
      onMaxPriceChange("");
      return;
    }
    if (Number(value) < 0) return;
    setMaxPrice(value);
    onMaxPriceChange(value);
  };

  const handleStockItemCreated = () => {
    setDialogOpen(false);
    fetchStocks();
    onStockItemCreated();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          {t("addStockItem")}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={productName}
            onChange={(e) => handleProductNameChange(e.target.value)}
            className="pl-10 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
        <Select value={selectedStock} onValueChange={handleStockChange}>
          <SelectTrigger className="flex-1 border-2 border-input focus:ring-2 focus:ring-primary/30">
            <SelectValue placeholder={t("selectStock")} />
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
        <Select value={categoryFilter || selectedCategory} onValueChange={(val) => { setCategoryFilter(val); handleCategoryChange(val); }}>
          <SelectTrigger className="flex-1 border-2 border-input focus:ring-2 focus:ring-primary/30">
            <SelectValue placeholder={t("selectCategory")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allCategories")}</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category._id} value={category._id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={expirationStatus} onValueChange={handleExpirationStatusChange}>
          <SelectTrigger className="flex-1 border-2 border-input focus:ring-2 focus:ring-primary/30">
            <SelectValue placeholder={t("expirationStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allItems")}</SelectItem>
            <SelectItem value="fresh">{t("fresh")}</SelectItem>
            <SelectItem value="expiring-soon">{t("expiringSoon")}</SelectItem>
            <SelectItem value="expired">{t("expired")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full lg:w-[18rem]">
          <Input
            type="number"
            min={0}
            placeholder={t("minPrice")}
            value={minPrice}
            onChange={(e) => handleMinPriceChange(e.target.value)}
            className="border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30"
          />
          <Input
            type="number"
            min={0}
            placeholder={t("maxPrice")}
            value={maxPrice}
            onChange={(e) => handleMaxPriceChange(e.target.value)}
            className="border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
      </div>

      <AddStockItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStockItemCreated={handleStockItemCreated}
      />
    </div>
  );
}
