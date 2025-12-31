// components/ows-us/supplier-cards.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Package, Building2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { resolveImage } from "@/lib/resolveImage";
import { useTranslations } from "next-intl";

interface SupplierData {
  _id: string;
  name: string;
  image?: string;
  ordersCount: number;
  totalAmount: number;
}

interface SupplierCardsProps {
  suppliers: SupplierData[];
  weekStart: Date;
  weekEnd: Date;
}

export function SupplierCards({ suppliers, weekStart, weekEnd }: SupplierCardsProps) {
  const router = useRouter();
  const t = useTranslations("toPay");

  const handleCardClick = (supplierId: string) => {
    const params = new URLSearchParams({
      status: "verified",
      dateFrom: weekStart.toISOString(),
      dateTo: weekEnd.toISOString(),
      supplierIds: supplierId,
    });

    router.push(`/dashboard/purchases?${params.toString()}`);
  };

  if (suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-muted rounded-full">
            <Building2 className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-1">
            {t("noSuppliers")}
          </h3>
          <p className="text-muted-foreground mb-4">
            {t("noSuppliersMessage")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {suppliers.map((supplier) => (
        <Card
          key={supplier._id}
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
          onClick={() => handleCardClick(supplier._id)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {supplier.name}
            </CardTitle>
            {supplier.image && (
              <img
                src={resolveImage(supplier.image)}
                alt={supplier.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Package className="h-4 w-4" />
                  {t("ordersCount")}
                </div>
                <div className="text-lg font-bold">{supplier.ordersCount}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  {t("totalAmount")}
                </div>
                <div className="text-lg font-bold text-orange-600">
                  {supplier.totalAmount.toFixed(2)} DA
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
