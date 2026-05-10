"use client";
import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package } from "lucide-react";
import toast from "react-hot-toast";
import { IOrder } from "@/app/[locale]/dashboard/purchases/page";
import { submitForReview } from "@/lib/apis/purchase-list";
import { useTranslations } from "next-intl";

interface EditableItem {
  itemId: string;
  name: string;
  barcode?: string;
  quantity: number;
  unitCost: number;
}

interface SubmitReviewDialogProps {
  order: IOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: (updatedOrder: IOrder) => void;
}

export function SubmitReviewDialog({
  order,
  open,
  onOpenChange,
  onOrderUpdated,
}: SubmitReviewDialogProps) {
  const t = useTranslations("purchases");

  // Editable items state (derived from order items)
  const [items, setItems] = useState<EditableItem[]>([]);
  const [overrideTotal, setOverrideTotal] = useState<string>("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && order) {
      // Initialize editable items
      setItems(
        order.items.map((it) => ({
          itemId: (it as any)._id || "", // ensure we capture ProductOrder _id
          name: it.productId?.name || "Product",
            barcode: it.productId?.barcode,
          quantity: it.quantity,
          unitCost: it.unitCost,
        }))
      );
      setOverrideTotal("");
    }
  }, [open, order]);

  const computedTotal = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (isFinite(it.unitCost) ? it.unitCost : 0) * it.quantity,
        0
      ),
    [items]
  );

  const updateItemField = (
    itemId: string,
    field: keyof EditableItem,
    value: number
  ) => {
    setItems((prev) =>
      prev.map((i) => (i.itemId === itemId ? { ...i, [field]: value } : i))
    );
  };

  const handleSubmit = async () => {
    if (!order) return;
    if (order.status !== "assigned" && order.status !== "not assigned") {
      toast.error(t("orderMustBeAssigned"));
      return;
    }
    // Basic validation
    if (items.some((i) => Number.isNaN(i.quantity) || Number.isNaN(i.unitCost) || i.quantity < 0 || i.unitCost < 0)) {
      toast.error(t("invalidItemValues"));
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      // Provide updated items
      const itemsUpdates = items.map((i) => ({
        itemId: i.itemId,
        quantity: i.quantity,
        unitCost: i.unitCost,
      }));
      fd.append("itemsUpdates", JSON.stringify(itemsUpdates));

      // Optional override total
      if (overrideTotal.trim()) {
        fd.append("totalAmount", overrideTotal.trim());
      }

      const { success, order: updated, message } = await submitForReview(
        order._id,
        fd
      );
      if (success && updated) {
        toast.success(t("submittedForReview"));
        onOrderUpdated(updated);
        onOpenChange(false);
      } else {
        toast.error(message || t("failedToSubmit"));
      }
    } catch (e) {
      toast.error(t("errorSubmittingReview"));
    } finally {
      setSaving(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-[880px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("submitBillAdjust")}
          </DialogTitle>
          <DialogDescription>
            {t("submitBillDescription")} {t("orderId")}: {order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        {/* Items Editor */}
        <div className="space-y-6 py-2">
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-sm">{t("editableItems")}</h3>
              <span className="text-xs text-muted-foreground">
                {t("canModifyBeforeVerification")}
              </span>
            </div>
            <div className="space-y-3">
              {items.map((it) => (
                <div
                  key={it.itemId}
                  className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <Label className="text-xs">Product</Label>
                    <div className="text-sm font-medium truncate">
                      {it.name}
                    </div>
                    {it.barcode && (
                      <div className="text-[10px] text-muted-foreground">
                        BARCODE: {it.barcode}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min={0}
                      value={it.quantity}
                      onChange={(e) => {
                        const v = e.target.value;
                        const num = v === "" ? NaN : parseInt(v);
                        updateItemField(it.itemId, "quantity", Number.isNaN(num) ? 0 : num);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unit Price (DA)</Label>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={it.unitCost}
                      onChange={(e) => {
                        const v = e.target.value;
                        const num = v === "" ? NaN : parseFloat(v);
                        updateItemField(it.itemId, "unitCost", Number.isNaN(num) ? 0 : num);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Line Total</Label>
                    <div className="text-sm font-medium">
                      {(it.quantity * it.unitCost).toFixed(2)} DA
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Original</Label>
                    <div className="text-xs text-muted-foreground">
                      Q:{order.items.find((o: any) => o._id === it.itemId)?.quantity} • U:
                      {order.items.find((o: any) => o._id === it.itemId)?.unitCost}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-3 border-t flex justify-between items-center">
              <div className="text-sm font-medium flex items-center gap-1">
                <span className="text-xs font-bold text-muted-foreground">DA</span>
                {t("computedTotal")}
              </div>
              <div className="text-lg font-semibold">
                {computedTotal.toFixed(2)} {t("da")}
              </div>
            </div>
          </div>

          {/* Override total (optional) */}
          <div className="space-y-2">
            <Label htmlFor="overrideTotal" className="text-sm font-medium">
              {t("overrideTotal")}
            </Label>
            <Input
              id="overrideTotal"
              type="number"
              min={0}
              step="0.01"
              value={overrideTotal}
              onChange={(e) => setOverrideTotal(e.target.value)}
              placeholder={`${t("computedTotal")} ${computedTotal.toFixed(2)} ${t("da")}`}
            />
            <p className="text-xs text-muted-foreground">
              {t("overrideTotalHint")}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              saving ||
              items.length === 0 ||
              items.some((i) => i.quantity < 0 || i.unitCost < 0)
            }
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {saving ? t("submittingReview") : t("confirmPurchase")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}