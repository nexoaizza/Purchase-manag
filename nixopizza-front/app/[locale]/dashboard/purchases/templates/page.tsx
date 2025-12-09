"use client";
import { useEffect, useState } from "react";
import { listTemplates, deleteTemplate, PurchaseTemplateDTO } from "@/lib/apis/purchase-templates";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import TemplateEditorDialog from "@/components/purchases/templates/template-editor-dialog";
import toast from "react-hot-toast";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<PurchaseTemplateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEditor, setOpenEditor] = useState(false);
  const [editing, setEditing] = useState<PurchaseTemplateDTO | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const res = await listTemplates({ limit: 100 });
    if (res.success) setTemplates(res.templates || []);
    else toast.error(res.message || "Failed to load templates");
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const onSaved = (tpl: PurchaseTemplateDTO) => {
    // refresh list
    fetchData();
  };

  const onDelete = async (id: string) => {
    const res = await deleteTemplate(id);
    if (res.success) { toast.success("Template deleted"); fetchData(); }
    else toast.error(res.message || "Failed to delete template");
  };

  return (
    <DashboardLayout>
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-heading">Purchase Templates</h1>
        <Button onClick={() => { setEditing(null); setOpenEditor(true); }}>Create Template</Button>
      </div>

      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : templates.length === 0 ? (
        <div className="text-muted-foreground">No templates yet. Create your first one.</div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Name</th>
                <th className="text-left p-2">Description</th>
                <th className="text-left p-2">Items</th>
                <th className="p-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t._id} className="border-t">
                  <td className="p-2 font-medium">{t.name}</td>
                  <td className="p-2 text-muted-foreground">{t.description}</td>
                  <td className="p-2">{t.items.length}</td>
                  <td className="p-2 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditing(t); setOpenEditor(true); }}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(t._id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <TemplateEditorDialog open={openEditor} onOpenChange={setOpenEditor} onSaved={onSaved} initial={editing} />
    </div>
    </DashboardLayout>
  );
}
