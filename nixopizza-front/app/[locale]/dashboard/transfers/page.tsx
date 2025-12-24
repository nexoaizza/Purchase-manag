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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
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
  }, [currentPage, limit, statusFilter, stockFilter]);

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
    if (stockFilter && stockFilter !== "all") params.stock = stockFilter;

    const { transfers: fetchedTransfers, pages, message, success } = await getTransfers(params);
    
    if (success) {
      // Filter by search on client side
      let filteredTransfers = fetchedTransfers || [];
      if (search) {
        filteredTransfers = filteredTransfers.filter(
          (transfer: ITransfer) =>
            transfer.takenFrom?.name?.toLowerCase().includes(search.toLowerCase()) ||
            transfer.takenTo?.name?.toLowerCase().includes(search.toLowerCase())
        );
      }
      setTransfers(filteredTransfers);
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
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          stockFilter={stockFilter}
          setStockFilter={setStockFilter}
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
