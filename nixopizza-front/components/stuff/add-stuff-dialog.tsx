"use client";

import type React from "react";
import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Upload } from "lucide-react";
import toast from "react-hot-toast";
import { createStuff } from "@/lib/apis/stuff";

interface AddStuffDialogProps {
  addNewStuff: (s: any) => void;
}

export function AddStuffDialog({ addNewStuff }: AddStuffDialogProps) {
  const [open, setOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    fullname: "",
    email: "",
    password: "",
    phone1: "",
    phone2: "",
    phone3: "",
    address: "",
    status: "Active",
    notes: "",
    avatar: null as File | null,
  });
    const {t} = useTranslations("stuff");


  const handleInputChange = (field: string, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image exceeds 5MB");
      return;
    }
    setFormData((prev) => ({ ...prev, avatar: file }));
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({
      fullname: "",
      email: "",
      password: "",
      phone1: "",
      phone2: "",
      phone3: "",
      address: "",
      status: "Active",
      notes: "",
      avatar: null,
    });
    setAvatarPreview(null);
  };

  const handleCreateStuff = async () => {
    if (!formData.fullname || !formData.email || !formData.password) {
      toast.error("Fullname, email & password are required");
      return;
    }
    const payload = new FormData();
    payload.append("fullname", formData.fullname);
    payload.append("email", formData.email);
    payload.append("password", formData.password);
    if (formData.phone1) payload.append("phone1", formData.phone1);
    if (formData.phone2) payload.append("phone2", formData.phone2);
    if (formData.phone3) payload.append("phone3", formData.phone3);
    if (formData.address) payload.append("address", formData.address);
    payload.append("status", formData.status);
    if (formData.notes) payload.append("notes", formData.notes);
    if (formData.avatar) payload.append("image", formData.avatar);

    const data = await createStuff(payload);
    if (data.success) {
      addNewStuff(data.staff);
      toast.success("Staff member added!");
      setOpen(false);
      resetForm();
    } else {
      toast.error(data.message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t("addStaff")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {t("addStaffTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("addStaffDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Profile Picture</Label>
            <label
              htmlFor="staff-avatar"
              className="flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed border-muted-foreground/25 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-full object-cover shadow"
                />
              ) : (
                <>
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Upload className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t("clickToUpload")}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t("uploadInfo")}
                    </p>
                  </div>
                </>
              )}
            </label>
            <Input
              id="staff-avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="fullname">{t("fullName")} *</Label>
            <Input
              id="fullname"
              value={formData.fullname}
              onChange={(e) => handleInputChange("fullname", e.target.value)}
              placeholder={t("fullNamePlaceholder")}
              required
            />
          </div>

          {/* Email & Password */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")} *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t("password")} *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={t("passwordPlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone 1</Label>
              <Input
                value={formData.phone1}
                onChange={(e) => handleInputChange("phone1", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone 2</Label>
              <Input
                value={formData.phone2}
                onChange={(e) => handleInputChange("phone2", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone 3</Label>
              <Input
                value={formData.phone3}
                onChange={(e) => handleInputChange("phone3", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder={t("addressPlaceholder")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="Optional notes"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleCreateStuff}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}