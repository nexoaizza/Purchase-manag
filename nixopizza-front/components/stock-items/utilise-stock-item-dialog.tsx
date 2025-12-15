"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, MinusCircle } from "lucide-react";
import toast from "react-hot-toast";
import { updateStockItem, IStockItem } from "@/lib/apis/stock-items";

interface UtiliseStockItemDialogProps {
  stockItem: IStockItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockItemUtilised: () => void;
}

export function UtiliseStockItemDialog({
  stockItem,
  open,
  onOpenChange,
  onStockItemUtilised,
}: UtiliseStockItemDialogProps) {
  const t = useTranslations("stockItems");
  const [loading, setLoading] = useState(false);
  const [usedQuantity, setUsedQuantity] = useState("");
  const [quantityError, setQuantityError] = useState("");

  useEffect(() => {
    if (open) {
      setUsedQuantity("");
      setQuantityError("");
    }
  }, [open]);

  useEffect(() => {
    if (usedQuantity && stockItem) {
      const quantity = Number(usedQuantity);
      if (quantity <= 0) {
        setQuantityError("Quantity must be greater than 0");
      } else if (quantity > stockItem.quantity) {
        setQuantityError(`Quantity cannot exceed ${stockItem.quantity}`);
      } else {
        setQuantityError("");
      }
    } else {
      setQuantityError("");
    }
  }, [usedQuantity, stockItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockItem || !usedQuantity) {
      toast.error(t("fillAllFields"));
      return;
    }

    const quantity = Number(usedQuantity);
    if (quantity <= 0 || quantity > stockItem.quantity) {
      toast.error(`Used quantity must be between 1 and ${stockItem.quantity}`);
      return;
    }

    setLoading(true);

    try {
      const newQuantity = stockItem.quantity - quantity;

      // Update stock item with reduced quantity
      const { success, message } = await updateStockItem(stockItem._id, {
        quantity: newQuantity,
      });

      if (!success) {
        toast.error(message || "Failed to update stock item");
        setLoading(false);
        return;
      }

      toast.success(t("stockItemUtilised") || `${quantity} items marked as used successfully`);
      onStockItemUtilised();
      onOpenChange(false);
    } catch (error) {
      toast.error("An error occurred while updating stock");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!stockItem) return null;

  const stockName = typeof stockItem.stock === 'object' ? stockItem.stock.name : '';
  const productName = typeof stockItem.product === 'object' ? stockItem.product.name : '';
  const productUnit = typeof stockItem.product === 'object' ? stockItem.product.unit : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <MinusCircle className="h-5 w-5" />
            {t("utiliseStockItem")}
          </DialogTitle>
          <DialogDescription>
            Mark items as used and reduce the stock quantity
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Product Info */}
            <div className="space-y-2">
              <Label>{t("product")}</Label>
              <div className="text-sm font-medium text-muted-foreground">
                {productName}
              </div>
            </div>

            {/* Stock Location */}
            <div className="space-y-2">
              <Label>{t("stock")}</Label>
              <div className="text-sm font-medium text-muted-foreground">
                {stockName}
              </div>
            </div>

            {/* Available Quantity */}
            <div className="space-y-2">
              <Label>{t("availableQuantity")}</Label>
              <div className="text-sm font-medium">
                {stockItem.quantity} {productUnit}
              </div>
            </div>

            {/* Used Quantity */}
            <div className="space-y-2">
              <Label htmlFor="usedQuantity">
                {t("usedQuantity")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="usedQuantity"
                type="number"
                min="1"
                max={stockItem.quantity}
                value={usedQuantity}
                onChange={(e) => setUsedQuantity(e.target.value)}
                placeholder={`Max: ${stockItem.quantity}`}
                className={quantityError ? "border-red-500" : ""}
                required
              />
              {quantityError && (
                <p className="text-sm text-red-500">{quantityError}</p>
              )}
            </div>

            {/* Summary */}
            {usedQuantity && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="text-sm font-medium">Summary:</div>
                <div className="text-sm">
                  Used: <span className="font-medium text-orange-600">{usedQuantity} {productUnit}</span>
                </div>
                <div className="text-sm">
                  Remaining: <span className="font-medium">{stockItem.quantity - Number(usedQuantity || 0)} {productUnit}</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading || !usedQuantity || !!quantityError}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? t("updating") : t("markAsUsed")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
