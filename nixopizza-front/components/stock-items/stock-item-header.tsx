"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { AddStockItemDialog } from "./add-stock-item-dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";
import { getStocks } from "@/lib/apis/stocks";

export function StockItemHeader({
  onProductNameChange,
  onStockChange,
  onExpirationStatusChange,
  onStockItemCreated,
}: {
  onProductNameChange: (productName: string) => void;
  onStockChange: (stock: string) => void;
  onExpirationStatusChange: (status: string) => void;
  onStockItemCreated: () => void;
}) {
  const t = useTranslations("stockItems");
  const [productName, setProductName] = useState("");
  const [selectedStock, setSelectedStock] = useState("");
  const [expirationStatus, setExpirationStatus] = useState("");
  const [stocks, setStocks] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    const { success, stocks: fetchedStocks } = await getStocks({ limit: 1000 });
    if (success) {
      setStocks(fetchedStocks);
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

  const handleExpirationStatusChange = (value: string) => {
    setExpirationStatus(value);
    onExpirationStatusChange(value);
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
      </div>

      <AddStockItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStockItemCreated={handleStockItemCreated}
      />
    </div>
  );
}
