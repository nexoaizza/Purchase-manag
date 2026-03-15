"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductSelect } from "@/components/ui/product-select";
import { SupplierSelect } from "@/components/ui/supplier-select";
import { ISupplier } from "@/app/[locale]/dashboard/suppliers/page";
import { getProducts } from "@/lib/apis/products";
import toast from "react-hot-toast";
import { createTemplate, updateTemplate, PurchaseTemplateDTO } from "@/lib/apis/purchase-templates";
import { useTranslations } from "next-intl";

type Product = {
  _id: string;
  name: string;
  imageUrl?: string;
  barcode?: string;
  currentStock: number;
  minQty: number;
};

type Item = { productId: string; quantity: number; product?: Product | null };

export default function TemplateEditorDialog({
  open,
  onOpenChange,
  onSaved,
  initial,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSaved: (tpl: PurchaseTemplateDTO) => void;
  initial?: PurchaseTemplateDTO | null;
}) {
  const t = useTranslations("purchases");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<Item[]>([{ productId: "", quantity: 1, product: null }]);
  const [products, setProducts] = useState<Product[]>([]);
  const [supplier, setSupplier] = useState<ISupplier | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await getProducts({ limit: 1000 });
        if (res.success) setProducts(res.products);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (open) {
      if (initial) {
        setName(initial.name);
        setDescription(initial.description || "");
        const initSupplier = typeof initial.supplierId === "object" ? initial.supplierId : null;
        setSupplier(initSupplier as ISupplier | null);
        setItems(
          initial.items.map((it: any) => ({
            productId: typeof it.productId === "string" ? it.productId : it.productId?._id,
            quantity: it.quantity,
            product: typeof it.productId === "object" ? it.productId : null,
          }))
        );
      } else {
        setName("");
        setDescription("");
        setSupplier(null);
        setItems([{ productId: "", quantity: 1, product: null }]);
      }
    }
  }, [open, initial]);

  const updateItem = (idx: number, patch: Partial<Item>) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const addRow = () => setItems((prev) => [...prev, { productId: "", quantity: 1, product: null }]);
  const removeRow = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSupplierChange = (newSupplier: ISupplier | null) => {
    const hasProducts = items.some((it) => it.productId && it.productId.trim() !== "");
    if (hasProducts && supplier && newSupplier?._id !== supplier._id) {
      toast.error(t("removeProductsBeforeSupplierChange"));
      return;
    }
    setSupplier(newSupplier);
  };

  const onSubmit = async () => {
    if (!name.trim()) return toast.error(t("templateNameRequired"));
    if (!supplier) return toast.error(t("selectSupplierRequired"));
    if (!items.length || items.some((i) => !i.productId || i.quantity < 0)) {
      return toast.error(t("addItemsError"));
    }
    setLoading(true);
    try {
      const payload = { name: name.trim(), description: description.trim(), supplierId: supplier._id, items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })) };
      const res = initial?._id ? await updateTemplate(initial._id, payload) : await createTemplate(payload);
      if (res.success && res.template) {
        toast.success(initial?._id ? t("templateUpdated") : t("templateCreated"));
        onSaved(res.template);
        onOpenChange(false);
      } else {
        toast.error(res.message || t("failedSaveTemplate"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>{initial ? t("editTemplate") : t("createTemplate")}</DialogTitle>
          <DialogDescription>{t("templateEditorDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("nameLabel")}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("namePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("descriptionLabel")}</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("descriptionPlaceholder")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("supplierLabel")}</Label>
            <SupplierSelect selectedSupplier={supplier} onSupplierChange={handleSupplierChange} placeholder={t("selectSupplier")} />
          </div>
          <div className="space-y-2">
            <Label>{t("itemsLabel")}</Label>
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                  <div className="md:col-span-4">
                    <ProductSelect
                      products={supplier && supplier.categoryIds ? products.filter((p) => {
                        const catId = (p as any).categoryId;
                        const actualCatId = typeof catId === "object" ? catId?._id : catId;
                        return supplier.categoryIds.map(String).includes(String(actualCatId));
                      }) : []}
                      disabled={!supplier}
                      selectedProduct={it.product || products.find((p) => p._id === it.productId) || null}
                      onSelect={(p) => updateItem(idx, { productId: p?._id || "", product: (p as any) || null })}
                      placeholder={t("selectProduct")}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">{t("quantityLabel")}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={it.quantity}
                      onChange={(e) => {
                        const v = e.target.value; const num = v === "" ? NaN : parseInt(v); updateItem(idx, { quantity: Number.isNaN(num) ? 0 : num });
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => removeRow(idx)} disabled={items.length <= 1}>{t("removeButton")}</Button>
                    {idx === items.length - 1 && (
                      <Button type="button" variant="secondary" onClick={addRow}>{t("addButton")}</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>{t("cancelButton")}</Button>
          <Button type="button" onClick={onSubmit} disabled={loading}>{initial ? t("saveChanges") : t("createTemplate")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
