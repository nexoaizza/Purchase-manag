"use client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StockUsageTable } from "@/components/stock-usage/stock-usage-table";
import { StockUsageHeader } from "@/components/stock-usage/stock-usage-header";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getStockUsages, IStockUsage } from "@/lib/apis/stock-usage";

export default function StockUsagePage() {
  const [usages, setUsages] = useState<IStockUsage[]>([]);
  const [productFilter, setProductFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchUsages();
  }, [currentPage, limit, productFilter, dateFrom, dateTo]);

  const fetchUsages = async () => {
    const params: any = {
      limit,
      page: currentPage,
    };

    if (productFilter && productFilter !== "all" && productFilter !== "") {
      params.productName = productFilter;
    }
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;

    const { usages: fetchedUsages, pages, message, success } = await getStockUsages(params);
    
    if (success) {
      setUsages(fetchedUsages || []);
      setTotalPages(pages || 1);
    } else {
      toast.error(message || "Failed to fetch stock usage records");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <StockUsageHeader
          productFilter={productFilter}
          setProductFilter={setProductFilter}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
        />

        <StockUsageTable
          usages={usages}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          limit={limit}
          setLimit={setLimit}
        />
      </div>
    </DashboardLayout>
  );
}
