"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useTranslations, useLocale } from "next-intl";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User, Globe, Save, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

export default function ParametersPage() {
  const t = useTranslations("parameters");
  const locale = useLocale();
  const { user } = useAuth();
  const [current, setCurrent] = useState(locale ?? "en");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar || null);
  
  const [profileData, setProfileData] = useState({
    fullname: user?.fullname || "",
    email: user?.email || "",
    phone: user?.phone1 || "",
  });

  useEffect(() => {
    // if user previously selected a preferred locale, navigate there
    try {
      const stored = localStorage.getItem("preferred_locale");
      if (stored && stored !== locale) {
        const parts = window.location.pathname.split("/");
        parts[1] = stored;
        window.location.href = parts.join("/") || `/${stored}`;
      }
    } catch (e) {
      // ignore (localStorage unavailable)
    }
  }, [locale]);

  const languages = [
    { code: "en", label: "EN", flag: "🇬🇧" },
    { code: "fr", label: "FR", flag: "🇫🇷" },
    { code: "ar", label: "AR", flag: "🇩🇿" },
  ];

  function selectLang(code: string) {
    try {
      localStorage.setItem("preferred_locale", code);
    } catch (e) {}
    setCurrent(code);
    const parts = window.location.pathname.split("/");
    parts[1] = code;
    window.location.href = parts.join("/") || `/${code}`;
  }

  const handleProfileInputChange = (field: string, value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match("image.*")) {
        toast.error("Please select an image file");
        return;
      }
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const removeAvatar = () => {
    setAvatar(null);
    setAvatarPreview(user?.avatar || null);
  };

  const handleSaveProfile = async () => {
    // TODO: Implement profile update API call
    toast.success("Profile updated successfully");
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">
              {t("title")}
            </h1>
            <p className="text-gray-600 mt-1">
              {t("subtitle")}
            </p>
          </div>
          <Button
            onClick={handleSaveProfile}
            className="gap-2 rounded-full px-6 bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4" />
            {t("saveChanges")}
          </Button>
        </div>

        {/* Profile Section */}
        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-heading text-xl">
                  {t("profile.title")}
                </CardTitle>
                <CardDescription>
                  {t("profile.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            {/* Avatar Upload */}
            <div className="space-y-2">
              <Label htmlFor="avatar" className="text-sm font-medium">
                {t("profile.avatar")}
              </Label>
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-input shadow-sm">
                    <img
                      src={avatarPreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 hover:opacity-80 shadow-sm"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-24 h-24 border-2 border-dashed border-input rounded-full bg-muted/20">
                    <User className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Label
                    htmlFor="avatar-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <Upload className="h-4 w-4" />
                    {avatarPreview ? t("profile.changeAvatar") : t("profile.uploadAvatar")}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t("profile.avatarFormat")}
                  </p>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullname" className="text-sm font-medium">
                  {t("profile.fullname")} *
                </Label>
                <Input
                  id="fullname"
                  value={profileData.fullname}
                  onChange={(e) => handleProfileInputChange("fullname", e.target.value)}
                  placeholder={t("profile.fullnamePlaceholder")}
                  className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("profile.email")} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileInputChange("email", e.target.value)}
                  placeholder={t("profile.emailPlaceholder")}
                  className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  {t("profile.phone")}
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleProfileInputChange("phone", e.target.value)}
                  placeholder={t("profile.phonePlaceholder")}
                  className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  {t("profile.role")}
                </Label>
                <Input
                  id="role"
                  value={user?.role || ""}
                  disabled
                  className="py-5 border-2 border-input bg-muted/50 rounded-lg"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Language Settings */}
        <Card className="border-0 shadow-lg rounded-xl">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-heading text-xl">
                  {t("language.title")}
                </CardTitle>
                <CardDescription>
                  {t("language.description")}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("language.select")}
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full md:w-64 justify-start gap-2 py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg">
                    <span className="text-lg">{languages.find(l=>l.code===current)?.flag}</span>
                    <span className="font-medium">{languages.find(l=>l.code===current)?.label}</span>
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-64">
                  {languages.map((l) => (
                    <DropdownMenuItem 
                      key={l.code} 
                      onClick={() => selectLang(l.code)} 
                      className="flex items-center justify-between py-3"
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-lg">{l.flag}</span>
                        <span className="font-medium">{l.label}</span>
                      </span>
                      {current === l.code ? <span className="text-primary font-bold">✓</span> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-xs text-muted-foreground mt-2">
                {t("language.hint")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
