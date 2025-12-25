"use client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PurchaseTemplateDTO } from "@/lib/apis/purchase-templates";
import { resolveImage } from "@/lib/resolveImage";
import { X } from "lucide-react";

import { useTranslations } from "next-intl";

export default function TemplateViewDialog({
  open,
  onOpenChange,
  template,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  template: PurchaseTemplateDTO | null;
}) {
  const t = useTranslations("templates");

  if (!template) return null;

  const supplier = typeof template.supplierId === "object" ? template.supplierId : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-heading flex items-center gap-2">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t("templateDetails")}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info Card */}
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold">{template.name}</h3>
                {template.description && (
                  <p className="text-sm text-muted-foreground">{template.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Supplier Info */}
          {supplier && (
            <div className="bg-card rounded-lg border p-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {t("supplierInfo")}
              </h4>
              <div className="flex items-center gap-3">
                {supplier.image && (
                  <img
                    src={resolveImage(supplier.image)}
                    alt={supplier.name}
                    className="w-12 h-12 rounded-lg object-cover border"
                  />
                )}
                <div>
                  <p className="font-medium">{supplier.name}</p>
                  <p className="text-sm text-muted-foreground">{t("supplierLabel")}</p>
                </div>
              </div>
            </div>
          )}

          {/* Items List */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              {t("products")} ({template.items.length})
            </h4>
            <div className="space-y-2">
              {template.items.map((item: any, idx: number) => {
                const product = typeof item.productId === "object" ? item.productId : null;
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors"
                  >
                    {product?.imageUrl && (
                      <img
                        src={resolveImage(product.imageUrl)}
                        alt={product.name}
                        className="w-16 h-16 rounded-md object-cover border"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{product?.name || t("unknownProduct")}</p>
                      {product?.barcode && (
                        <p className="text-sm text-muted-foreground">
                          {t("barcode")}: {product.barcode}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">{t("quantity")}</p>
                      <p className="text-lg font-semibold">{item.quantity}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
