"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { AddStockDialog } from "./add-stock-dialog";
import { getStocks } from "@/lib/apis/stocks";

export function StockHeader({
  onLocationChange,
  onItemNameChange,
  onStockCreated,
}: {
  onLocationChange: (location: string) => void;
  onItemNameChange: (itemName: string) => void;
  onStockCreated: () => void;
}) {
  const t = useTranslations("stocks");
  const [itemNameSearch, setItemNameSearch] = useState("");
  const [location, setLocation] = useState("");
  const [locations, setLocations] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    const { success, stocks } = await getStocks({ limit: 1000 });
    if (success) {
      // Extract unique locations
      const uniqueLocations = Array.from(
        new Set(stocks.map((stock: any) => stock.location))
      ).filter(Boolean) as string[];
      setLocations(uniqueLocations);
    }
  };

  const handleItemNameChange = (value: string) => {
    setItemNameSearch(value);
    onItemNameChange(value);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    onLocationChange(value);
  };

  const handleStockCreated = () => {
    setDialogOpen(false);
    fetchLocations(); // Refresh locations after creating new stock
    onStockCreated();
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
          {t("addStock")}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("itemNamePlaceholder")}
            value={itemNameSearch}
            onChange={(e) => handleItemNameChange(e.target.value)}
            className="pl-10 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
        <Select value={location} onValueChange={handleLocationChange}>
          <SelectTrigger className="flex-1 border-2 border-input focus:ring-2 focus:ring-primary/30">
            <SelectValue placeholder={t("selectLocation")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allLocations")}</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AddStockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStockCreated={handleStockCreated}
      />
    </div>
  );
}
