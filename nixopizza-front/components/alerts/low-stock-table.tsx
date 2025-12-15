"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  AlertTriangle,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import { IProduct } from "@/app/[locale]/dashboard/products/page";
import Link from "next/link";

export function LowStockTable({
  lowStockItems,
}: {
  lowStockItems: IProduct[];
}) {
  const t = useTranslations("alerts");
  
  const getPriorityBadge = (product: IProduct) => {
    if (product.currentStock === 0) {
      return <Badge variant="destructive">{t("critical")}</Badge>;
    } else if (product.currentStock < product.minQty / 2) {
      return (
        <Badge
          variant="secondary"
          className="bg-orange-500/20 text-orange-700 hover:bg-orange-500/30"
        >
          {t("high")}
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-amber-500 text-amber-700">
          {t("medium")}
        </Badge>
      );
    }
  };

  const getStockPercentage = (current: number, max: number) => {
    return Math.max(0, Math.min(100, (current / (max || 1)) * 100));
  };

  if (lowStockItems.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">
            {t("itemsRequiringAttention")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-muted rounded-full">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-1">{t("noAlertsFound")}</h3>
          <p className="text-muted-foreground">
            {t("noAlertsMessage")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">
          {t("itemsRequiringAttention")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("product")}</TableHead>
                <TableHead>{t("stockLevel")}</TableHead>
                <TableHead>{t("priority")}</TableHead>
                <TableHead>{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((item) => {
                  const stockPercentage = getStockPercentage(
                  item.currentStock,
                  item.minQty
                );
                return (
                  <TableRow key={item._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg">
                          <img
                            src={
                              process.env.NEXT_PUBLIC_BASE_URL + item.imageUrl
                            }
                            alt={item.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.barcode}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {item.currentStock}
                          </span>
                          {item.currentStock > 0 ? (
                            <TrendingDown className="h-3 w-3 text-secondary" />
                          ) : (
                            <AlertTriangle className="h-3 w-3 text-destructive" />
                          )}
                        </div>
                        <Progress value={stockPercentage} className="h-2" />
                        <div className="text-xs text-muted-foreground">
                          {t("min")} {item.minQty}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getPriorityBadge(item)}</TableCell>
                    <TableCell>
                      {/* Redirect to purchases page */}
                      <Button size="sm" asChild className="gap-2">
                        <Link href="/dashboard/purchases">
                          <ShoppingCart className="h-3 w-3" />
                          {t("createOrder")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
