"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCategories } from "@/lib/apis/categories";
import { ICategory } from "@/app/[locale]/dashboard/categories/page";
import { CategorySelect } from "../ui/category-select";
import { updateSupplier } from "@/lib/apis/suppliers";
import toast from "react-hot-toast";
import { resolveImage } from "@/lib/resolveImage";
import { ISupplier } from "@/app/[locale]/dashboard/suppliers/page";
import { useTranslations } from "next-intl";

interface SupplierEditDialogProps {
  supplier: ISupplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleUpdateSupplier: (supplier: ISupplier) => void;
}

export function SupplierEditDialog({
  supplier,
  open,
  onOpenChange,
  handleUpdateSupplier,
}: SupplierEditDialogProps) {
  const t = useTranslations("suppliers")
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ICategory[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone1: "",
    phone2: "",
    phone3: "",
    address: "",
    city: "",
    isActive: true,
    notes: "",
    categoryIds: [] as string[],
  });

  useEffect(() => {
    const fetchCategories = async () => {
      const { success, categories, message } = await getCategories();
      if (success) {
        setCategories(categories);
      } else {
        console.log("Failed to Load Categories:", message);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email || "",
        phone1: supplier.phone1,
        phone2: supplier.phone2 || "",
        phone3: supplier.phone3 || "",
        address: supplier.address,
        city: supplier.city || "",
        isActive: supplier.isActive,
        notes: supplier.notes || "",
        categoryIds: supplier.categoryIds,
      });

      const supplierCategories = categories.filter((cat) =>
        supplier.categoryIds.includes(cat._id)
      );
      setSelectedCategories(supplierCategories);

      if (supplier.image) {
        setImagePreview(resolveImage(supplier.image));
      }
    } else {
      setFormData({
        name: "",
        contactPerson: "",
        email: "",
        phone1: "",
        phone2: "",
        phone3: "",
        address: "",
        city: "",
        isActive: true,
        notes: "",
        categoryIds: [],
      });
      setSelectedCategories([]);
      setImage(null);
      setImagePreview(null);
    }
  }, [supplier, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;

    const supplierData = new FormData();
    supplierData.append("name", formData.name);
    supplierData.append("contactPerson", formData.contactPerson);

    if (formData.email.trim() !== "") {
      supplierData.append("email", formData.email.trim());
    } else if (supplier.email && formData.email.trim() === "") {
      // user cleared existing email
      supplierData.append("removeEmail", "true");
    }

    supplierData.append("phone1", formData.phone1);
    if (formData.phone2) supplierData.append("phone2", formData.phone2);
    if (formData.phone3) supplierData.append("phone3", formData.phone3);
    supplierData.append("address", formData.address);
    if (formData.city) supplierData.append("city", formData.city);
    supplierData.append("isActive", formData.isActive.toString());
    supplierData.append("notes", formData.notes);

    formData.categoryIds.forEach((id) => {
      supplierData.append("categoryIds", id);
    });

    if (image) supplierData.append("image", image);

    const { success, message, supplier: updatedSupplier } = await updateSupplier(
      supplier._id,
      supplierData
    );
    if (success) {
      handleUpdateSupplier(updatedSupplier);
      toast.success(t("updatedSuccessfully"));
      setImage(null);
      setImagePreview(resolveImage(updatedSupplier.image));
      onOpenChange(false);
    } else {
      toast.error(message);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleStatusChange = (value: string) => {
    handleInputChange("isActive", value === "Active");
  };

  const handleAddCategory = (category: ICategory | null) => {
    if (category && !formData.categoryIds.includes(category._id)) {
      setFormData((prev) => ({
        ...prev,
        categoryIds: [...prev.categoryIds, category._id],
      }));
      setSelectedCategories((prev) => [...prev, category]);
    }
  };

  const handleRemoveCategory = (index: number) => {
    const updatedCategoryIds = formData.categoryIds.filter((_, i) => i !== index);
    const updatedSelectedCategories = selectedCategories.filter(
      (_, i) => i !== index
    );
    setFormData((prev) => ({
      ...prev,
      categoryIds: updatedCategoryIds,
    }));
    setSelectedCategories(updatedSelectedCategories);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match("image.*")) {
        toast.error(t("selectImageFile"));
        return;
      }
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const availableCategories = categories.filter(
    (cat) => !formData.categoryIds.includes(cat._id)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {supplier ? t("editing") : t("addNewSupplier")}
          </DialogTitle>
          <DialogDescription>
            {supplier
              ? t("editingDesc")
              : t("addSupplierDesc")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                {t("companyName")}
              </Label>
              <Input
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t("companyNamePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson" className="text-sm font-medium">
                {t("contactPersonField")}
              </Label>
              <Input
                value={formData.contactPerson}
                onChange={(e) =>
                  handleInputChange("contactPerson", e.target.value)
                }
                placeholder={t("contactPersonPlaceholder")}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t("emailField")}
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="supplier@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("phone1Required")}</Label>
              <Input
                value={formData.phone1}
                onChange={(e) => handleInputChange("phone1", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>{t("phone2Optional")}</Label>
              <Input
                value={formData.phone2}
                onChange={(e) => handleInputChange("phone2", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("phone3Optional")}</Label>
              <Input
                value={formData.phone3}
                onChange={(e) => handleInputChange("phone3", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>{t("addressRequired")}</Label>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("cityOptional")}</Label>
              <Input
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("supplierImageOptional")}</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Supplier preview"
                    className="object-cover w-full h-full"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-24 h-24 border-2 border-dashed rounded-xl bg-muted/20">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="supplier-edit-image-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90"
                >
                  <Upload className="h-4 w-4" />
                  {imagePreview ? t("changeImage") : t("uploadImage")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("imageUploadInfo")}
                </p>
                <Input
                  id="supplier-edit-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("categories")}</Label>
            <CategorySelect
              categories={availableCategories}
              selectedCategory={null}
              onSelect={(category: any) =>
                handleAddCategory(category as ICategory | null)
              }
              placeholder={t("selectCategoriesPlaceholder")}
              className="border rounded-lg"
              isLoading={false}
            />
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedCategories.map((category, index) => (
                  <Badge
                    key={category._id}
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    {category.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(index)}
                      className="hover:bg-muted rounded-sm p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("statusLabel")}</Label>
            <Select
              value={formData.isActive ? "Active" : "Inactive"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectStatusPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">{t("activeLabel")}</SelectItem>
                <SelectItem value="Inactive">{t("inactiveLabel")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t("notesOptionalLabel")}</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit" className="rounded-full px-6">
              {supplier ? t("updateSupplier") : t("addSupplierButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}