"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { SupplierCards } from "@/components/ows-us/supplier-cards";
import { useEffect, useState } from "react";
import { getOrders } from "@/lib/apis/purchase-list";
import toast from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";

interface SupplierData {
  _id: string;
  name: string;
  image?: string;
  ordersCount: number;
  totalAmount: number;
}

export default function OwsUsPage() {
  const t = useTranslations("owsUs");
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState<Date>(new Date());
  const [weekEnd, setWeekEnd] = useState<Date>(new Date());

  const getLastThursday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 4 = Thursday

    let daysToSubtract;
    if (dayOfWeek >= 4) {
      daysToSubtract = dayOfWeek - 4;
    } else {
      daysToSubtract = dayOfWeek + 3;
    }

    const lastThursday = new Date(today);
    lastThursday.setDate(today.getDate() - daysToSubtract);
    lastThursday.setHours(0, 0, 0, 0);

    return lastThursday;
  };

  const getNextWednesday = () => {
    const lastThursday = getLastThursday();
    const nextWednesday = new Date(lastThursday);
    nextWednesday.setDate(lastThursday.getDate() + 6); // Thursday + 6 days = Wednesday
    nextWednesday.setHours(23, 59, 59, 999);
    return nextWednesday;
  };

  useEffect(() => {
    const fetchVerifiedOrders = async () => {
      setLoading(true);
      try {
        const start = getLastThursday();
        const end = getNextWednesday();
        
        setWeekStart(start);
        setWeekEnd(end);

        const { orders, success, message } = await getOrders({
          status: "verified",
          dateFrom: start.toISOString(),
          dateTo: end.toISOString(),
          limit: 1000,
        });

        if (success && orders) {
          // Group by supplier
          const supplierMap = new Map<string, SupplierData>();

          orders.forEach((order: any) => {
            const supplierId = order.supplierId._id;
            const supplierName = order.supplierId.name;
            const supplierImage = order.supplierId.image;

            if (supplierMap.has(supplierId)) {
              const existing = supplierMap.get(supplierId)!;
              existing.ordersCount += 1;
              existing.totalAmount += order.totalAmount || 0;
            } else {
              supplierMap.set(supplierId, {
                _id: supplierId,
                name: supplierName,
                image: supplierImage,
                ordersCount: 1,
                totalAmount: order.totalAmount || 0,
              });
            }
          });

          const suppliersList = Array.from(supplierMap.values());
          // Sort by total amount descending
          suppliersList.sort((a, b) => b.totalAmount - a.totalAmount);
          setSuppliers(suppliersList);
        } else {
          toast.error(message || "Failed to fetch orders");
        }
      } catch (error) {
        console.error("Error fetching verified orders:", error);
        toast.error("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchVerifiedOrders();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : (
          <SupplierCards suppliers={suppliers} weekStart={weekStart} weekEnd={weekEnd} />
        )}
      </div>
    </DashboardLayout>
  );
}
