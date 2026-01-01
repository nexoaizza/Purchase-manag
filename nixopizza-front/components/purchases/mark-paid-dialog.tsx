// components/purchases/mark-paid-dialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IOrder } from "@/app/[locale]/dashboard/purchases/page";
import { markOrderPaid } from "@/lib/apis/purchase-list";
import { resolveImage } from "@/lib/resolveImage";
import { DollarSign, Package, Receipt, Building2, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";

interface MarkPaidDialogProps {
  order: IOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: (updatedOrder: IOrder) => void;
}

export function MarkPaidDialog({
  order,
  open,
  onOpenChange,
  onOrderUpdated,
}: MarkPaidDialogProps) {
  const t = useTranslations("purchases");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  if (!order) return null;

  const canMark = user?.role === "admin" && order.status === "verified";

  const handleMarkPaid = async () => {
    if (!canMark) return;
    setLoading(true);
    try {
      const { success, order: updated, message } = await markOrderPaid(order._id);
      if (success && updated) {
        onOrderUpdated(updated);
        onOpenChange(false);
      } else {
        console.error(message || t("failedToMarkPaid"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {t("markPaidTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("reviewBeforeMarkPaid")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">{t("orderLabel")}</div>
              <div className="font-mono text-sm">{order.orderNumber}</div>
            </div>
            <div className="border rounded-lg p-3 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">{t("supplier")}</div>
                <div className="text-sm">{order.supplierId?.name}</div>
              </div>
            </div>
            <div className="border rounded-lg p-3 flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">{t("assignedTo")}</div>
                <div className="text-sm">
                  {order.staffId?.fullname || t("notAssigned")}
                </div>
              </div>
            </div>
            <div className="border rounded-lg p-3">
              <div className="text-xs text-muted-foreground">{t("total")}</div>
              <div className="text-sm">{order.totalAmount.toFixed(2)} {t("da")}</div>
            </div>
          </div>

          {/* Items brief */}
          <div className="border rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-2">{t("items")}</div>
            <div className="max-h-48 overflow-auto space-y-2 pr-1">
              {order.items.map((it, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span>{it.productId?.name}</span>
                  </div>
                  <div>
                    {it.quantity} × {it.unitCost} {t("da")} ={" "}
                    {(it.quantity * it.unitCost).toFixed(2)} {t("da")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Receipt */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Receipt className="h-4 w-4" />
                {t("receiptLabel")}
              </div>
              {order.bon && (
                <Button
                  variant="outline"
                  onClick={() => window.open(resolveImage(order.bon!), "_blank")}
                >
                  {t("viewReceipt")}
                </Button>
              )}
            </div>
            {!order.bon ? (
              <div className="text-sm text-muted-foreground mt-2">
                {t("noReceiptUploaded")}
              </div>
            ) : order.bon.toLowerCase().endsWith(".pdf") ? (
              <div className="mt-3 text-sm">
                {t("pdfUploaded")}
              </div>
            ) : (
              <img
                className="mt-3 max-h-64 rounded border object-contain"
                src={resolveImage(order.bon)}
                alt="Receipt"
              />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleMarkPaid}
            disabled={!canMark || loading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? t("markingPaid") : t("markPaidButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}