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
import { ArrowRightLeft } from "lucide-react";
import toast from "react-hot-toast";
import { createTransfer } from "@/lib/apis/transfers";
import { getStocks, IStock } from "@/lib/apis/stocks";
import { getStockItems } from "@/lib/apis/stock-items";

interface AddTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferCreated: () => void;
}

export function AddTransferDialog({
  open,
  onOpenChange,
  onTransferCreated,
}: AddTransferDialogProps) {
  const t = useTranslations("transfers");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<IStock[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    items: [] as string[],
    takenFrom: "",
    takenTo: "",
    quantity: 1,
    status: "pending" as "pending" | "arrived",
  });

  useEffect(() => {
    if (open) {
      fetchStocks();
    }
  }, [open]);

  useEffect(() => {
    if (formData.takenFrom) {
      fetchStockItems(formData.takenFrom);
    }
  }, [formData.takenFrom]);

  const fetchStocks = async () => {
    const { success, stocks: fetchedStocks } = await getStocks();
    if (success) {
      setStocks(fetchedStocks || []);
    }
  };

  const fetchStockItems = async (stockId: string) => {
    const { success, stockItems: items } = await getStockItems({ stock: stockId });
    if (success) {
      setStockItems(items || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.takenFrom || !formData.takenTo || formData.items.length === 0 || formData.quantity < 1) {
      toast.error(t("fillAllFields"));
      return;
    }

    if (formData.takenFrom === formData.takenTo) {
      toast.error(t("sameStockError"));
      return;
    }

    setLoading(true);
    const { success, message } = await createTransfer(formData);
    setLoading(false);

    if (success) {
      toast.success(t("transferCreated"));
      setFormData({ 
        items: [], 
        takenFrom: "", 
        takenTo: "", 
        quantity: 1,
        status: "pending" 
      });
      onTransferCreated();
    } else {
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{t("createNewTransfer")}</DialogTitle>
              <DialogDescription>{t("transferDescription")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="takenFrom">{t("fromStock")}</Label>
            <Select
              value={formData.takenFrom}
              onValueChange={(value) =>
                setFormData({ ...formData, takenFrom: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectSourceStock")} />
              </SelectTrigger>
              <SelectContent>
                {stocks.map((stock) => (
                  <SelectItem key={stock._id} value={stock._id}>
                    {stock.name} - {stock.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="takenTo">{t("toStock")}</Label>
            <Select
              value={formData.takenTo}
              onValueChange={(value) =>
                setFormData({ ...formData, takenTo: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectDestinationStock")} />
              </SelectTrigger>
              <SelectContent>
                {stocks
                  .filter((stock) => stock._id !== formData.takenFrom)
                  .map((stock) => (
                    <SelectItem key={stock._id} value={stock._id}>
                      {stock.name} - {stock.location}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="items">{t("selectItems")}</Label>
            <Select
              value={formData.items[0] || ""}
              onValueChange={(value) =>
                setFormData({ ...formData, items: [value] })
              }
              disabled={!formData.takenFrom}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectItemsPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {stockItems.map((item) => (
                  <SelectItem key={item._id} value={item._id}>
                    {item.product?.name || "Unknown"} - Qty: {item.quantity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">{t("quantity")}</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder={t("quantityPlaceholder")}
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">{t("status")}</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "pending" | "arrived") =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="arrived">{t("arrived")}</SelectItem>
              </SelectContent>
            </Select>
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
            <Button type="submit" disabled={loading}>
              {loading ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
