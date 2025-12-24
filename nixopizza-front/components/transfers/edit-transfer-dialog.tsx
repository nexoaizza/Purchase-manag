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
import { updateTransfer, ITransfer } from "@/lib/apis/transfers";

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
  const [formData, setFormData] = useState({
    quantity: 1,
    status: "pending" as "pending" | "arrived",
  });

  useEffect(() => {
    if (transfer) {
      setFormData({
        quantity: transfer.quantity,
        status: transfer.status,
      });
    }
  }, [transfer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transfer || formData.quantity < 1) {
      toast.error(t("fillAllFields"));
      return;
    }

    setLoading(true);
    const { success, message } = await updateTransfer(transfer._id, formData);
    setLoading(false);

    if (success) {
      toast.success(t("transferUpdated"));
      onTransferUpdated();
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
              <DialogTitle>{t("editTransfer")}</DialogTitle>
              <DialogDescription>{t("editTransferDescription")}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("fromStock")}</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                {transfer?.takenFrom?.name || "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">
                {transfer?.takenFrom?.location}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("toStock")}</Label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm font-medium">
                {transfer?.takenTo?.name || "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">
                {transfer?.takenTo?.location}
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
            <Label htmlFor="status">{t("status")}</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "pending" | "arrived") =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t("pending")}</SelectItem>
                <SelectItem value="arrived">{t("arrived")}</SelectItem>
              </SelectContent>
            </Select>
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
