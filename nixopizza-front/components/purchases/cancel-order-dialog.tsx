"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { IOrder } from "@/app/[locale]/dashboard/purchases/page";
import { updateOrder } from "@/lib/apis/purchase-list";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

interface CancelOrderDialogProps {
  order: IOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: (updatedOrder: IOrder) => void;
}

export function CancelOrderDialog({
  order,
  open,
  onOpenChange,
  onOrderUpdated,
}: CancelOrderDialogProps) {
  const t = useTranslations("purchases");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setReason("");
      setLoading(false);
    }
  }, [open]);

  if (!order) return null;

  const canCancel =
    ["not assigned", "assigned", "pending_review"].includes(order.status);

  const handleCancel = async () => {
    if (!canCancel) {
      toast.error(t("cannotCancelAtStage"));
      return;
    }
    setLoading(true);
    try {
      const { success, order: updated, message } = await updateOrder(order._id, {
        status: "canceled",
        notes: reason ? `[CANCELED REASON] ${reason}` : order.notes,
        canceledDate: new Date().toISOString(),
      });
      if (success && updated) {
        toast.success(t("canceledSuccessfully"));
        onOrderUpdated(updated);
        onOpenChange(false);
      } else {
        toast.error(message || t("failedToCancelOrder"));
      }
    } catch (e) {
      toast.error(t("errorCancelingOrder"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            {t("cancelOrderTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("cancelOrderDescription")} {order.orderNumber}. {t("cancelActionWarning")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="text-sm">
            {t("currentStatusLabel")} <span className="font-medium">{order.status}</span>
          </div>
          {!canCancel && (
            <div className="text-sm text-red-600">
              {t("cannotCancelOrder")}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {t("cancellationReason")}
            </label>
            <Textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("provideCancelReason")}
              className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {t("closeButton")}
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            disabled={!canCancel || loading}
            onClick={handleCancel}
          >
            {loading ? t("cancelingOrder") : t("cancelOrderButton")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}