// components/ui/supplier-edit-dialog.tsx
"use client";

import type React from "react";
import { useState, useEffect } from "react";
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
import { ISupplier } from "@/app/[locale]/dashboard/suppliers/page";
import { useTranslations } from "next-intl";

interface SupplierEditDialogProps {
  supplier: ISupplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  handleUpdateSupplier: any;
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
    phone: "",
    address: "",
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
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        isActive: supplier.isActive,
        notes: supplier.notes || "",
        categoryIds: supplier.categoryIds,
      });

      // Set selected categories based on supplier's category IDs
      const supplierCategories = categories.filter((cat) =>
        supplier.categoryIds.includes(cat._id)
      );
      setSelectedCategories(supplierCategories);

      // Set image preview if supplier has an image
      if (supplier.image) {
        setImagePreview(process.env.NEXT_PUBLIC_BASE_URL + supplier.image);
      }
    } else {
      // Reset form when no supplier is provided
      setFormData({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
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

    const supplierData = new FormData();
    supplierData.append("name", formData.name);
    supplierData.append("contactPerson", formData.contactPerson);
    supplierData.append("email", formData.email);
    supplierData.append("phone", formData.phone);
    supplierData.append("address", formData.address);
    supplierData.append("isActive", formData.isActive.toString()); // Convert to string
    supplierData.append("notes", formData.notes);

    // Add categories
    formData.categoryIds.forEach((id) => {
      supplierData.append("categoryIds", id);
    });

    // Add image if provided
    if (image) {
      supplierData.append("image", image);
    }

    // Handle form submission
    console.log("Updating supplier:", supplierData);
    const {
      success,
      message,
      supplier: updatedSupplier,
    } = await updateSupplier(supplier?._id || "", supplierData);
    if (success) {
      handleUpdateSupplier(updatedSupplier);
      toast.success(t("updatedSuccessfully"));
      setImage(null);
      setImagePreview(null);
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
    const updatedCategoryIds = formData.categoryIds.filter(
      (_, i) => i !== index
    );
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
      // Validate file type
      if (!file.type.match("image.*")) {
        alert("Please select an image file");
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

  // Filter out already selected categories
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
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t("companyNamePlaceholder")}
                required
                className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson" className="text-sm font-medium">
                {t("contactPersonField")}
              </Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) =>
                  handleInputChange("contactPerson", e.target.value)
                }
                placeholder={t("contactPersonPlaceholder")}
                required
                className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t("emailField")}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                {t("phoneField")}
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder={t("phonePlaceholder")}
                required
                className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              {t("addressField")}
            </Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder={t("addressPlaceholder")}
              required
              className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image" className="text-sm font-medium">
              {t("supplierImage")}
            </Label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-input shadow-sm">
                  <img
                    src={imagePreview}
                    alt="Supplier preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80 shadow-sm"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-input rounded-xl bg-muted/20">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
              )}

              <div className="flex flex-col gap-2">
                <Label
                  htmlFor="image-upload"
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <Upload className="h-4 w-4" />
                  {imagePreview ? t("changeImage") : t("uploadImage")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG up to 5MB
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                {t("categories")}
              </Label>
              <CategorySelect
                categories={availableCategories}
                selectedCategory={null}
                onCategoryChange={handleAddCategory}
                placeholder={t("selectCategories")}
                className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg"
              />
              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedCategories.map((category, index) => (
                    <Badge
                      className="py-1 pl-2 pr-1 relative rounded-md"
                      variant="outline"
                      key={category._id}
                    >
                      {category.name}
                      <button
                        type="button"
                        className="ml-1 hover:bg-muted rounded-sm p-0.5"
                        onClick={() => handleRemoveCategory(index)}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                {t("status")}
              </Label>
              <Select
                value={formData.isActive ? "Active" : "Inactive"}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger className="py-5 border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">{t("activeStatus")}</SelectItem>
                  <SelectItem value="Inactive">{t("inactiveStatus")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              {t("notes")}
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder={t("notesPlaceholder")}
              rows={3}
              className="resize-y border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full px-4"
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
