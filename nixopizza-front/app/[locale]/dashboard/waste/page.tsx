"use client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { WasteTable } from "@/components/waste/waste-table";
import { WasteHeader } from "@/components/waste/waste-header";
import { AddWasteDialog } from "@/components/waste/add-waste-dialog";
import { EditWasteDialog } from "@/components/waste/edit-waste-dialog";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getWastes, deleteWaste, IWaste } from "@/lib/apis/waste";
import { getStocks, IStock } from "@/lib/apis/stocks";

export default function WastePage() {
  const [wastes, setWastes] = useState<IWaste[]>([]);
  const [stocks, setStocks] = useState<IStock[]>([]);
  const [search, setSearch] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedWaste, setSelectedWaste] = useState<IWaste | null>(null);

  useEffect(() => {
    fetchStocks();
  }, []);

  useEffect(() => {
    fetchWastes();
  }, [currentPage, limit, reasonFilter, stockFilter]);

  const fetchStocks = async () => {
    const { stocks: fetchedStocks, success } = await getStocks();
    if (success) {
      setStocks(fetchedStocks || []);
    }
  };

  const fetchWastes = async () => {
    const params: any = {
      limit,
      page: currentPage,
      sortBy: "createdAt",
      order: "desc",
    };

    if (reasonFilter && reasonFilter !== "all") params.reason = reasonFilter;
    if (stockFilter && stockFilter !== "all") params.stock = stockFilter;

    const { wastes: fetchedWastes, pages, message, success } = await getWastes(params);
    
    if (success) {
      // Filter by search on client side
      let filteredWastes = fetchedWastes || [];
      if (search) {
        filteredWastes = filteredWastes.filter(
          (waste: IWaste) =>
            waste.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
            waste.reason?.toLowerCase().includes(search.toLowerCase())
        );
      }
      setWastes(filteredWastes);
      setTotalPages(pages || 1);
    } else {
      toast.error(message);
    }
  };

  const handleEdit = (waste: IWaste) => {
    setSelectedWaste(waste);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this waste record?")) return;

    const { success, message } = await deleteWaste(id);
    if (success) {
      toast.success("Waste record deleted successfully");
      fetchWastes();
    } else {
      toast.error(message);
    }
  };

  const handleWasteCreated = () => {
    setAddDialogOpen(false);
    fetchWastes();
  };

  const handleWasteUpdated = () => {
    setEditDialogOpen(false);
    setSelectedWaste(null);
    fetchWastes();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <WasteHeader
          onAddClick={() => setAddDialogOpen(true)}
          search={search}
          setSearch={setSearch}
          reasonFilter={reasonFilter}
          setReasonFilter={setReasonFilter}
          stockFilter={stockFilter}
          setStockFilter={setStockFilter}
          stocks={stocks}
        />

        <WasteTable
          wastes={wastes}
          onEdit={handleEdit}
          onDelete={handleDelete}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          limit={limit}
          setLimit={setLimit}
        />

        <AddWasteDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onWasteCreated={handleWasteCreated}
        />

        <EditWasteDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onWasteUpdated={handleWasteUpdated}
          waste={selectedWaste}
        />
      </div>
    </DashboardLayout>
  );
}
