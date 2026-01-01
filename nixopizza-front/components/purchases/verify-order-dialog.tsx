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
import { verifyOrder } from "@/lib/apis/purchase-list";
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
import { ShieldCheck, Package, Receipt, DollarSign, User, Building2, Warehouse } from "lucide-react";

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
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchStocks();
      setSelectedStock("");
    }
  }, [open]);

  const fetchStocks = async () => {
    const { success, stocks: fetchedStocks } = await getStocks({ limit: 100 });
    if (success) {
      setStocks(fetchedStocks);
    }
  };

  if (!order) return null;

  const handleVerify = async () => {
    if (user?.role !== "admin") {
      return;
    }
    if (order.status !== "pending_review") {
      return;
    }
    if (!selectedStock) {
      return;
    }
    setLoading(true);
    try {
      // Prepare stock items from order items
      const stockItems = order.items.map((item: any) => ({
        product: item.productId._id,
        price: item.unitCost,
        quantity: item.quantity,
        expireAt: item.expirationDate || undefined,
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

  const canVerify = user?.role === "admin" && order.status === "pending_review" && !!order.bon && !!selectedStock;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[820px]">
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
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-xs text-muted-foreground">{t("total")}</div>
                <div className="text-sm">
                  {order.totalAmount.toFixed(2)} {t("da")}
                </div>
              </div>
            </div>
          </div>

          {/* Items brief */}
          <div className="border rounded-lg p-3">
            <div className="text-xs text-muted-foreground mb-2">{t("items")}</div>
            <div className="max-h-48 overflow-auto space-y-2 pr-1">
              {order.items.map((it: any, idx: number) => (
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