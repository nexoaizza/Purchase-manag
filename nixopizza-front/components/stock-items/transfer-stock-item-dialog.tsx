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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import { updateStockItem, createStockItem, IStockItem } from "@/lib/apis/stock-items";
import { getStocks } from "@/lib/apis/stocks";

interface TransferStockItemDialogProps {
  stockItem: IStockItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockItemTransferred: () => void;
}

export function TransferStockItemDialog({
  stockItem,
  open,
  onOpenChange,
  onStockItemTransferred,
}: TransferStockItemDialogProps) {
  const t = useTranslations("stockItems");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<any[]>([]);
  const [transferQuantity, setTransferQuantity] = useState("");
  const [destinationStock, setDestinationStock] = useState("");
  const [quantityError, setQuantityError] = useState("");

  useEffect(() => {
    if (open) {
      fetchStocks();
      setTransferQuantity("");
      setDestinationStock("");
      setQuantityError("");
    }
  }, [open]);

  useEffect(() => {
    if (transferQuantity && stockItem) {
      const quantity = Number(transferQuantity);
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
  }, [transferQuantity, stockItem]);

  const fetchStocks = async () => {
    const { success, stocks: fetchedStocks } = await getStocks({ limit: 100 });
    if (success) {
      // Filter out the current stock
      const filteredStocks = fetchedStocks.filter(
        (stock: any) => stock._id !== (typeof stockItem?.stock === 'object' ? stockItem.stock._id : stockItem?.stock)
      );
      setStocks(filteredStocks);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockItem || !destinationStock || !transferQuantity) {
      toast.error(t("fillAllFields"));
      return;
    }

    const quantity = Number(transferQuantity);
    if (quantity <= 0 || quantity > stockItem.quantity) {
      toast.error(`Transfer quantity must be between 1 and ${stockItem.quantity}`);
      return;
    }

    setLoading(true);

    try {
      const stockItemId = typeof stockItem.stock === 'object' ? stockItem.stock._id : stockItem.stock;
      const productId = typeof stockItem.product === 'object' ? stockItem.product._id : stockItem.product;

      // Update current stock item (reduce quantity)
      const newQuantity = stockItem.quantity - quantity;
      
      if (newQuantity > 0) {
        // Update existing stock item with reduced quantity
        const { success: updateSuccess, message: updateMessage } = await updateStockItem(
          stockItem._id,
          {
            quantity: newQuantity,
          }
        );

        if (!updateSuccess) {
          toast.error(updateMessage || "Failed to update source stock item");
          setLoading(false);
          return;
        }
      } else {
        // If transferring all quantity, we'll handle deletion in the parent component
        // For now, just update to 0
        const { success: updateSuccess, message: updateMessage } = await updateStockItem(
          stockItem._id,
          {
            quantity: 0,
          }
        );

        if (!updateSuccess) {
          toast.error(updateMessage || "Failed to update source stock item");
          setLoading(false);
          return;
        }
      }

      // Create new stock item in destination stock
      const { success: createSuccess, message: createMessage } = await createStockItem({
        stock: destinationStock,
        product: productId,
        price: stockItem.price,
        quantity: quantity,
        expireAt: stockItem.expireAt,
      });

      if (!createSuccess) {
        toast.error(createMessage || "Failed to create destination stock item");
        setLoading(false);
        return;
      }

      toast.success(t("stockItemTransferred") || "Stock item transferred successfully");
      onStockItemTransferred();
      onOpenChange(false);
    } catch (error) {
      toast.error("An error occurred during transfer");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!stockItem) return null;

  const currentStockName = typeof stockItem.stock === 'object' ? stockItem.stock.name : '';
  const productName = typeof stockItem.product === 'object' ? stockItem.product.name : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("transferStockItem")}
          </DialogTitle>
          <DialogDescription>
            Transfer stock items from one stock location to another
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
              <Label>{t("currentStock")}</Label>
              <div className="text-sm font-medium text-muted-foreground">
                {currentStockName}
              </div>
            </div>

            {/* Available Quantity */}
            <div className="space-y-2">
              <Label>{t("availableQuantity")}</Label>
              <div className="text-sm font-medium">
                {stockItem.quantity} {typeof stockItem.product === 'object' ? stockItem.product.unit : ''}
              </div>
            </div>

            {/* Transfer Quantity */}
            <div className="space-y-2">
              <Label htmlFor="transferQuantity">
                {t("transferQuantity")} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="transferQuantity"
                type="number"
                min="1"
                max={stockItem.quantity}
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(e.target.value)}
                placeholder={`Max: ${stockItem.quantity}`}
                className={quantityError ? "border-red-500" : ""}
                required
              />
              {quantityError && (
                <p className="text-sm text-red-500">{quantityError}</p>
              )}
            </div>

            {/* Destination Stock */}
            <div className="space-y-2">
              <Label htmlFor="destinationStock">
                {t("destinationStock")} <span className="text-red-500">*</span>
              </Label>
              <Select value={destinationStock} onValueChange={setDestinationStock}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectDestinationStock")} />
                </SelectTrigger>
                <SelectContent>
                  {stocks.map((stock: any) => (
                    <SelectItem key={stock._id} value={stock._id}>
                      {stock.name} - {stock.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transfer Summary */}
            {transferQuantity && destinationStock && (
              <div className="rounded-lg bg-muted p-4 space-y-2">
                <div className="text-sm font-medium">Transfer Summary:</div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{currentStockName}</span>
                  <ArrowRight className="h-4 w-4" />
                  <span>
                    {stocks.find((s: any) => s._id === destinationStock)?.name}
                  </span>
                </div>
                <div className="text-sm">
                  Quantity: <span className="font-medium">{transferQuantity}</span>
                </div>
                <div className="text-sm">
                  Remaining: <span className="font-medium">{stockItem.quantity - Number(transferQuantity || 0)}</span>
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
              disabled={loading || !transferQuantity || !destinationStock || !!quantityError}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {loading ? t("transferring") : t("transfer")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
