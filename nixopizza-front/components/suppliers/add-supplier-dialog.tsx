"use client";

import * as React from "react";
import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCategories } from "@/lib/apis/categories";
import { create_supplier } from "@/lib/apis/suppliers";
import toast from "react-hot-toast";
import { CategorySelect } from "../ui/category-select";
import { ICategory } from "@/app/[locale]/dashboard/categories/page";
import { useTranslations } from "next-intl";

export function AddSupplierDialog({
  onAdding,
}: {
  onAdding: (supplier: any) => void;
}) {
  const t = useTranslations("suppliers")
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { success, categories, message } = await getCategories();
        if (success) {
          setCategories(categories);
        } else {
          console.log("Failed to Load Categories:", message);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "", // optional
    phone1: "",
    phone2: "",
    phone3: "",
    address: "",
    city: "",
    categoryIds: [] as string[],
    isActive: true,
    notes: "",
  });

  const handleSubmit = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);
    try {
      const supplierData = new FormData();
      supplierData.append("name", formData.name);
      supplierData.append("contactPerson", formData.contactPerson);
      if (formData.email.trim() !== "")
        supplierData.append("email", formData.email);
      supplierData.append("phone1", formData.phone1);
      if (formData.phone2) supplierData.append("phone2", formData.phone2);
      if (formData.phone3) supplierData.append("phone3", formData.phone3);
      supplierData.append("address", formData.address);
      if (formData.city) supplierData.append("city", formData.city);
      supplierData.append("isActive", formData.isActive.toString());
      supplierData.append("notes", formData.notes);
      formData.categoryIds.forEach((id) => supplierData.append("categoryIds", id));
      if (image) supplierData.append("image", image);

      const result = await create_supplier(supplierData);
      onAdding(result.supplier);
      toast.success(t("supplierCreatedSuccess"));
      resetForm();
      setOpen(false);
    } catch (err: any) {
      toast.error(err?.message || t("failedToAddSupplier"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleAddCategory = (category: ICategory | null) => {
    if (category && !formData.categoryIds.includes(category._id)) {
      setFormData((prev) => ({
        ...prev,
        categoryIds: [...prev.categoryIds, category._id],
      }));
    }
  };

  const handleRemoveCategory = (index: number) =>
    setFormData((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.filter((_, i) => i !== index),
    }));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
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

  const resetForm = () => {
    setFormData({
      name: "",
      contactPerson: "",
      email: "",
      phone1: "",
      phone2: "",
      phone3: "",
      address: "",
      city: "",
      categoryIds: [],
      isActive: true,
      notes: "",
    });
    setImage(null);
    setImagePreview(null);
  };

  const handleDialogChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const availableCategories = categories.filter(
    (cat) => !formData.categoryIds.includes(cat._id)
  );

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t("addSupplier")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">
            {t("addNewSupplier")}
          </DialogTitle>
          <DialogDescription>
            {t("addSupplierDesc")}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="space-y-6"
        >
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

          {/* Image */}
          <div className="space-y-2">
            <Label>{t("supplierImageOptional")}</Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Preview"
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
                  htmlFor="image-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90"
                >
                  <Upload className="h-4 w-4" />
                  {imagePreview ? t("changeImage") : t("uploadImage")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("imageUploadInfo")}
                </p>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <Label>{t("categories")}</Label>
            <CategorySelect
              categories={availableCategories}
              selectedCategory={null}
              onSelect={(c) => handleAddCategory(c as unknown as ICategory | null)}
              placeholder={t("selectCategoriesPlaceholder")}
              className="border rounded-lg"
              isLoading={false}
            />
            {formData.categoryIds.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.categoryIds.map((id, idx) => {
                  const cat = categories.find((c) => c._id === id);
                  return (
                    <Badge
                      key={id}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      {cat?.name || id}
                      <button
                        type="button"
                        onClick={() => handleRemoveCategory(idx)}
                        className="hover:bg-muted rounded-sm p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              {t("statusLabel")}
            </Label>
            <Select
              value={formData.isActive ? "Active" : "Inactive"}
              onValueChange={(v) =>
                handleInputChange("isActive", v === "Active")
              }
            >
              <SelectTrigger className="py-5 border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg">
                <SelectValue placeholder={t("statusLabel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">{t("activeLabel")}</SelectItem>
                <SelectItem value="Inactive">{t("inactiveLabel")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              {t("notes")}
            </Label>
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
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full px-6"
            >
              {isSubmitting ? t("updatingStatus") : t("addSupplierButton")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}