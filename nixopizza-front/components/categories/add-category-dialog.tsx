"use client";

import React, { useState, useRef } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Upload, X, Camera } from "lucide-react";
import { createCategory } from "@/lib/apis/categories";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";

export function AddCategoryDialog({ setCategories }: { setCategories: any }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("categories");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: null as File | null,
    imagePreview: null as string | null,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description);
    if (formData.image) {
      formDataToSend.append("image", formData.image);
    }

    const { success, message, category } = await createCategory(formDataToSend);
    if (success) {
      toast.success(t("createdSuccessfully"));
      setCategories((prv: any) => [...prv, category]);
      setOpen(false);
      setFormData({
        name: "",
        description: "",
        image: null,
        imagePreview: null,
      });
    } else {
      toast.error(message);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      const reader = new FileReader();
      reader.onload = (ev) =>
        setFormData((prev) => ({
          ...prev,
          imagePreview: ev.target?.result as string,
        }));
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: null,
      imagePreview: null,
    }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t("addCategory")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px] rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="font-heading text-2xl bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {t("createNew")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t("categoryDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-stretch gap-5 ">
            <Card
              className={`flex-1 max-h-44 ${
                !formData.imagePreview && "border-2 border-dashed"
              } p-0`}
            >
              <CardContent className="p-0 h-full">
                <div className="text-center h-full">
                  {formData.imagePreview ? (
                    <div className="relative w-full h-full">
                      <img
                        src={formData.imagePreview}
                        alt="Category preview"
                        className="w-full h-full rounded-xl object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute cursor-pointer -top-2 -right-2 h-7 w-7 rounded-full"
                        onClick={handleRemoveImage}
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div
                        className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto cursor-pointer"
                        onClick={triggerFileInput}
                      >
                        <div className="text-center">
                          <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <span className="text-xs text-muted-foreground">
                            {t("uploadImage")}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={triggerFileInput}
                            className="gap-2 text-sm cursor-pointer"
                          >
                            <Upload className="h-3 w-3" />
                            <span className="text-sm">
                              {formData.imagePreview
                                ? t("changeImage")
                                : t("chooseImage")}
                            </span>
                          </Button>
                        </div>

                        <p className="text-xs text-muted-foreground mt-2">
                          {t("imageFormat")}
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex-1">
              <div className="space-y-4 mb-8">
                <div className="space-y-2">
                  <Label htmlFor="name" className="font-semibold">
                    {t("categoryName")} *
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={t("categoryNamePlaceholder")}
                    className="rounded-lg transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="font-semibold">
                  {t("description")}
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder={t("descriptionPlaceholder")}
                  rows={5}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              {t("cancel")}
            </Button>
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              {t("create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}