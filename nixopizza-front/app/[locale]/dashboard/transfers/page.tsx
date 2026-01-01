"use client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TransferTable } from "@/components/transfers/transfer-table";
import { TransferHeader } from "@/components/transfers/transfer-header";
import { AddTransferDialog } from "@/components/transfers/add-transfer-dialog";
import { EditTransferDialog } from "@/components/transfers/edit-transfer-dialog";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getTransfers, deleteTransfer, ITransfer } from "@/lib/apis/transfers";
import { getStocks, IStock } from "@/lib/apis/stocks";

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<ITransfer[]>([]);
  const [stocks, setStocks] = useState<IStock[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromStockFilter, setFromStockFilter] = useState("all");
  const [toStockFilter, setToStockFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<ITransfer | null>(null);

  useEffect(() => {
    fetchStocks();
  }, []);

  useEffect(() => {
    fetchTransfers();
  }, [currentPage, limit, statusFilter, fromStockFilter, toStockFilter]);

  const fetchStocks = async () => {
    const { stocks: fetchedStocks, success } = await getStocks();
    if (success) {
      setStocks(fetchedStocks || []);
    }
  };

  const fetchTransfers = async () => {
    const params: any = {
      limit,
      page: currentPage,
      sortBy: "createdAt",
      order: "desc",
    };

    if (statusFilter && statusFilter !== "all") params.status = statusFilter;
    if (fromStockFilter && fromStockFilter !== "all") params.takenFrom = fromStockFilter;
    if (toStockFilter && toStockFilter !== "all") params.takenTo = toStockFilter;

    const { transfers: fetchedTransfers, pages, message, success } = await getTransfers(params);
    
    if (success) {
      setTransfers(fetchedTransfers || []);
      setTotalPages(pages || 1);
    } else {
      toast.error(message);
    }
  };

  const handleEdit = (transfer: ITransfer) => {
    setSelectedTransfer(transfer);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transfer?")) return;

    const { success, message } = await deleteTransfer(id);
    if (success) {
      toast.success("Transfer deleted successfully");
      fetchTransfers();
    } else {
      toast.error(message);
    }
  };

  const handleTransferCreated = () => {
    setAddDialogOpen(false);
    fetchTransfers();
  };

  const handleTransferUpdated = () => {
    setEditDialogOpen(false);
    setSelectedTransfer(null);
    fetchTransfers();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <TransferHeader
          onAddClick={() => setAddDialogOpen(true)}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          fromStockFilter={fromStockFilter}
          setFromStockFilter={setFromStockFilter}
          toStockFilter={toStockFilter}
          setToStockFilter={setToStockFilter}
          stocks={stocks}
        />

        <TransferTable
          transfers={transfers}
          onEdit={handleEdit}
          onDelete={handleDelete}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          limit={limit}
          setLimit={setLimit}
        />

        <AddTransferDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onTransferCreated={handleTransferCreated}
        />

        <EditTransferDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onTransferUpdated={handleTransferUpdated}
          transfer={selectedTransfer}
        />
      </div>
    </DashboardLayout>
  );
}
