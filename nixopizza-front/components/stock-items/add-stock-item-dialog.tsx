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
import { Package } from "lucide-react";
import toast from "react-hot-toast";
import { createStockItem } from "@/lib/apis/stock-items";
import { getStocks } from "@/lib/apis/stocks";
import { getProducts } from "@/lib/apis/products";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddStockItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockItemCreated: () => void;
}

export function AddStockItemDialog({
  open,
  onOpenChange,
  onStockItemCreated,
}: AddStockItemDialogProps) {
  const t = useTranslations("stockItems");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    stock: "",
    product: "",
    price: "",
    quantity: "",
    expireAt: "",
  });

  useEffect(() => {
    if (open) {
      fetchStocks();
      fetchProducts();
    }
  }, [open]);

  const fetchStocks = async () => {
    const { success, stocks } = await getStocks({ limit: 100 });
    if (success) {
      setStocks(stocks);
    }
  };

  const fetchProducts = async () => {
    const { success, products } = await getProducts({ limit: 100 });
    if (success) {
      setProducts(products);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.stock || !formData.product || !formData.price || !formData.quantity) {
      toast.error(t("fillAllFields"));
      return;
    }

    setLoading(true);
    const payload: any = {
      stock: formData.stock,
      product: formData.product,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
    };

    if (formData.expireAt) {
      payload.expireAt = new Date(formData.expireAt);
    }

    const { success, message } = await createStockItem(payload);
    setLoading(false);

    if (success) {
      toast.success(t("stockItemCreated"));
      setFormData({
        stock: "",
        product: "",
        price: "",
        quantity: "",
        expireAt: "",
      });
      onStockItemCreated();
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
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{t("createNewStockItem")}</DialogTitle>
              <DialogDescription>{t("stockItemDescription")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stock">{t("stock")}</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">{t("price")}</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder={t("pricePlaceholder")}
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">{t("quantity")}</Label>
              <Input
                id="quantity"
                type="number"
                placeholder={t("quantityPlaceholder")}
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expireAt">{t("expirationDate")} ({t("optional")})</Label>
            <Input
              id="expireAt"
              type="date"
              value={formData.expireAt}
              onChange={(e) =>
                setFormData({ ...formData, expireAt: e.target.value })
              }
            />
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
              {loading ? t("creating") : t("createStockItem")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
