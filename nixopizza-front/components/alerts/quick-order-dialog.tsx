"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calculator, Package } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { IProduct } from "@/app/[locale]/dashboard/products/page";

interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  supplier: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  priority: string;
  trend: string;
  daysLeft: number;
  avgDailyUsage: number;
}

interface QuickOrderDialogProps {
  item: IProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickOrderDialog({
  item,
  open,
  onOpenChange,
}: QuickOrderDialogProps) {
  const t = useTranslations("alerts");
  const [orderQuantity, setOrderQuantity] = useState(0);
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  useEffect(() => {
    if (item) {
      // Calculate suggested order quantity (restore to min qty)
      const suggestedQuantity = item.minQty - item.currentStock;
      setOrderQuantity(suggestedQuantity);
      // Mock price calculation
      setEstimatedPrice(suggestedQuantity * 15.99);
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    // Handle order submission
    console.log("Creating order:", {
      productId: item._id,

      quantity: orderQuantity,
      estimatedPrice,
    });
    onOpenChange(false);
  };

  const handleSuggestedQuantity = (type: "min" | "max" | "optimal") => {
    if (!item) return;

    let quantity = 0;
    switch (type) {
      case "min":
        quantity = item.minQty - item.currentStock;
        break;
      case "max":
        quantity = item.minQty * 2 - item.currentStock;
        break;
      case "optimal":
        // 30 days worth of stock
        quantity = Math.ceil((item.minQty / 2) * 30) - item.currentStock;
        break;
    }
    setOrderQuantity(Math.max(0, quantity));
    setEstimatedPrice(Math.max(0, quantity) * 15.99);
  };

  if (!item) return null;

  const getPriorityText = (stock: number, min: number) => {
    if (stock <= 0) {
      return t("critical");
    }
    if (stock < min / 2) {
      return t("high");
    } else {
      return t("medium");
    }
  };

  const getPriorityColor = (stock: number, min: number) => {
    if (stock <= 0) {
      return "destructive";
    }
    if (stock < min / 2) {
      return "secondary";
    } else {
      return "default";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("quickOrder")}
          </DialogTitle>
          <DialogDescription>
            {t("quickOrderDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">{item.name}</h3>
              <Badge variant={getPriorityColor(item.currentStock, item.minQty)}>
                {getPriorityText(item.currentStock, item.minQty)}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>
                {t("currentStock")} {item.currentStock} / {item.minQty}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">{t("orderQuantity")}</Label>
              <Input
                id="quantity"
                type="number"
                value={orderQuantity}
                onChange={(e) => {
                  const v = e.target.value;
                  const qty = v === "" ? NaN : Number.parseInt(v);
                  const safeQty = Number.isNaN(qty) ? 0 : qty;
                  setOrderQuantity(safeQty);
                  setEstimatedPrice(safeQty * 15.99);
                }}
                min="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">{t("selectSupplierLabel")}</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectSupplier")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={"asd"}>
                    <div>
                      <div className="font-medium">bame</div>
                      <div className="text-sm text-muted-foreground">
                        number
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value={"ss"}>
                    <div>
                      <div className="font-medium">bame</div>
                      <div className="text-sm text-muted-foreground">
                        number
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Order Summary */}
            <div className="p-3 bg-card border rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm">{t("estimatedTotal")}</span>
                <span className="font-medium">
                  ${estimatedPrice.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>{t("newStockLevel")}</span>
                <span>{item.currentStock + orderQuantity}</span>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit">{t("createOrder")}</Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
