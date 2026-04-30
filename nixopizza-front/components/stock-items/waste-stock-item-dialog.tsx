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
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { deleteStockItem, IStockItem } from "@/lib/apis/stock-items";
import { createWaste } from "@/lib/apis/waste";

interface WasteStockItemDialogProps {
  stockItem: IStockItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockItemWasted: () => void;
}

export function WasteStockItemDialog({
  stockItem,
  open,
  onOpenChange,
  onStockItemWasted,
}: WasteStockItemDialogProps) {
  const t = useTranslations("stockItems");
  const [loading, setLoading] = useState(false);
  const [wasteQuantity, setWasteQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [quantityError, setQuantityError] = useState("");

  useEffect(() => {
    if (open && stockItem) {
      setWasteQuantity(stockItem.quantity.toString());
      setReason("");
      setQuantityError("");
    }
  }, [open, stockItem]);

  useEffect(() => {
    if (wasteQuantity && stockItem) {
      const quantity = Number(wasteQuantity);
      if (quantity <= 0) {
        setQuantityError(t("quantityGreaterThanZero"));
      } else if (quantity > stockItem.quantity) {
        setQuantityError(`${t("quantityCannotExceed")} ${stockItem.quantity}`);
      } else {
        setQuantityError("");
      }
    } else {
      setQuantityError("");
    }
  }, [wasteQuantity, stockItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockItem || !reason.trim() || !wasteQuantity) {
      toast.error(t("fillAllFields"));
      return;
    }

    const quantity = Number(wasteQuantity);
    if (quantity <= 0 || quantity > stockItem.quantity) {
      toast.error(`${t("wasteQuantityError")} ${stockItem.quantity}`);
      return;
    }

    setLoading(true);

    try {
      const productId = typeof stockItem.product === 'object' ? stockItem.product._id : stockItem.product;
      const stockId = typeof stockItem.stock === 'object' ? stockItem.stock._id : stockItem.stock;

      // Create waste record
      const { success: wasteSuccess, message: wasteMessage } = await createWaste({
        product: productId,
        quantity: quantity,
        reason: reason.trim(),
        stock: stockId,
      });

      if (!wasteSuccess) {
        toast.error(wasteMessage || "Failed to create waste record");
        setLoading(false);
        return;
      }

      // Delete the stock item
      const { success: deleteSuccess, message: deleteMessage } = await deleteStockItem(stockItem._id);

      if (!deleteSuccess) {
        toast.error(deleteMessage || t("fillAllFields"));
        setLoading(false);
        return;
      }

      toast.success(t("markAsWaste"));
      onStockItemWasted();
      onOpenChange(false);
    } catch (error) {
      toast.error("An error occurred while processing waste");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!stockItem) return null;

  const productName = typeof stockItem.product === 'object' ? stockItem.product.name : '';
  const stockName = typeof stockItem.stock === 'object' ? stockItem.stock.name : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {t("wasteStockItem")}
          </DialogTitle>
          <DialogDescription>
            {t("wasteDescription")}
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

            {/* Current Stock */}
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
                {stockItem.quantity} {typeof stockItem.product === 'object' ? stockItem.product.unit : ''}
              </div>
            </div>

            {/* Waste Quantity */}
            <div className="space-y-2">
              <Label htmlFor="wasteQuantity">
                {t("wasteQuantity")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="wasteQuantity"
                type="number"
                min="1"
                max={stockItem.quantity}
                value={wasteQuantity}
                onChange={(e) => setWasteQuantity(e.target.value)}
                placeholder={`Max: ${stockItem.quantity}`}
                className={quantityError ? "border-red-500" : ""}
                required
              />
              {quantityError && (
                <p className="text-sm text-red-500">{quantityError}</p>
              )}
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label htmlFor="reason">
                {t("wasteReason")} <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t("wasteReasonPlaceholder")}
                rows={3}
                required
              />
            </div>

            {/* Warning */}
            <div className="rounded-lg bg-destructive/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t("warningTitle")}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("wasteWarningMessage")}
              </p>
            </div>
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
              disabled={loading || !wasteQuantity || !reason.trim() || !!quantityError}
              variant="destructive"
            >
              {loading ? t("processing") : t("markAsWaste")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
