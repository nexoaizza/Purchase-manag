"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listTemplates, PurchaseTemplateDTO } from "@/lib/apis/purchase-templates";
import toast from "react-hot-toast";

export default function LoadTemplateDialog({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (tpl: PurchaseTemplateDTO) => void;
}) {
  const [templates, setTemplates] = useState<PurchaseTemplateDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      const res = await listTemplates({ limit: 200 });
      if (res.success) setTemplates(res.templates || []);
      else toast.error(res.message || "Failed to load templates");
      setLoading(false);
    })();
  }, [open]);

  const handleApply = () => {
    const tpl = templates.find((t) => t._id === selectedId);
    if (!tpl) return toast.error("Please select a template");
    onPick(tpl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Load Template</DialogTitle>
          <DialogDescription>Select a saved template to prefill items.</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Template</Label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder={loading ? "Loading..." : "Choose a template"} />
            </SelectTrigger>
            <SelectContent>
              {(templates || []).map((t) => (
                <SelectItem key={t._id} value={t._id}>
                  {t.name} • {t.items.length} items
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" onClick={handleApply} disabled={!selectedId}>Apply</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
