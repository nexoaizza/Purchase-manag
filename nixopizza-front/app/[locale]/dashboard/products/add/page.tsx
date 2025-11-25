// app/dashboard/products/add/page.tsx
"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Save, X, Upload, Package } from "lucide-react";
import toast from "react-hot-toast";
import { ICategory } from "../../categories/page";
import { createProduct } from "@/lib/apis/products";
import { CategorySelect } from "@/components/ui/category-select";

export default function AddProductPage() {
  const t = useTranslations("products");
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null
  );

  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    unit: "",
    currentStock: 0,
    minQty: 0,
    recommendedQty: 0,
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      toast.error(t("uploadImageRequired"));
      return;
    }

    if (!selectedCategory) {
      toast.error(t("selectCategoryRequired"));
      return;
    }

    if (!formData.unit) {
      toast.error(t("selectUnitRequired"));
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, String(value));
    });
    data.append("categoryId", selectedCategory._id);
    data.append("image", image);

    const { success, message } = await createProduct(data);

    if (success) {
      toast.success(t("productCreatedSuccessfully"));
      router.push("/dashboard/products");
    } else {
      toast.error(message);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.match("image.*")) {
        toast.error("Please select an image file");
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

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="gap-2 rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("back")}
            </Button>
            <div>
              <h1 className="text-3xl font-heading font-bold text-gray-900">
                {t("addNewProduct")}
              </h1>
              <p className="text-gray-600 mt-1">
                {t("addProductDescription")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/products")}
              className="gap-2 rounded-full px-4"
            >
              <X className="h-4 w-4" />
              {t("cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              className="gap-2 rounded-full px-6 bg-primary hover:bg-primary/90"
            >
              <Save className="h-4 w-4" />
              {t("saveProduct")}
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-heading text-xl">
                    {t("basicInformation")}
                  </CardTitle>
                  <CardDescription>
                    {t("basicInformationDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    {t("productName")} *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={t("productNamePlaceholder")}
                    required
                    className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode" className="text-sm font-medium">
                    {t("barcode")}
                  </Label>
                  <Input
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) =>
                      handleInputChange("barcode", e.target.value)
                    }
                    placeholder={t("barcodePlaceholder")}
                    className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    Category *
                  </Label>
                  <CategorySelect
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    placeholder={t("selectCategory")}
                    className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm font-medium">
                    {t("unit")} *
                  </Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value) => handleInputChange("unit", value)}
                  >
                    <SelectTrigger className="py-5 border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg">
                      <SelectValue placeholder={t("selectUnit")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="liter">{t("unitLiter")}</SelectItem>
                      <SelectItem value="kilogram">{t("unitKilogram")}</SelectItem>
                      <SelectItem value="box">{t("unitBox")}</SelectItem>
                      <SelectItem value="piece">{t("unitPiece")}</SelectItem>
                      <SelectItem value="meter">{t("unitMeter")}</SelectItem>
                      <SelectItem value="pack">{t("unitPack")}</SelectItem>
                      <SelectItem value="bottle">{t("unitBottle")}</SelectItem>

                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Enter product description"
                  rows={3}
                  className="resize-y border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
                />
              </div> */}

              {/* Modern Image Upload */}
              <div className="space-y-2">
                <Label htmlFor="image" className="text-sm font-medium">
                  {t("productImage")} *
                </Label>
                <div className="flex items-center gap-4">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-input shadow-sm">
                      <img
                        src={imagePreview}
                        alt="Product preview"
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
                      {t("imageFormat")}
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
            </CardContent>
          </Card>

          {/* Inventory Management */}
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-heading text-xl">
                    {t("inventoryManagement")}
                  </CardTitle>
                  <CardDescription>
                    {t("inventoryManagementDescription")}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="currentStock" className="text-sm font-medium">
                    {t("initialStock")} *
                  </Label>
                  <Input
                    id="currentStock"
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) =>
                      handleInputChange(
                        "currentStock",
                        Number.parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="0"
                    min="0"
                    required
                    className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minQty" className="text-sm font-medium">
                    {t("minimumStock")} *
                  </Label>
                  <Input
                    id="minQty"
                    type="number"
                    value={formData.minQty}
                    onChange={(e) =>
                      handleInputChange(
                        "minQty",
                        Number.parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="0"
                    min="0"
                    required
                    className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recommendedQty" className="text-sm font-medium">
                    {t("recommendedQuantity")}
                  </Label>
                  <Input
                    id="recommendedQty"
                    type="number"
                    value={formData.recommendedQty}
                    onChange={(e) =>
                      handleInputChange(
                        "recommendedQty",
                        Number.parseInt(e.target.value) || 0
                      )
                    }
                    placeholder="0"
                    min="0"
                    className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
