// app/dashboard/suppliers/page.tsx
"use client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SuppliersTable } from "@/components/suppliers/suppliers-table";
import { SuppliersHeader } from "@/components/suppliers/suppliers-header";
import { useEffect, useState } from "react";
import { get_all_suppliers } from "@/lib/apis/suppliers";
import { getCategories } from "@/lib/apis/categories";
import { ICategory } from "@/app/[locale]/dashboard/categories/page";

export interface ISupplier {
  _id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone1: string;
  phone2?: string;
  phone3?: string;
  address: string;
  city?: string;
  categoryIds: string[];
  image: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [categories, setCategories] = useState<ICategory[]>([]);

  const onAdding = (newSupplier: ISupplier) => {
    setSuppliers((prev) => [newSupplier, ...prev]);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      const { success, categories } = await getCategories();
      if (success) {
        setCategories(categories);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSuppliers = async () => {
      const params: any = {
        name: search,
        status,
        page: currentPage,
        limit,
      };
      
      // Only include categoryIds if there are any selected
      if (categoryIds.length > 0) {
        params.categoryIds = categoryIds;
      }
      
      const response = await get_all_suppliers(params);

      if (response) {
        const { suppliers, pages } = response;
        setTotalPages(pages);

        if (suppliers) {
          setSuppliers(suppliers);
        } else {
          console.log("zaz (pas de suppliers)");
        }
      } else {
        console.error("get_all_suppliers() a retourné undefined !");
      }
    };

    fetchSuppliers();
  }, [search, currentPage, limit, status, categoryIds]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <SuppliersHeader
          onAdding={onAdding}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onCategoryChange={setCategoryIds}
        />
        <SuppliersTable
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          limit={limit}
          setLimit={setLimit}
          suppliers={suppliers}
          setSuppliers={setSuppliers}
          categories={categories}
        />
      </div>
    </DashboardLayout>
  );
}
