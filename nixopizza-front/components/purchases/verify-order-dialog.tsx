// components/purchases/verify-order-dialog.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { verifyOrder, updateOrder } from "@/lib/apis/purchase-list";
import { createMultipleStockItems } from "@/lib/apis/stock-items";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export interface IOrder {
  _id: string;
  bon: string;
  orderNumber: string;
  supplierId: {
    name: string;
    email: string;
    _id: string;
    image: string;
    address: string;
    phone1: string;
    phone2?: string;
    phone3?: string;
    city?: string;
    contactPerson: string;
  };
  staffId: {
    fullname: string;
    email: string;
    _id: string;
    avatar: string;
  } | null;
  status: "not assigned" | "assigned" | "pending_review" | "verified" | "paid" | "canceled";
  totalAmount: number;
  items: {
    _id?: string;
    productId: {
      name: string;
      _id: string;
      imageUrl?: string;
      barcode?: string;
    };
    quantity: number;
    expirationDate: Date;
    unitCost: number;
    remainingQte: number;
    isExpired: boolean;
    expiredQuantity: number;
  }[];
  notes: string;
}
import { resolveImage } from "@/lib/resolveImage";
import { getStocks } from "@/lib/apis/stocks";
import { ShieldCheck, Package, Receipt, User, Building2, Warehouse, Calendar, Upload, X, Download } from "lucide-react";
import { Input } from "@/components/ui/input";

interface VerifyOrderDialogProps {
  order: IOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated: (updatedOrder: IOrder) => void;
}

export function VerifyOrderDialog({
  order,
  open,
  onOpenChange,
  onOrderUpdated,
}: VerifyOrderDialogProps) {
  const t = useTranslations("purchases");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState<string>("");
  const [expireDates, setExpireDates] = useState<Record<number, string>>({});

  // Bill upload state
  const [billFile, setBillFile] = useState<File | null>(null);
  const [billPreview, setBillPreview] = useState<string | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchStocks();
      setSelectedStock("");
      setExpireDates({});
      setBillFile(null);
      setBillPreview(null);
    }
  }, [open]);

  const fetchStocks = async () => {
    const { success, stocks: fetchedStocks } = await getStocks({ limit: 100 });
    if (success) {
      setStocks(fetchedStocks);
    }
  };

  const handleBillUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match("image.*") && !file.type.match("application/pdf")) {
      toast.error(t("selectImageOrPdf"));
      return;
    }
    setBillFile(file);
    setBillPreview(URL.createObjectURL(file));
  };

  const removeBill = () => {
    setBillFile(null);
    setBillPreview(null);
  };

  if (!order) return null;

  const handleVerify = async () => {
    if (user?.role !== "admin") return;
    if (order.status !== "pending_review") return;
    if (!selectedStock) return;

    setLoading(true);
    try {
      // If a new bill file is provided, upload it first via updateOrder
      if (billFile) {
        const fd = new FormData();
        fd.append("image", billFile);
        
        const { success: uploadSuccess, message: uploadMessage } = await updateOrder(order._id, fd);
        if (!uploadSuccess) {
          toast.error(uploadMessage || t("failedToSubmit"));
          setLoading(false);
          return;
        }
      }

      // Prepare stock items — use the expiration date entered at arrival time
      const stockItems = order.items.map((item: any, idx: number) => ({
        product: item.productId._id,
        price: item.unitCost,
        quantity: item.quantity,
        expireAt: expireDates[idx] ? new Date(expireDates[idx]) : undefined,
      }));

      // Create stock items
      const { success: stockSuccess, message: stockMessage } = await createMultipleStockItems({
        stockId: selectedStock,
        items: stockItems,
      });

      if (!stockSuccess) {
        toast.error(stockMessage || t("failedCreateStockItems"));
        setLoading(false);
        return;
      }

      // Verify order
      const { success, order: updated, message } = await verifyOrder(order._id);
      if (success && updated) {
        toast.success(t("verifiedStockCreated"));
        onOrderUpdated(updated);
        onOpenChange(false);
      } else {
        toast.error(message || t("failedToVerify"));
      }
    } catch (error: any) {
      toast.error(t("errorDuringVerification"));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const canVerify = user?.role === "admin" && order.status === "pending_review" && !!selectedStock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[820px] max-h-11/12 overflow-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            {t("verifyOrderTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("reviewOrderBeforeVerification")}
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
            <div className="border rounded-lg p-3 flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground">DA</span>
              <div>
                <div className="text-xs text-muted-foreground">{t("total")}</div>
                <div className="text-sm">
                  {order.totalAmount.toFixed(2)} {t("da")}
                </div>
              </div>
            </div>
          </div>

          {/* Items with per-item expiration date */}
          <div className="border rounded-lg p-3">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4" />
              <div className="text-sm font-medium">
                {t("items")} — {t("setExpirationOnArrival") || "Set expiration dates on arrival"}
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-auto pr-1">
              {order.items.map((it: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{it.productId?.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {it.quantity} × {it.unitCost} {t("da")} = {(it.quantity * it.unitCost).toFixed(2)} {t("da")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Label className="text-xs text-muted-foreground whitespace-nowrap">
                      {t("expirationDate") || "Exp. date"}
                    </Label>
                    <Input
                      type="date"
                      className="w-36 h-8 text-xs"
                      value={expireDates[idx] || ""}
                      min={new Date().toISOString().slice(0, 10)}
                      onChange={(e) =>
                        setExpireDates((prev) => ({ ...prev, [idx]: e.target.value }))
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Selection */}
          <div className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              <Label className="font-medium">{t("selectStockForItems")}</Label>
            </div>
            <div className="space-y-2">
              <Select value={selectedStock} onValueChange={setSelectedStock}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("selectStock")} />
                </SelectTrigger>
                <SelectContent>
                  {stocks.map((stock: any) => (
                    <SelectItem key={stock._id} value={stock._id}>
                      {stock.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!selectedStock && (
                <p className="text-xs text-muted-foreground">
                  {t("mustSelectStock")}
                </p>
              )}
            </div>
          </div>

          {/* Receipt Upload */}
          <div className="border rounded-lg p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Receipt className="h-4 w-4" />
              {t("receiptLabel")}
            </div>

            {/* Existing receipt (read-only view) */}
            {order.bon && !billFile && (
              <div className="bg-muted/40 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <Receipt className="h-4 w-4" />
                  {t("previousBillPresent")}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(resolveImage(order.bon!), "_blank")}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  {t("viewReceipt")}
                </Button>
              </div>
            )}

            {/* New bill upload */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {t("billRequired")} ({t("optional", { fallback: "Optional" })})
              </Label>
              <div className="flex items-center gap-4">
                {billPreview ? (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border">
                    {billFile?.type === "application/pdf" ? (
                      <div className="w-full h-full flex items-center justify-center bg-red-50">
                        <span className="text-red-600 font-medium">PDF</span>
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
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-85"
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
                    htmlFor="verify-bill-file"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90 transition-opacity text-sm"
                  >
                    <Upload className="h-4 w-4" />
                    {t("selectBill")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, PDF up to 5MB
                  </p>
                  <Input
                    id="verify-bill-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleBillUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Preview of newly selected receipt (if image) */}
              {billPreview && billFile?.type !== "application/pdf" && (
                <img
                  className="mt-2 max-h-48 rounded border object-contain"
                  src={billPreview}
                  alt="New receipt preview"
                />
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleVerify}
            disabled={!canVerify || loading}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {loading ? t("verifyingOrder") : t("verifyOrder")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}