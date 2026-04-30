// components/stuff/stuff-header.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { AddStuffDialog } from "./add-stuff-dialog";
import { IUser } from "@/store/user.store";

export function StuffHeader({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  addNewStuff,
}: {
  searchQuery: string;
  onSearchChange: (search: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  addNewStuff: (newStuff: IUser) => void;
}) {
  const t = useTranslations("staff");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <AddStuffDialog addNewStuff={addNewStuff} />
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[180px] border-2 border-input focus:ring-2 focus:ring-primary/30">
            <SelectValue placeholder={t("status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStaff")}</SelectItem>
            <SelectItem value="active">{t("activeStatus")}</SelectItem>
            <SelectItem value="inactive">{t("inactiveStatus")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
