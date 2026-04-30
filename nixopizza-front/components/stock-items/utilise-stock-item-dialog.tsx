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
import { Package, MinusCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { updateStockItem, IStockItem } from "@/lib/apis/stock-items";
import { createStockUsage } from "@/lib/apis/stock-usage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStuff } from "@/lib/apis/stuff";
import { resolveImage } from "@/lib/resolveImage";

interface Staff {
  _id: string;
  fullname: string;
  email: string;
  avatar: string;
}

interface UtiliseStockItemDialogProps {
  stockItem: IStockItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockItemUtilised: () => void;
}

export function UtiliseStockItemDialog({
  stockItem,
  open,
  onOpenChange,
  onStockItemUtilised,
}: UtiliseStockItemDialogProps) {
  const t = useTranslations("stockItems");
  const tTasks = useTranslations("tasks");
  const [loading, setLoading] = useState(false);
  const [usedQuantity, setUsedQuantity] = useState("");
  const [quantityError, setQuantityError] = useState("");
  
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [isFetchingStaff, setIsFetchingStaff] = useState(false);

  useEffect(() => {
    if (open) {
      setUsedQuantity("");
      setQuantityError("");
      setSelectedStaffId("");
      
      const fetchStaff = async () => {
        setIsFetchingStaff(true);
        try {
          const params = { page: 1, limit: 1000 } as unknown as { name?: string };
          const response = await getStuff(params);
          if (response.success && response.staffs) {
            setStaffList(response.staffs);
          }
        } catch (error) {
          console.error("Failed to fetch staff:", error);
        } finally {
          setIsFetchingStaff(false);
        }
      };
      
      fetchStaff();
    }
  }, [open]);

  useEffect(() => {
    if (usedQuantity && stockItem) {
      const quantity = Number(usedQuantity);
      if (quantity <= 0) {
        setQuantityError(t("quantityGreaterThanZero"));
      } else if (quantity > stockItem.quantity) {
        setQuantityError(`${t("quantityCannotExceed")} ${stockItem.quantity}`);
      } else {
        setQuantityError("");
      }
    } else {
      setQuantityError("");
    }
  }, [usedQuantity, stockItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockItem || !usedQuantity || !selectedStaffId) {
      toast.error(t("fillAllFields") || "Please fill all required fields");
      return;
    }

    const quantity = Number(usedQuantity);
    if (quantity <= 0 || quantity > stockItem.quantity) {
      toast.error(`${t("usedQuantityError")} ${stockItem.quantity}`);
      return;
    }

    setLoading(true);

    try {
      // createStockUsage atomically deducts stock AND records the usage log
      const { success, message } = await createStockUsage({
        stockItemId: stockItem._id,
        quantityUsed: quantity,
        staffId: selectedStaffId,
      });

      if (!success) {
        toast.error(message || "Failed to update stock item");
        setLoading(false);
        return;
      }

      toast.success(t("stockItemUtilised") || `${quantity} items marked as used successfully`);
      onStockItemUtilised();
      onOpenChange(false);
    } catch (error) {
      toast.error("An error occurred while updating stock");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!stockItem) return null;

  const stockName = typeof stockItem.stock === 'object' ? stockItem.stock.name : '';
  const productName = typeof stockItem.product === 'object' ? stockItem.product.name : '';
  const productUnit = typeof stockItem.product === 'object' ? stockItem.product.unit : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <MinusCircle className="h-5 w-5" />
            {t("utiliseStockItem")}
          </DialogTitle>
          <DialogDescription>
            {t("utiliseDescription")}
          </DialogDescription>
        </DialogHeader>

        {isFetchingStaff ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {/* Product Info */}
              <div className="space-y-2">
                <Label>{t("product")}</Label>
                <div className="text-sm font-medium text-muted-foreground">
                  {productName}
                </div>
              </div>

              {/* Stock Location */}
              <div className="space-y-2">
                <Label>{t("stock")}</Label>
                <div className="text-sm font-medium text-muted-foreground">
                  {stockName}
                </div>
              </div>

              {/* Available Quantity */}
              <div className="space-y-2">
                <Label>{t("availableQuantity")}</Label>
                <div className="text-sm font-medium">
                  {stockItem.quantity} {productUnit}
                </div>
              </div>
              
              {/* Staff Selection */}
              <div className="space-y-2">
                <Label htmlFor="staff" className="text-sm font-medium">
                  {tTasks("staffMember") || "Staff Member"} <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg">
                    <SelectValue placeholder={tTasks("selectStaffMember") || "Select staff member"} />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff._id} value={staff._id}>
                        <div className="flex items-center gap-2">
                          <img
                            src={resolveImage(staff.avatar)}
                            alt={staff.fullname}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                          <div>
                            <div className="font-medium">{staff.fullname}</div>
                            <div className="text-xs text-muted-foreground">
                              {staff.email}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Used Quantity */}
              <div className="space-y-2">
                <Label htmlFor="usedQuantity">
                  {t("usedQuantity")} <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="usedQuantity"
                  type="number"
                  min="1"
                  max={stockItem.quantity}
                  value={usedQuantity}
                  onChange={(e) => setUsedQuantity(e.target.value)}
                  placeholder={`Max: ${stockItem.quantity}`}
                  className={quantityError ? "border-red-500 border-2" : "border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg"}
                  required
                />
                {quantityError && (
                  <p className="text-sm text-red-500">{quantityError}</p>
                )}
              </div>

              {/* Summary */}
              {usedQuantity && (
                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="text-sm font-medium">{t("summaryTitle")}</div>
                  <div className="text-sm">
                    {t("used")}: <span className="font-medium text-orange-600">{usedQuantity} {productUnit}</span>
                  </div>
                  <div className="text-sm">
                    {t("remaining")}: <span className="font-medium">{stockItem.quantity - Number(usedQuantity || 0)} {productUnit}</span>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
                className="rounded-full px-6"
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={loading || !usedQuantity || !!quantityError || !selectedStaffId}
                className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("updating") || "Updating..."}
                  </>
                ) : (
                  t("markAsUsed")
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
