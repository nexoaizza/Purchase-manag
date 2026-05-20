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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StockItemSelect } from "@/components/ui/stock-item-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { CustomTimePicker } from "@/components/ui/custom-time-picker";
import toast from "react-hot-toast";
import { updateTransfer, ITransfer } from "@/lib/apis/transfers";
import { getStocks, IStock } from "@/lib/apis/stocks";
import { getStockItems } from "@/lib/apis/stock-items";
import { getStuff } from "@/lib/apis/stuff";
import { getCategories } from "@/lib/apis/categories";

interface IStaff {
  _id: string;
  fullname: string;
  email: string;
}

interface ICategory {
  _id: string;
  name: string;
}

interface ITransferItem {
  stockItemId: string;
  quantity: number;
}

interface EditTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferUpdated: () => void;
  transfer: ITransfer | null;
}

export function EditTransferDialog({
  open,
  onOpenChange,
  onTransferUpdated,
  transfer,
}: EditTransferDialogProps) {
  const t = useTranslations("transfers");
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState<IStock[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [staffList, setStaffList] = useState<IStaff[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [itemsPage, setItemsPage] = useState(1);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [loadingMoreItems, setLoadingMoreItems] = useState(false);

  // Multi-item state
  const [transferItems, setTransferItems] = useState<ITransferItem[]>([]);

  const [formData, setFormData] = useState({
    status: "pending" as "pending" | "in_progress" | "arrived" | "canceled",
    assignedTo: "",
    startTime: "",
  });

  // Populate form from existing transfer
  useEffect(() => {
    if (transfer) {
      setFormData({
        status: transfer.status,
        assignedTo:
          typeof transfer.assignedTo === "object"
            ? transfer.assignedTo?._id
            : transfer.assignedTo || "",
        startTime: transfer.startTime
          ? new Date(transfer.startTime).toISOString().slice(0, 16)
          : "",
      });

      // Map existing items to the new format
      const existingItems: ITransferItem[] = (transfer.items || []).map(
        (item: any) => ({
          stockItemId:
            typeof item === "object" ? item.stockItem?._id || item._id || item.stockItem : item,
          quantity: item.quantity || 1,
        })
      );
      setTransferItems(
        existingItems.length > 0
          ? existingItems
          : [{ stockItemId: "", quantity: 1 }]
      );
    }
  }, [transfer]);

  useEffect(() => {
    if (open) {
      fetchStocks();
      fetchCategories();
    }
  }, [open]);

  useEffect(() => {
    const fromId =
      typeof transfer?.takenFrom === "object"
        ? transfer?.takenFrom?._id
        : transfer?.takenFrom;
    if (fromId) {
      fetchStockItems(fromId, 1, false, selectedCategory);
    } else {
      setStockItems([]);
      setItemsPage(1);
      setHasMoreItems(true);
    }
  }, [transfer, selectedCategory]);

  const fetchStocks = async () => {
    const { success, stocks: fetchedStocks } = await getStocks();
    if (success) {
      setStocks(fetchedStocks || []);
    }
    const staffRes = await getStuff();
    if (staffRes.success) {
      setStaffList(staffRes.staffs || []);
    }
  };

  const fetchCategories = async () => {
    const { success, categories: fetchedCategories } = await getCategories();
    if (success) {
      setCategories(fetchedCategories || []);
    }
  };

  const fetchStockItems = async (
    stockId: string,
    page = 1,
    append = false,
    category = "all"
  ) => {
    setLoadingMoreItems(true);
    const params: any = { stock: stockId, limit: 50, page };
    if (category && category !== "all") {
      params.category = category;
    }

    const { success, stockItems: items, pages } = await getStockItems(params);
    if (success) {
      let safeItems = items || [];

      // Ensure pre-existing items appear in the dropdown even if filtered
      if (!append && transfer && Array.isArray(transfer.items)) {
        const preloaded = transfer.items
          .map((i: any) => (typeof i === "object" ? i.stockItem || i : null))
          .filter(Boolean);
        const missing = preloaded.filter(
          (pre: any) => !safeItems.find((s: any) => s._id === (pre._id || pre))
        );
        safeItems = [...missing, ...safeItems];
      }

      setStockItems((prev) => (append ? [...prev, ...safeItems] : safeItems));
      setItemsPage(page);
      setHasMoreItems(page < (pages || 1));
    }
    setLoadingMoreItems(false);
  };

  const loadMoreItems = async () => {
    const fromId =
      typeof transfer?.takenFrom === "object"
        ? transfer?.takenFrom?._id
        : transfer?.takenFrom;
    if (!fromId || loadingMoreItems || !hasMoreItems) return;
    await fetchStockItems(fromId, itemsPage + 1, true, selectedCategory);
  };

  // Duplicate prevention
  const selectedStockItemIds = new Set(
    transferItems.map((i) => i.stockItemId).filter(Boolean)
  );

  const addTransferItem = () => {
    setTransferItems((prev) => [...prev, { stockItemId: "", quantity: 1 }]);
  };

  const removeTransferItem = (index: number) => {
    if (transferItems.length <= 1) return;
    setTransferItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateTransferItem = (
    index: number,
    field: keyof ITransferItem,
    value: string | number
  ) => {
    setTransferItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transfer) return;

    if (!formData.startTime) {
      toast.error(t("fillAllFields"));
      return;
    }

    if (transferItems.some((item) => !item.stockItemId)) {
      toast.error(t("fillAllFields"));
      return;
    }

    if (transferItems.some((item) => item.quantity < 1)) {
      toast.error(t("fillAllFields"));
      return;
    }

    setLoading(true);
    const { success, message } = await updateTransfer(transfer._id, {
      items: transferItems.map((item) => ({
        stockItem: item.stockItemId,
        quantity: item.quantity,
      })),
      status: formData.status,
      assignedTo: formData.assignedTo,
      startTime: formData.startTime,
    });
    setLoading(false);

    if (success) {
      toast.success(t("transferUpdated"));
      onTransferUpdated();
    } else {
      toast.error(message);
    }
  };

  const fromName =
    typeof transfer?.takenFrom === "object"
      ? transfer?.takenFrom?.name
      : transfer?.takenFrom || "N/A";
  const toName =
    typeof transfer?.takenTo === "object"
      ? transfer?.takenTo?.name
      : transfer?.takenTo || "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{t("editTransfer")}</DialogTitle>
              <DialogDescription>{t("editTransferDescription")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source stock (read-only) */}
          <div className="space-y-2">
            <Label>{t("fromStock")}</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">{fromName}</p>
              <p className="text-xs text-muted-foreground">
                {typeof transfer?.takenFrom === "object"
                  ? transfer?.takenFrom?.location
                  : ""}
              </p>
            </div>
          </div>

          {/* Destination stock (read-only) */}
          <div className="space-y-2">
            <Label>{t("toStock")}</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">{toName}</p>
              <p className="text-xs text-muted-foreground">
                {typeof transfer?.takenTo === "object"
                  ? transfer?.takenTo?.location
                  : ""}
              </p>
            </div>
          </div>

          {/* Transfer Items */}
          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader className="pb-3 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">
                  {t("selectItems")}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* Category filter */}
                  <Select
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                    }}
                  >
                    <SelectTrigger className="h-8 w-[140px] text-xs">
                      <SelectValue placeholder={t("selectCategory")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("allCategories")}</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addTransferItem}
                    className="gap-1 rounded-full border-2 border-input h-8 px-3 text-xs"
                  >
                    <Plus className="h-3 w-3" />
                    {t("addItem") || "Add Item"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="space-y-3">
                {transferItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 border rounded-xl bg-card"
                  >
                    {/* Stock Item Select */}
                    <div className="flex-1 space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        {t("product") || "Product"}
                      </Label>
                      <StockItemSelect
                        stockItems={stockItems}
                        selectedStockItem={stockItems.find(si => si._id === item.stockItemId) || null}
                        onSelect={(selectedItem) =>
                          updateTransferItem(index, "stockItemId", selectedItem?._id || "")
                        }
                        placeholder={t("selectItemsPlaceholder")}
                        className="h-10 w-full"
                        isLoading={loadingMoreItems}
                        onLoadMore={loadMoreItems}
                        hasMore={hasMoreItems}
                        selectedItemIds={selectedStockItemIds}
                      />
                    </div>

                    {/* Quantity */}
                    <div className="w-24 space-y-1.5">
                      <Label className="text-xs font-medium text-muted-foreground">
                        {t("quantity")}
                      </Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateTransferItem(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="border-2 h-10 px-3 py-2"
                      />
                    </div>

                    {/* Remove */}
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeTransferItem(index)}
                      disabled={transferItems.length <= 1}
                      className="text-destructive hover:text-destructive border-2 border-input w-10 h-10 rounded-full self-end mb-0.5"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">{t("status")}</Label>
            <Select
              value={formData.status}
              onValueChange={(
                value: "pending" | "in_progress" | "arrived" | "canceled"
              ) => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
                <SelectItem value="arrived">{t("arrived")}</SelectItem>
                <SelectItem value="canceled">{t("canceled")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">{t("assignedTo")}</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(value) =>
                setFormData({ ...formData, assignedTo: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectStaffMember")} />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((staff) => (
                  <SelectItem key={staff._id} value={staff._id}>
                    {staff.fullname} ({staff.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Time */}
          <div className="space-y-2">
            <Label htmlFor="startTime" className="text-sm font-medium">
              {t("startTime")} <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={formData.startTime.split("T")[0] || ""}
                onChange={(e) => {
                  const date = e.target.value;
                  const time = formData.startTime.split("T")[1] || "00:00";
                  setFormData({
                    ...formData,
                    startTime: date ? `${date}T${time}` : "",
                  });
                }}
                className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg flex-1"
                required
              />
              <CustomTimePicker
                value={formData.startTime.split("T")[1] || ""}
                onChange={(time) => {
                  const date =
                    formData.startTime.split("T")[0] ||
                    new Date().toISOString().split("T")[0];
                  setFormData({ ...formData, startTime: `${date}T${time}` });
                }}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.startTime ||
                transferItems.some((item) => !item.stockItemId)
              }
            >
              {loading ? t("updating") : t("update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
