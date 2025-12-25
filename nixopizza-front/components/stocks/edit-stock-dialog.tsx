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
import { Textarea } from "@/components/ui/textarea";
import { Warehouse } from "lucide-react";
import toast from "react-hot-toast";
import { updateStock, IStock } from "@/lib/apis/stocks";

interface EditStockDialogProps {
  stock: IStock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStockUpdated: () => void;
}

export function EditStockDialog({
  stock,
  open,
  onOpenChange,
  onStockUpdated,
}: EditStockDialogProps) {
  const t = useTranslations("stocks");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    location: "",
  });

  useEffect(() => {
    if (stock) {
      setFormData({
        name: stock.name,
        description: stock.description,
        location: stock.location,
      });
    }
  }, [stock]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stock || !formData.name || !formData.description || !formData.location) {
      toast.error(t("fillAllFields"));
      return;
    }

    setLoading(true);
    const { success, message } = await updateStock(stock._id, formData);
    setLoading(false);

    if (success) {
      toast.success("Stock updated successfully");
      onStockUpdated();
      onOpenChange(false);
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
              <Warehouse className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Edit Stock</DialogTitle>
              <DialogDescription>Update stock warehouse information</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t("stockName")}</Label>
            <Input
              id="name"
              placeholder={t("stockNamePlaceholder")}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("description")}</Label>
            <Textarea
              id="description"
              placeholder={t("descriptionPlaceholder")}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">{t("location")}</Label>
            <Input
              id="location"
              placeholder={t("locationPlaceholder")}
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
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
              {loading ? "Updating..." : "Update Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
