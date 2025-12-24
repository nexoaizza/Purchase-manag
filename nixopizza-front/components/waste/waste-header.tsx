"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IStock } from "@/lib/apis/stocks";

interface WasteHeaderProps {
  onAddClick: () => void;
  search: string;
  setSearch: (search: string) => void;
  reasonFilter: string;
  setReasonFilter: (reason: string) => void;
  stockFilter: string;
  setStockFilter: (stock: string) => void;
  stocks: IStock[];
}

export function WasteHeader({
  onAddClick,
  search,
  setSearch,
  reasonFilter,
  setReasonFilter,
  stockFilter,
  setStockFilter,
  stocks,
}: WasteHeaderProps) {
  const t = useTranslations("waste");

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

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={reasonFilter} onValueChange={setReasonFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder={t("filterByReason")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allReasons")}</SelectItem>
            <SelectItem value="expired">{t("expired")}</SelectItem>
            <SelectItem value="damaged">{t("damaged")}</SelectItem>
            <SelectItem value="spoiled">{t("spoiled")}</SelectItem>
            <SelectItem value="other">{t("other")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={setStockFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
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
      </div>
    </div>
  );
}
