"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TransferTable } from "@/components/transfers/transfer-table";
import { getMyTransfers, ITransfer } from "@/lib/apis/transfers";
import toast from "react-hot-toast";
import { ArrowRightLeft } from "lucide-react";

export default function StaffTransfersPage() {
  const t = useTranslations("transfers");
  const [transfers, setTransfers] = useState<ITransfer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    fetchMyTransfers();
  }, [currentPage, limit]);

  const fetchMyTransfers = async () => {
    const { success, transfers: data, pagination, message } = await getMyTransfers({
      page: currentPage,
      limit,
    });

    if (success) {
      setTransfers(data || []);
      setTotalPages(pagination?.totalPages || 1);
    } else {
      toast.error(message || "Failed to fetch transfers");
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <ArrowRightLeft className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t("assignedTransfers")}</h2>
            <p className="text-muted-foreground">{t("assignedTransfersSubtitle")}</p>
          </div>
        </div>

        <TransferTable
          transfers={transfers}
          onEdit={() => {}}
          onDelete={async () => {}}
          onStatusChange={fetchMyTransfers}
          showAdminActions={false}
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
