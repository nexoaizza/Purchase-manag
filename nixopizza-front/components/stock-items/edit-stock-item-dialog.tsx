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
import { updateStockItem, IStockItem } from "@/lib/apis/stock-items";
import { getStocks } from "@/lib/apis/stocks";
import { getProducts } from "@/lib/apis/products";
import { getCategories } from "@/lib/apis/categories";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EditStockItemDialogProps {
  stockItem: IStockItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockItemUpdated: () => void;
}

export function EditStockItemDialog({
  stockItem,
  open,
  onOpenChange,
  onStockItemUpdated,
}: EditStockItemDialogProps) {
  const t = useTranslations("stockItems");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
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
      fetchCategories();
    }
  }, [open]);

  const fetchCategories = async () => {
    const { success, categories } = await getCategories();
    if (success) {
      setCategories(categories);
    }
  };

  useEffect(() => {
    if (stockItem) {
      const stockId = typeof stockItem.stock === 'object' ? stockItem.stock._id : stockItem.stock;
      const productId = typeof stockItem.product === 'object' ? stockItem.product._id : stockItem.product;
      
      setFormData({
        stock: stockId,
        product: productId,
        price: stockItem.price.toString(),
        quantity: stockItem.quantity.toString(),
        expireAt: stockItem.expireAt 
          ? new Date(stockItem.expireAt).toISOString().split('T')[0]
          : "",
      });

      // Set initial category from product
      const product = stockItem.product as any;
      if (product && (product.category || product.categoryId)) {
        const catId = typeof product.category === 'object' 
          ? product.category._id 
          : product.categoryId?._id || product.categoryId || product.category;
        setSelectedCategory(catId);
      }
    }
  }, [stockItem]);

  const fetchStocks = async () => {
    const { success, stocks } = await getStocks({ limit: 100 });
    if (success) {
      setStocks(stocks);
    }
  };

  const fetchProducts = async () => {
    const { success, products } = await getProducts({ limit: 1000 });
    if (success) {
      setProducts(products);
    }
  };

  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter((p: any) => {
        const catId = typeof p.category === 'object' ? p.category?._id : p.categoryId?._id || p.categoryId || p.category;
        return catId === selectedCategory;
      });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockItem || !formData.stock || !formData.product || !formData.price || !formData.quantity) {
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

    const { success, message } = await updateStockItem(stockItem._id, payload);
    setLoading(false);

    if (success) {
      toast.success(t("stockItemUpdated"));
      onStockItemUpdated();
      onOpenChange(false);
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
              <DialogTitle>{t("editStockItem")}</DialogTitle>
              <DialogDescription>{t("updateStockItemDescription")}</DialogDescription>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("category")}</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setFormData({ ...formData, product: "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("allCategories")}</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat._id} value={cat._id}>
                      {cat.name}
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
                  {filteredProducts.map((product) => (
                    <SelectItem key={product._id} value={product._id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {loading ? t("updating") : t("updateStockItem")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
