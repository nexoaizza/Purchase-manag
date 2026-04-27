"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { getTasks } from "@/lib/apis/task";
import { getTransfers } from "@/lib/apis/transfers";
import { getOrders } from "@/lib/apis/purchase-list";
import { getWastes } from "@/lib/apis/waste";
import { getProducts } from "@/lib/apis/products";
import { getStocks } from "@/lib/apis/stocks";
import { get_all_suppliers } from "@/lib/apis/suppliers";
import { getStuff } from "@/lib/apis/stuff";

type Category = "tasks" | "transfers" | "purchases" | "waste" | "products" | "stocks" | "suppliers" | "staff";

function objectsToCSV(data: any[]): string {
  if (!data || data.length === 0) return "";
  const flattenObject = (obj: any, prefix = ""): Record<string, string> => {
    return Object.keys(obj).reduce((acc: Record<string, string>, key) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const val = obj[key];
      if (val !== null && val !== undefined && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
        Object.assign(acc, flattenObject(val, fullKey));
      } else if (Array.isArray(val)) {
        acc[fullKey] = val.map((v: any) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join("; ");
      } else {
        acc[fullKey] = val !== null && val !== undefined ? String(val) : "";
      }
      return acc;
    }, {});
  };

  const rows = data.map((item) => flattenObject(item));
  const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
  const csvRows = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row) =>
      headers.map((h) => `"${(row[h] || "").replace(/"/g, '""')}"`).join(",")
    ),
  ];
  return csvRows.join("\n");
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function fetchCategoryData(category: Category): Promise<any[]> {
  switch (category) {
    case "tasks": {
      const res = await getTasks({ limit: 10000, page: 1 });
      return res.success ? res.tasks || [] : [];
    }
    case "transfers": {
      const res = await getTransfers({ limit: 10000, page: 1 });
      return res.success ? res.transfers || [] : [];
    }
    case "purchases": {
      const res = await getOrders({ limit: 10000, page: 1 });
      return res.success ? res.orders || [] : [];
    }
    case "waste": {
      const res = await getWastes({ limit: 10000, page: 1 });
      return res.success ? res.wastes || [] : [];
    }
    case "products": {
      const res = await getProducts({ limit: 10000, page: 1 });
      return res.success ? res.products || [] : [];
    }
    case "stocks": {
      const res = await getStocks({ limit: 10000, page: 1 });
      return res.success ? res.stocks || [] : [];
    }
    case "suppliers": {
      const res = await get_all_suppliers({ limit: 10000, page: 1 });
      return res?.suppliers || [];
    }
    case "staff": {
      const res = await getStuff({ limit: 10000, page: 1 } as any);
      return res.success ? res.staffs || [] : [];
    }
    default:
      return [];
  }
}

const CATEGORIES: { key: Category; icon: string }[] = [
  { key: "tasks", icon: "📋" },
  { key: "transfers", icon: "🔄" },
  { key: "purchases", icon: "🛒" },
  { key: "waste", icon: "🗑️" },
  { key: "products", icon: "📦" },
  { key: "stocks", icon: "🏭" },
  { key: "suppliers", icon: "🤝" },
  { key: "staff", icon: "👥" },
];

export default function ExportDataPage() {
  const t = useTranslations("exportData");
  const [selected, setSelected] = useState<Set<Category>>(new Set());
  const [exporting, setExporting] = useState(false);

  const toggle = (key: Category) => {
    setSelected((prev: Set<Category>) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(CATEGORIES.map((c) => c.key)));
  const clearAll = () => setSelected(new Set());

  const handleExport = async () => {
    if (selected.size === 0) {
      toast.error(t("selectAtLeastOne"));
      return;
    }

    setExporting(true);
    try {
      const timestamp = new Date().toISOString().slice(0, 10);
      let exportedCount = 0;

      for (const category of selected) {
        const data = await fetchCategoryData(category);
        if (data.length === 0) continue;
        const csv = objectsToCSV(data);
        downloadCSV(csv, `${category}-${timestamp}.csv`);
        exportedCount++;
      }

      if (exportedCount === 0) {
        toast.error(t("noData"));
      } else {
        toast.success(t("exportSuccess"));
      }
    } catch (err) {
      console.error("Export error:", err);
      toast.error(t("exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("selectCategories")}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {t("selectAll")}
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll}>
                  {t("clearAll")}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {CATEGORIES.map(({ key, icon }) => (
                <div
                  key={key}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    selected.has(key)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-muted-foreground/40"
                  }`}
                  onClick={() => toggle(key)}
                >
                  <Checkbox
                    id={key}
                    checked={selected.has(key)}
                    onCheckedChange={() => toggle(key)}
                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                  />
                  <Label htmlFor={key} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                    <span className="text-lg">{icon}</span>
                    {t(key as any)}
                  </Label>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selected.size === 1 ? t("categorySelected", { count: 1 }) : t("categoriesSelected", { count: selected.size })}
              </p>
              <Button
                onClick={handleExport}
                disabled={exporting || selected.size === 0}
                size="lg"
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {exporting ? t("exporting") : t("exportButton")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
