"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listTemplates, PurchaseTemplateDTO } from "@/lib/apis/purchase-templates";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export default function LoadTemplateDialog({
  open,
  onOpenChange,
  onPick,
  supplierId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (tpl: PurchaseTemplateDTO) => void;
  supplierId?: string;
}) {
  const t = useTranslations("purchases");
  const [templates, setTemplates] = useState<PurchaseTemplateDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const res = await listTemplates({ limit: 200 });
      if (res.success) {
        let tpls = res.templates || [];
        if (supplierId) {
          tpls = tpls.filter((t) => {
            const tplSupplierId = typeof t.supplierId === "string" ? t.supplierId : (t.supplierId as any)?._id;
            return tplSupplierId === supplierId;
          });
        }
        setTemplates(tpls);
      } else {
        toast.error(res.message || t("failedLoadTemplates"));
      }
      setLoading(false);
    })();
  }, [open, supplierId]);

  const handleApply = () => {
    const tpl = templates.find((t) => t._id === selectedId);
    if (!tpl) return toast.error(t("selectTemplateError"));
    onPick(tpl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{t("loadTemplateTitle")}</DialogTitle>
          <DialogDescription>{t("loadTemplateDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>{t("templateLabel")}</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? t("loadingTemplates") : t("chooseTemplate")} />
            </SelectTrigger>
            <SelectContent>
              {(templates || []).map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  {t.name} • {t.items.length} {t("templateItems")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("cancelButton")}</Button>
          <Button type="button" onClick={handleApply} disabled={!selectedId}>{t("applyButton")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
