"use client";

import { useState, useEffect, useMemo } from "react";
import { ISupplier } from "@/app/[locale]/dashboard/suppliers/page";
import { getProducts } from "@/lib/apis/products";
import { setSupplierProducts } from "@/lib/apis/suppliers";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Plus, X, Search, Save } from "lucide-react";
import { useTranslations } from "next-intl";
import toast from "react-hot-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SupplierProductsManagerProps {
  supplier: ISupplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (supplier: ISupplier) => void;
}

interface IProduct {
  _id: string;
  name: string;
  categoryId: { _id: string; name: string };
  unit: string;
}

export function SupplierProductsManager({
  supplier,
  open,
  onOpenChange,
  onUpdate,
}: SupplierProductsManagerProps) {
  const t = useTranslations("suppliers");
  const [allProducts, setAllProducts] = useState<IProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  /** Local copy — changes are NOT sent to the backend until Save is clicked */
  const [pendingProducts, setPendingProducts] = useState<string[]>([]);

  useEffect(() => {
    if (open && supplier) {
      fetchProducts();
      setCategoryFilter("all");
      setPendingProducts(
        supplier.productIds?.map((p: any) =>
          typeof p === "string" ? p : p._id
        ) || []
      );
    }
  }, [open, supplier]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const { success, products } = await getProducts({ limit: 1000 });
      if (success) setAllProducts(products);
    } catch {
      toast.error(t("failedToLoadProducts"));
    } finally {
      setIsLoading(false);
    }
  };

  /** Add locally — no API call */
  const handleAddProduct = (productId: string) => {
    if (!pendingProducts.includes(productId)) {
      setPendingProducts((prev) => [...prev, productId]);
    }
  };

  /** Remove locally — no API call */
  const handleRemoveProduct = (productId: string) => {
    setPendingProducts((prev) => prev.filter((id) => id !== productId));
  };

  /** Send the full pending list to the backend */
  const handleSave = async () => {
    if (!supplier) return;
    setIsSaving(true);
    try {
      const { success, supplier: updatedSupplier } = await setSupplierProducts(
        supplier._id,
        pendingProducts
      );
      if (success) {
        onUpdate(updatedSupplier);
        // Close the dialog first, then show the toast.
        // Firing toast while the dialog is tearing down can suppress it.
        onOpenChange(false);
        setTimeout(() => toast.success(t("productsSavedSuccess")), 100);
      } else {
        toast.error(t("failedToSaveProducts"));
      }
    } catch (error: any) {
      toast.error(error?.message || t("failedToSaveProducts"));
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = allProducts.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.categoryId?._id === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const categories = useMemo(
    () => {
      const categoriesMap = new Map<string, string>();
      for (const product of allProducts) {
        if (product.categoryId?._id && product.categoryId?.name) {
          categoriesMap.set(product.categoryId._id, product.categoryId.name);
        }
      }

      return Array.from(categoriesMap.entries()).map(([id, name]) => ({
        id,
        name,
      }));
    },
    [allProducts]
  );

  const assignedProducts = filteredProducts.filter((p) =>
    pendingProducts.includes(p._id)
  );
  const availableProducts = filteredProducts.filter(
    (p) => !pendingProducts.includes(p._id)
  );

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl flex items-center gap-2">
            <Package className="h-6 w-6" />
            {t("manageProducts")} - {supplier.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Search and Category Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchProducts")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t("filterByCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("allCategories")}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Assigned Products */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              {t("assignedProducts")} ({assignedProducts.length})
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {assignedProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t("noProductsAssigned")}
                </p>
              ) : (
                assignedProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.categoryId?.name} • {product.unit}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveProduct(product._id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Available Products */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase">
              {t("availableProducts")} ({availableProducts.length})
            </h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {availableProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchQuery ? t("noProductsFound") : t("allProductsAssigned")}
                </p>
              ) : (
                availableProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.categoryId?.name} • {product.unit}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddProduct(product._id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t("saving") : t("save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
