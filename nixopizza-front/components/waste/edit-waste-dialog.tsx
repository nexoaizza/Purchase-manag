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
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";
import { updateWaste, IWaste } from "@/lib/apis/waste";

interface EditWasteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWasteUpdated: () => void;
  waste: IWaste | null;
}

export function EditWasteDialog({
  open,
  onOpenChange,
  onWasteUpdated,
  waste,
}: EditWasteDialogProps) {
  const t = useTranslations("waste");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 1,
    reason: "",
  });

  useEffect(() => {
    if (waste) {
      setFormData({
        quantity: waste.quantity,
        reason: waste.reason,
      });
    }
  }, [waste]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!waste || !formData.reason || formData.quantity < 1) {
      toast.error(t("fillAllFields"));
      return;
    }

    setLoading(true);
    const { success, message } = await updateWaste(waste._id, formData);
    setLoading(false);

    if (success) {
      toast.success(t("wasteUpdated"));
      onWasteUpdated();
    } else {
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-destructive/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>{t("editWaste")}</DialogTitle>
              <DialogDescription>{t("editWasteDescription")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("product")}</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                {waste?.product?.name || "N/A"}
              </p>
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
            <Label htmlFor="reason">{t("reason")}</Label>
            <Textarea
              id="reason"
              placeholder={t("reasonPlaceholder")}
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t("stock")}</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                {waste?.stock?.name ? `${waste.stock.name} - ${waste.stock.location}` : t("noStock")}
              </p>
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
            <Button type="submit" disabled={loading}>
              {loading ? t("updating") : t("update")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
