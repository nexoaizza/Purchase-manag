// components/orders/orders-header.tsx
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
import { Search, ArrowUpDown, Plus } from "lucide-react";
import { useState } from "react";
import { CreateOrderDialog } from "./create-order-dialog";

interface OrdersHeaderProps {
  onSearchChange: (search: string) => void;
  onStatusChange: (status: string) => void;
  onSortChange: (sort: { sortBy: string; order: string }) => void;
  isCreateDialogOpen: boolean;
  setIsCreateDialogOpen: (open: boolean) => void;
}

export function OrdersHeader({
  onSearchChange,
  onStatusChange,
  onSortChange,
  isCreateDialogOpen,
  setIsCreateDialogOpen,
}: OrdersHeaderProps) {
  const t = useTranslations("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onStatusChange(value);
  };

  const handleSortChange = (field: string) => {
    setSortBy(field);
    const newOrder = sortBy === field && order === "asc" ? "desc" : "asc";
    setOrder(newOrder);
    onSortChange({ sortBy: field, order: newOrder });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="rounded-full px-6 gap-2"
        >
          <Plus className="h-4 w-4" />
          {t("createOrder") || "Create Order"}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[180px] border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg">
              <SelectValue placeholder={t("statusLabel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allOrders")}</SelectItem>
              <SelectItem value="pending">{t("pending")}</SelectItem>
              <SelectItem value="completed">{t("completed")}</SelectItem>
              <SelectItem value="canceled">{t("canceled")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[180px] border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">{t("dateCreated")}</SelectItem>
              <SelectItem value="deadline">{t("deadline")}</SelectItem>
              <SelectItem value="orderNumber">{t("orderNumber")}</SelectItem>
              <SelectItem value="staffId.fullname">{t("assignedTo")}</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="border-2 border-input rounded-lg"
            onClick={() => {
              const newOrder = order === "asc" ? "desc" : "asc";
              setOrder(newOrder);
              onSortChange({ sortBy, order: newOrder });
            }}
          >
            <ArrowUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <CreateOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
