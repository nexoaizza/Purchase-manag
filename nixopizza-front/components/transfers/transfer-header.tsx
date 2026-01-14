"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IStock } from "@/lib/apis/stocks";

interface TransferHeaderProps {
  onAddClick: () => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  fromStockFilter: string;
  setFromStockFilter: (stock: string) => void;
  toStockFilter: string;
  setToStockFilter: (stock: string) => void;
  stocks: IStock[];
}

export function TransferHeader({
  onAddClick,
  statusFilter,
  setStatusFilter,
  fromStockFilter,
  setFromStockFilter,
  toStockFilter,
  setToStockFilter,
  stocks,
}: TransferHeaderProps) {
  const t = useTranslations("transfers");

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
          {t("addTransfer")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t("filterByStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatuses")}</SelectItem>
            <SelectItem value="pending">{t("pending")}</SelectItem>
            <SelectItem value="arrived">{t("arrived")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={fromStockFilter} onValueChange={setFromStockFilter}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t("filterByFromStock")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("fromAll")}</SelectItem>
            {stocks.map((stock) => (
              <SelectItem key={stock._id} value={stock._id}>
                {stock.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={toStockFilter} onValueChange={setToStockFilter}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder={t("filterByToStock")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("toAll")}</SelectItem>
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
