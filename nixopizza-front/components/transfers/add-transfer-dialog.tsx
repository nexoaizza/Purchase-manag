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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRightLeft, Plus, Trash2, AlertCircle } from "lucide-react";
import { CustomTimePicker } from "@/components/ui/custom-time-picker";
import toast from "react-hot-toast";
import { createTransfer } from "@/lib/apis/transfers";
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

interface AddTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferCreated: () => void;
}

export function AddTransferDialog({
  open,
  onOpenChange,
  onTransferCreated,
}: AddTransferDialogProps) {
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
  const [transferItems, setTransferItems] = useState<ITransferItem[]>([
    { stockItemId: "", quantity: 1 },
  ]);

  const [formData, setFormData] = useState({
    takenFrom: "",
    takenTo: "",
    assignedTo: "",
    startTime: "",
    status: "pending" as "pending" | "in_progress" | "arrived" | "canceled",
  });

  useEffect(() => {
    if (open) {
      fetchStocks();
      fetchCategories();
    }
  }, [open]);

  useEffect(() => {
    if (formData.takenFrom) {
      fetchStockItems(formData.takenFrom, 1, false, selectedCategory);
    } else {
      setStockItems([]);
      setItemsPage(1);
      setHasMoreItems(true);
    }
  }, [formData.takenFrom, selectedCategory]);

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
    const params: any = {
      stock: stockId,
      limit: 50,
      page,
      excludePendingTransfer: "true",
    };
    if (category && category !== "all") {
      params.category = category;
    }

    const { success, stockItems: items, pages } = await getStockItems(params);
    if (success) {
      const safeItems = items || [];
      setStockItems((prev) => (append ? [...prev, ...safeItems] : safeItems));
      setItemsPage(page);
      setHasMoreItems(page < (pages || 1));
    }
    setLoadingMoreItems(false);
  };

  const loadMoreItems = async () => {
    if (!formData.takenFrom || loadingMoreItems || !hasMoreItems) return;
    await fetchStockItems(formData.takenFrom, itemsPage + 1, true, selectedCategory);
  };

  // Get already-selected stock item IDs to prevent duplicates
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

  const resetForm = () => {
    setFormData({
      takenFrom: "",
      takenTo: "",
      assignedTo: "",
      startTime: "",
      status: "pending",
    });
    setTransferItems([{ stockItemId: "", quantity: 1 }]);
    setSelectedCategory("all");
    setStockItems([]);
    setItemsPage(1);
    setHasMoreItems(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.takenFrom || !formData.takenTo) {
      toast.error(t("fillAllFields"));
      return;
    }

    if (formData.takenFrom === formData.takenTo) {
      toast.error(t("sameStockError"));
      return;
    }

    if (!formData.assignedTo) {
      toast.error(t("fillAllFields"));
      return;
    }

    if (!formData.startTime) {
      toast.error(t("fillAllFields"));
      return;
    }

    // Validate all transfer items
    if (transferItems.some((item) => !item.stockItemId)) {
      toast.error(t("fillAllFields"));
      return;
    }

    if (transferItems.some((item) => item.quantity < 1)) {
      toast.error(t("fillAllFields"));
      return;
    }

    setLoading(true);
    const { success, message } = await createTransfer({
      items: transferItems.map((item) => ({
        stockItem: item.stockItemId,
        quantity: item.quantity,
      })),
      takenFrom: formData.takenFrom,
      takenTo: formData.takenTo,
      status: formData.status,
      assignedTo: formData.assignedTo,
      startTime: formData.startTime,
    });
    setLoading(false);

    if (success) {
      toast.success(t("transferCreated"));
      resetForm();
      onTransferCreated();
    } else {
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ArrowRightLeft className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{t("createNewTransfer")}</DialogTitle>
              <DialogDescription>{t("transferDescription")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Source Stock */}
          <div className="space-y-2">
            <Label htmlFor="takenFrom">{t("fromStock")}</Label>
            <Select
              value={formData.takenFrom}
              onValueChange={(value) => {
                setFormData({ ...formData, takenFrom: value });
                setTransferItems([{ stockItemId: "", quantity: 1 }]);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectSourceStock")} />
              </SelectTrigger>
              <SelectContent>
                {stocks.map((stock) => (
                  <SelectItem key={stock._id} value={stock._id}>
                    {stock.name} - {stock.location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Destination Stock */}
          <div className="space-y-2">
            <Label htmlFor="takenTo">{t("toStock")}</Label>
            <Select
              value={formData.takenTo}
              onValueChange={(value) =>
                setFormData({ ...formData, takenTo: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectDestinationStock")} />
              </SelectTrigger>
              <SelectContent>
                {stocks
                  .filter((stock) => stock._id !== formData.takenFrom)
                  .map((stock) => (
                    <SelectItem key={stock._id} value={stock._id}>
                      {stock.name} - {stock.location}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transfer Items */}
          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader className="px-4">
              <CardTitle className="text-base font-semibold">
                {t("selectItems")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              {/* Category filter + Add button */}
              <div className="flex items-center gap-2 mb-4">
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => {
                    setSelectedCategory(value);
                    setTransferItems([{ stockItemId: "", quantity: 1 }]);
                  }}
                >
                  <SelectTrigger className="h-8 w-[150px] text-xs border-2">
                    <SelectValue placeholder={t("selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allCategories")}</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
 
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTransferItem}
                  disabled={!formData.takenFrom}
                  className="ml-auto h-8 gap-1 text-xs rounded-full border-2"
                >
                  <Plus className="h-3 w-3" />
                  {t("addItem")}
                </Button>
              </div>
 
              {/* Empty states */}
              {!formData.takenFrom && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {t("selectSourceFirst")}
                </div>
              )}
              {formData.takenFrom && stockItems.length === 0 && !loadingMoreItems && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 rounded-lg px-3 py-2.5 border border-amber-200 mt-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {t("noItemsAvailable")}
                </div>
              )}
 
              {/* Item rows */}
              {formData.takenFrom && (
                <div className="space-y-2 mt-2">
                  {/* Column labels — only show when there are items */}
                  {transferItems.length > 0 && stockItems.length > 0 && (
                    <div className="flex items-center gap-2 px-1">
                      <span className="flex-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                        {t("product")}
                      </span>
                      <span className="w-24 text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                        {t("quantity")}
                      </span>
                      <span className="w-10" />
                    </div>
                  )}
 
                  {transferItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2.5 rounded-xl border bg-muted/20"
                    >
                      <Select
                        value={item.stockItemId}
                        onValueChange={(value) =>
                          updateTransferItem(index, "stockItemId", value)
                        }
                        disabled={!formData.takenFrom}
                      >
                        <SelectTrigger className="flex-1 border-2 h-9">
                          <SelectValue placeholder={t("selectItemsPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent
                          className="max-h-56 overflow-y-auto"
                          onScrollCapture={(e) => {
                            const target = e.target as HTMLElement;
                            if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24)
                              loadMoreItems();
                          }}
                        >
                          {stockItems
                            .filter(
                              (si) =>
                                si._id === item.stockItemId ||
                                !selectedStockItemIds.has(si._id)
                            )
                            .map((si) => (
                              <SelectItem key={si._id} value={si._id}>
                                {si.product?.name || "Unknown"} — Qty: {si.quantity}
                              </SelectItem>
                            ))}
                          {loadingMoreItems && (
                            <div className="px-2 py-2 text-xs text-muted-foreground">
                              {t("loadingMore")}
                            </div>
                          )}
                        </SelectContent>
                      </Select>
 
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateTransferItem(index, "quantity", parseInt(e.target.value) || 1)
                        }
                        className="w-24 border-2 h-9 px-3"
                      />
 
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTransferItem(index)}
                        disabled={transferItems.length <= 1}
                        className="w-9 h-9 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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
                <SelectValue placeholder={t("selectStaff")} />
              </SelectTrigger>
              <SelectContent>
                {staffList.map((staff) => (
                  <SelectItem key={staff._id} value={staff._id}>
                    {staff.fullname} - {staff.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">{t("status")}</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "pending" | "in_progress" | "arrived" | "canceled") =>
                setFormData({ ...formData, status: value })
              }
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
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              disabled={loading}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                loading ||
                !formData.takenFrom ||
                !formData.takenTo ||
                !formData.assignedTo ||
                !formData.startTime ||
                transferItems.some((item) => !item.stockItemId)
              }
            >
              {loading ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
