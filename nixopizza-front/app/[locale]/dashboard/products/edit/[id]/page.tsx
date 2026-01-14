"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { CategorySelect } from "@/components/ui/category-select";
import {
  ArrowLeft,
  Save,
  X,
  Upload,
  Package,
} from "lucide-react";
import toast from "react-hot-toast";
import { getProduct, updateProduct } from "@/lib/apis/products";
import { getCategories } from "@/lib/apis/categories";
import { resolveImage } from "@/lib/resolveImage";

interface ICategory {
  _id: string;
  name: string;
  image: string;
  description?: string;
}

interface IProduct {
  _id: string;
  name: string;
  barcode?: string;
  unit: string;
  categoryId: ICategory;
  imageUrl?: string;
  description?: string;
  currentStock: number;
  minQty: number;
  recommendedQty: number;
  expectedLifeTime?: number;
}

export default function EditProductPage() {
  const t = useTranslations("products");
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null
  );
  const router = useRouter();
  const params = useParams();
  const productId = params?.id as string;



  const [formData, setFormData] = useState<Omit<IProduct, "categoryId"> & { categoryId?: ICategory }>({
    _id: "",
    name: "",
    barcode: "",
    unit: "",
    imageUrl: "",
    description: "",
    currentStock: 0,
    minQty: 0,
    recommendedQty: 0,
    expectedLifeTime: 0,
  });

  // image state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Load categories first
  useEffect(() => {
    const fetchCategories = async () => {
      const { categories: data, success, message } = await getCategories();
      if (success) {
        setCategories(data || []);
      } else {
        toast.error(message);
      }
    };
    fetchCategories();
  }, []);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      const { product, success, message } = await getProduct(productId);
      if (!success) {
        toast.error(message);
        return;
      }
      setFormData({
        _id: product._id,
        name: product.name,
        barcode: product.barcode,
        unit: product.unit,
        imageUrl: product.imageUrl,
        description: product.description,
        currentStock: product.currentStock,
        minQty: product.minQty,
        recommendedQty: product.recommendedQty,
        expectedLifeTime: product.expectedLifeTime,
        categoryId: product.categoryId,
      });
      setPreviewImage(resolveImage(product.imageUrl));
      // If categories already loaded, set selectedCategory now
      setSelectedCategory(product.categoryId || null);
    };
    fetchProduct();
  }, [productId]);

  // When categories load after product, ensure selectedCategory is set
  useEffect(() => {
    if (formData.categoryId && categories.length > 0) {
      const match = categories.find((c) => c._id === formData.categoryId?._id);
      if (match) {
        setSelectedCategory(match);
      }
    }
  }, [categories, formData.categoryId]);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreviewImage(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewImage(resolveImage(formData.imageUrl));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setPreviewImage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory) {
      toast.error(t("selectCategoryRequired"));
      return;
    }

    const form = new FormData();
    form.append("name", formData.name);
    if (formData.barcode) form.append("barcode", formData.barcode);
    if (formData.unit) form.append("unit", formData.unit);
    form.append("categoryId", selectedCategory._id);
    if (formData.description) form.append("description", formData.description);
    form.append("currentStock", String(formData.currentStock));
    form.append("minQty", String(formData.minQty));
    form.append("recommendedQty", String(formData.recommendedQty));
    if (formData.expectedLifeTime) form.append("expectedLifeTime", String(formData.expectedLifeTime));
    if (imageFile) {
      form.append("image", imageFile);
    }

    const { success, message } = await updateProduct(productId, form);
    if (success) {
      toast.success(t("productUpdatedSuccessfully"));
      router.push("/dashboard/products");
    } else {
      toast.error(message);
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

        <form onSubmit={handleSubmit} className="space-y-8">
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
              {/* Image (optional) */}
              <div className="space-y-2">
                <Label>{t("productImageOptional")}</Label>
                <div className="flex items-center gap-4">
                  {previewImage ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border">
                      <img
                        src={previewImage}
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
                      htmlFor="product-image-upload"
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90"
                    >
                      <Upload className="h-4 w-4" />
                      {previewImage ? t("changeImage") : t("uploadImage")}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t("imageFormat")}
                    </p>
                    <Input
                      id="product-image-upload"
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

              {/* Basic info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("nameRequired")}</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      handleInputChange("name", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("barcodeOptional")}</Label>
                  <Input
                    value={formData.barcode || ""}
                    onChange={(e) =>
                      handleInputChange("barcode", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t("unitRequired")}</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(v) => handleInputChange("unit", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("selectUnitPlaceholder")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">{t("piece")}</SelectItem>
                      <SelectItem value="box">{t("box")}</SelectItem>
                      <SelectItem value="pack">{t("pack")}</SelectItem>
                      <SelectItem value="bottle">{t("bottle")}</SelectItem>
                      <SelectItem value="kilogram">{t("kilogram")}</SelectItem>
                      <SelectItem value="liter">{t("liter")}</SelectItem>
                      <SelectItem value="meter">{t("meter")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("categoryRequired")}</Label>
                  <CategorySelect
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelect={(c : any) => setSelectedCategory(c as ICategory | null)}
                    isLoading={false}
                    placeholder={t("selectCategoryPlaceholder")}
                    className="border rounded-md"
                  />
                </div>
              </div>

              {/* Stock */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t("minimumQtyRequired")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.minQty}
                    onChange={(e) =>
                      handleInputChange("minQty", parseInt(e.target.value) || 0)
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("recommendedQtyOptional")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.recommendedQty}
                    onChange={(e) =>
                      handleInputChange(
                        "recommendedQty",
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("expectedLifeTimeDays")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.expectedLifeTime || 0}
                    onChange={(e) =>
                      handleInputChange(
                        "expectedLifeTime",
                        parseInt(e.target.value) || 0
                      )
                    }
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>{t("descriptionOptional")}</Label>
                <Textarea
                  rows={3}
                  value={formData.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder={t("describeProduct")}
                />
              </div>

            </CardContent>
          </Card>
        </form>
      </div>
    </DashboardLayout>
  );
}