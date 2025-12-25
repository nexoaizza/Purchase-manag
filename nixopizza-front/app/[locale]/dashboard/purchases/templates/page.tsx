"use client";
import { useEffect, useState } from "react";
import { listTemplates, PurchaseTemplateDTO } from "@/lib/apis/purchase-templates";
import toast from "react-hot-toast";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TemplatesHeader } from "@/components/purchases/templates/templates-header";
import { TemplatesTable } from "@/components/purchases/templates/templates-table";
import TemplateEditorDialog from "@/components/purchases/templates/template-editor-dialog";

import { useTranslations } from "next-intl";

export default function TemplatesPage() {
  const t = useTranslations("templates");
  const [templates, setTemplates] = useState<PurchaseTemplateDTO[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<PurchaseTemplateDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [openEditor, setOpenEditor] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    setLoading(true);
    const res = await listTemplates({ limit: 100 });
    if (res.success) {
      setTemplates(res.templates || []);
      setFilteredTemplates(res.templates || []);
    } else {
      toast.error(res.message || "Failed to load templates");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTemplates(templates);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredTemplates(
        templates.filter((t) =>
          t.name.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, templates]);

  const onSaved = () => {
    fetchData();
    setOpenEditor(false);
  };

  const handleCreateClick = () => {
    setOpenEditor(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <TemplatesHeader
          onSearchChange={setSearchQuery}
          onCreateClick={handleCreateClick}
        />
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>
        ) : (
          <TemplatesTable
            templates={filteredTemplates}
            setTemplates={setTemplates}
            onRefresh={fetchData}
          />
        )}
      </div>
      <TemplateEditorDialog
        open={openEditor}
        onOpenChange={setOpenEditor}
        onSaved={onSaved}
        initial={null}
      />
    </DashboardLayout>
  );
}
