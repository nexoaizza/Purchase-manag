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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { createWaste } from "@/lib/apis/waste";
import { getProducts } from "@/lib/apis/products";
import { getStocks, IStock } from "@/lib/apis/stocks";

interface AddWasteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWasteCreated: () => void;
}

export function AddWasteDialog({
  open,
  onOpenChange,
  onWasteCreated,
}: AddWasteDialogProps) {
  const t = useTranslations("waste");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [stocks, setStocks] = useState<IStock[]>([]);
  const [formData, setFormData] = useState({
    product: "",
    quantity: 1,
    reason: "",
    stock: "",
  });

  useEffect(() => {
    if (open) {
      fetchProducts();
      fetchStocks();
    }
  }, [open]);

  const fetchProducts = async () => {
    const { success, products: fetchedProducts } = await getProducts();
    if (success) {
      setProducts(fetchedProducts || []);
    }
  };

  const fetchStocks = async () => {
    const { success, stocks: fetchedStocks } = await getStocks();
    if (success) {
      setStocks(fetchedStocks || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product || !formData.reason || formData.quantity < 1) {
      toast.error(t("fillAllFields"));
      return;
    }

    setLoading(true);
    const { success, message } = await createWaste({
      ...formData,
      stock: formData.stock || undefined,
    });
    setLoading(false);

    if (success) {
      toast.success(t("wasteCreated"));
      setFormData({ product: "", quantity: 1, reason: "", stock: "" });
      onWasteCreated();
    } else {
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>{t("createNewWaste")}</DialogTitle>
              <DialogDescription>{t("wasteDescription")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">{t("product")}</Label>
            <Select
              value={formData.product}
              onValueChange={(value) =>
                setFormData({ ...formData, product: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectProduct")} />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product._id} value={product._id}>
                    {product.name}
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
            <Label htmlFor="reason">{t("reason")}</Label>
            <Textarea
              id="reason"
              placeholder={t("reasonPlaceholder")}
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stock">{t("stock")} ({t("optional")})</Label>
            <Select
              value={formData.stock}
              onValueChange={(value) =>
                setFormData({ ...formData, stock: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectStock")} />
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
