"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, Eye, FileText } from "lucide-react";
import { PurchaseTemplateDTO, deleteTemplate } from "@/lib/apis/purchase-templates";
import TemplateEditorDialog from "./template-editor-dialog";
import TemplateViewDialog from "./template-view-dialog";
import toast from "react-hot-toast";
import { resolveImage } from "@/lib/resolveImage";
import { Pagination } from "@/components/ui/pagination";

import { useTranslations } from "next-intl";

export function TemplatesTable({
  templates,
  setTemplates,
  onRefresh,
}: {
  templates: PurchaseTemplateDTO[];
  setTemplates: React.Dispatch<React.SetStateAction<PurchaseTemplateDTO[]>>;
  onRefresh: () => void;
}) {
  const t = useTranslations("templates");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PurchaseTemplateDTO | null>(null);

  const handleEdit = (template: PurchaseTemplateDTO) => {
    setSelectedTemplate(template);
    setIsEditDialogOpen(true);
  };

  const handleView = (template: PurchaseTemplateDTO) => {
    setSelectedTemplate(template);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    
    const res = await deleteTemplate(templateId);
    if (res.success) {
      toast.success(t("deleteSuccess"));
      setTemplates(templates.filter((t) => t._id !== templateId));
    } else {
      toast.error(res.message || t("deleteError"));
    }
  };

  const handleSaved = () => {
    onRefresh();
    setIsEditDialogOpen(false);
  };

  if (templates.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{t("directoryTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-muted rounded-full">
            <FileText className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-1">{t("noTemplatesFound")}</h3>
          <p className="text-muted-foreground mb-4">
            {t("noTemplatesMessage")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{t("directoryTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("name")}</TableHead>
                  <TableHead>{t("supplier")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead>{t("items")}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => {
                  const supplier = typeof template.supplierId === "object" ? template.supplierId : null;
                  return (
                    <TableRow key={template._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-muted rounded-lg">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="font-medium">{template.name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier ? (
                          <div className="flex items-center gap-2">
                            {supplier.image && (
                              <img
                                src={resolveImage(supplier.image)}
                                alt={supplier.name}
                                className="w-8 h-8 rounded-full object-cover border"
                              />
                            )}
                            <span className="text-sm">{supplier.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {template.description || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium">
                          {template.items.length} item{template.items.length !== 1 ? "s" : ""}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(template)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t("viewDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(template)}>
                              <Edit className="h-4 w-4 mr-2" />
                              {t("edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(template._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TemplateEditorDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSaved={handleSaved}
        initial={selectedTemplate}
      />

      <TemplateViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        template={selectedTemplate}
      />
    </>
  );
}
