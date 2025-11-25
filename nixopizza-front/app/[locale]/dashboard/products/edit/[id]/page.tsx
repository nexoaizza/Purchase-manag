// app/dashboard/products/[id]/edit/page.tsx
"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { ArrowLeft, Save, X, Upload } from "lucide-react";
import { getProduct, updateProduct } from "@/lib/apis/products";
import toast from "react-hot-toast";
import { IProduct } from "../../page";
import { ICategory } from "@/app/[locale]/dashboard/categories/page";
import { CategorySelect } from "@/components/ui/category-select";

export default function EditProductPage() {
  const t = useTranslations("products");
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null
  );
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;

  const [formData, setFormData] = useState<IProduct & { image?: File | null }>({
    _id: "",
    name: "",
    imageUrl: "",
    categoryId: {
      _id: "",
      name: "",
      image: "",
    },
    currentStock: 0,
    minQty: 0,
    recommendedQty: 0,
    barcode: "",
    unit: "",
    image: null,
  });

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Fetch product details by id
  useEffect(() => {
    const fetchProduct = async () => {
      const { product, success, message } = await getProduct(productId);
      if (success) {
        setFormData({ ...product, image: null });
        setPreviewImage(process.env.NEXT_PUBLIC_BASE_URL + product.imageUrl);

        // Find and set the selected category
        const category = categories.find(
          (cat) => cat._id === product.categoryId._id
        );
        if (category) {
          setSelectedCategory(category);
        }
      } else {
        toast.error(message);
      }
    };

    if (productId) fetchProduct();
  }, [productId, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory) {
      toast.error(t("selectCategoryRequired"));
      return;
    }

    const form = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === "categoryId") {
          form.append("categoryId", selectedCategory._id);
        } else if (key === "image" && value instanceof File) {
          form.append("image", value);
        } else if (key !== "image") {
          form.append(key, value as any);
        }
      }
    });

    const { success, message } = await updateProduct(productId, form);
    if (success) {
      toast.success(t("productUpdatedSuccessfully"));
      router.push("/dashboard/products");
    } else {
      toast.error(message);
    }
  };

  const handleInputChange = (
    field: string,
    value: string | number | File | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    handleInputChange("image", file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(formData.imageUrl || null);
    }
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
                {t("editProduct")}
              </h1>
              <p className="text-gray-600 mt-1">
                {t("editProductDescription")}
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
              {t("saveChanges")}
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
                  <Upload className="h-5 w-5 text-primary" />
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
                  <Label htmlFor="image" className="text-sm font-medium">
                    {t("productImage")}
                  </Label>
                  <div className="flex items-center gap-4">
                    {previewImage ? (
                      <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-input shadow-sm">
                        <img
                          src={previewImage}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleImageChange(null)}
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
                        {previewImage ? t("changeImage") : t("uploadImage")}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {t("imageFormat")}
                      </p>
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageChange(e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">
                    {t("category")} *
                  </Label>
                  <CategorySelect
                    selectedCategory={selectedCategory}
                    onCategoryChange={setSelectedCategory}
                    placeholder={t("selectCategory")}
                    className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg"
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
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-heading text-xl">
                    {t("pricing")}
                  </CardTitle>
                  <CardDescription>{t("unitDetails")}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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
            </CardContent>
          </Card>

          {/* Inventory Management */}
          <Card className="border-0 shadow-lg rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Upload className="h-5 w-5 text-primary" />
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
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="space-y-2">
                <Label htmlFor="stock" className="text-sm font-medium">
                  {t("currentStock")} *
                </Label>
                <Input
                  id="stock"
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
            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}
