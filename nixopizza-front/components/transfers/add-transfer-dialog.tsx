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
import { ArrowRightLeft } from "lucide-react";
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
  const [formData, setFormData] = useState({
    items: [] as string[],
    takenFrom: "",
    takenTo: "",
    quantity: 1,
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
    const params: any = { stock: stockId, limit: 50, page };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isFormValid =
      formData.takenFrom &&
      formData.takenTo &&
      formData.items.length > 0 &&
      formData.quantity >= 1 &&
      formData.assignedTo &&
      formData.startTime;

    if (!isFormValid) {
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

    setLoading(true);
    const { success, message } = await createTransfer(formData);
    setLoading(false);

    if (success) {
      toast.success(t("transferCreated"));
      setFormData({ 
        items: [], 
        takenFrom: "", 
        takenTo: "", 
        quantity: 1,
        status: "pending" as any,
        assignedTo: "",
        startTime: "",
      });
      setSelectedCategory("all");
      setStockItems([]);
      setItemsPage(1);
      setHasMoreItems(true);
      onTransferCreated();
    } else {
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
          <div className="space-y-2">
            <Label htmlFor="takenFrom">{t("fromStock")}</Label>
            <Select
              value={formData.takenFrom}
              onValueChange={(value) =>
                setFormData({ ...formData, takenFrom: value, items: [] })
              }
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

          <div className="space-y-2">
            <Label htmlFor="items">{t("selectItems")}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Select
                value={selectedCategory}
                onValueChange={(value) => {
                  setSelectedCategory(value);
                  setFormData({ ...formData, items: [] });
                }}
              >
                <SelectTrigger>
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
              <Select
                value={formData.items[0] || ""}
                onValueChange={(value) =>
                  setFormData({ ...formData, items: [value] })
                }
                disabled={!formData.takenFrom}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("selectItemsPlaceholder")} />
                </SelectTrigger>
                <SelectContent
                  className="max-h-72 overflow-y-auto"
                  onScrollCapture={(event) => {
                    const target = event.target as HTMLElement;
                    if (target.scrollTop + target.clientHeight >= target.scrollHeight - 24) {
                      loadMoreItems();
                    }
                  }}
                >
                  {stockItems.map((item) => (
                    <SelectItem key={item._id} value={item._id}>
                      {item.product?.name || "Unknown"} - Qty: {item.quantity}
                    </SelectItem>
                  ))}
                  {loadingMoreItems && (
                    <div className="px-2 py-2 text-xs text-muted-foreground">
                      {t("loadingMore")}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">{t("quantity")}</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              placeholder={t("quantityPlaceholder")}
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })
              }
              required
            />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="startTime">{t("startTime")}</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              required
            />
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="startTime">{t("startTime")}</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              required
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? t("creating") : t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
