"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CategorySelect } from "../ui/category-select";
import { ICategory } from "@/app/[locale]/dashboard/categories/page";
import { getCategories } from "@/lib/apis/categories";
import toast from "react-hot-toast";

export function ProductsHeader({
  onSearchChange,
  onCategoryChange,
}: {
  onSearchChange: (search: string) => void;
  onCategoryChange: (categoryId: string) => void;
}) {
  const t = useTranslations("products");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ICategory | null>(
    null
  );
  const [categories, setCategories] = useState<ICategory[]>([]);
  const router = useRouter();

  // Fetch all categories
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

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  // Handle category change
  const handleCategoryChange = (category: ICategory | null) => {
    setSelectedCategory(category);
    onCategoryChange(category ? category._id : "");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Button
          className="gap-2"
          onClick={() => router.push("/dashboard/products/add")}
        >
          <Plus className="h-4 w-4" />
          {t("addProduct")}
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30"
          />
        </div>
        <CategorySelect
          categories={categories}
          selectedCategory={selectedCategory}
          onSelect={handleCategoryChange}
          placeholder={t("chooseCategory")}
          className="min-w-[220px]"
        />
      </div>
    </div>
  );
}
