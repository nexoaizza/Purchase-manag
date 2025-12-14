// components/purchases/confirm-order-dialog.tsx
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";
import { IOrder } from "@/app/[locale]/dashboard/purchases/page";
import { confirmOrder } from "@/lib/apis/purchase-list";
import { useTranslations } from "next-intl";


interface ConfirmOrderDialogProps {
  order: IOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: (updatedOrder: IOrder) => void;
}

export function ConfirmOrderDialog({
  order,
  open,
  onOpenChange,
  onOrderUpdated,
}: ConfirmOrderDialogProps) {
  const t = useTranslations("purchases");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens
  useState(() => {
    if (open && order) {
      setTotalAmount(order.totalAmount?.toString() || "");
      setBillFile(null);
      setBillPreview(null);
    }
  });

  const handleBillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match("image.*") && !file.type.match("application/pdf")) {
        toast.error(t("fileFormats"));
        return;
      }

      setBillFile(file);
      setBillPreview(URL.createObjectURL(file));
    }
  };

  const removeBill = () => {
    setBillFile(null);
    setBillPreview(null);
  };

const handleConfirm = async () => {
  if (!billFile) {
    toast.error(t("uploadBillError"));
    return;
  }

  if (!totalAmount || parseFloat(totalAmount) <= 0) {
    toast.error(t("enterValidAmount"));
    return;
  }

  if (!order) return;

  setIsLoading(true);
  try {
    const formData = new FormData();
    formData.append("image", billFile);
    formData.append("totalAmount", totalAmount);

    const { success, order: updatedOrder, message } = await confirmOrder(
      order._id,
      formData
    );

    if (success && updatedOrder) {
  toast.success(t("orderConfirmed"));
  onOrderUpdated(updatedOrder);
  onOpenChange(false);
  resetForm();

  // ✅ Refresh the page after confirmation
  setTimeout(() => {
    window.location.reload();
  }, 800);
} else {
  toast.error(message || t("unexpectedError"));
}
  } catch (error) {
    console.error("Error confirming order:", error);
    toast.error(t("unexpectedError"));
  } finally {
    setIsLoading(false);
  }
};


  const resetForm = () => {
    setTotalAmount("");
    setBillFile(null);
    setBillPreview(null);
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            {t("confirmOrder")}
          </DialogTitle>
          <DialogDescription>
            {t("uploadBill")} {order.orderNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Total Amount */}
          <div className="space-y-2">
            <Label htmlFor="totalAmount" className="text-sm font-medium">
              {t("totalAmountField")}
            </Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              min="0"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder={t("enterTotalAmount")}
              className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg py-5"
            />
          </div>

          {/* Bill Upload */}
          <div className="space-y-2">
            <Label htmlFor="bill" className="text-sm font-medium">
              {t("bill")}
            </Label>
            <div className="flex items-center gap-4">
              {billPreview ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-input shadow-sm">
                  {billFile?.type === "application/pdf" ? (
                    <div className="w-full h-full flex items-center justify-center bg-red-50">
                      <span className="text-red-500 font-medium">PDF</span>
                    </div>
                  ) : (
                    <img
                      src={billPreview}
                      alt="Bill preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <button
                    type="button"
                    onClick={removeBill}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80 shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-input rounded-xl bg-muted/20">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="bill-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Upload className="h-4 w-4" />
                  {billPreview ? t("changeBill") : t("uploadBillLabel")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("fileFormats")}
                </p>
                <Input
                  id="bill-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleBillUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm mb-2">{t("orderSummary")}</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("supplierSummary")}</span>
              <span className="font-medium">{order.supplierId?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("itemsSummary")}</span>
              <span className="font-medium">{order.items.length} {t("items")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("assignedTo")}</span>
              <span className="font-medium">
                {order.staffId?.fullname || t("notAssigned")}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("currentTotal")}</span>
              <span className="font-medium">
                {order.totalAmount.toFixed(2)} {t("da")}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              resetForm();
            }}
            disabled={isLoading}
            className="rounded-full px-6"
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading || !billFile || !totalAmount}
            className="rounded-full px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("confirmingOrder")}
              </>
            ) : (
              t("confirmButton")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}