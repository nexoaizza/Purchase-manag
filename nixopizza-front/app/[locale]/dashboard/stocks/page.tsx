"use client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StockTable } from "@/components/stocks/stock-table";
import { StockHeader } from "@/components/stocks/stock-header";
import { EditStockDialog } from "@/components/stocks/edit-stock-dialog";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getStocks, deleteStock, IStock } from "@/lib/apis/stocks";

export default function StocksPage() {
  const [stocks, setStocks] = useState<IStock[]>([]);
  const [search, setSearch] = useState("");
  const [itemName, setItemName] = useState("");
  const [location, setLocation] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<IStock | null>(null);

  const fetchStocks = async () => {
    const params: any = {
      limit,
      page: currentPage,
      sortBy: "createdAt",
      order: "desc",
    };

    if (location && location !== "all") params.location = location;
    if (itemName) params.itemName = itemName;

    const { stocks: fetchedStocks, pages, message, success } = await getStocks(params);
    
    if (success) {
      // Filter by search (description) on client side
      let filteredStocks = fetchedStocks;
      if (search) {
        filteredStocks = filteredStocks.filter(
          (stock: IStock) =>
            stock.description.toLowerCase().includes(search.toLowerCase())
        );
      }
      setStocks(filteredStocks);
      setTotalPages(pages);
    } else {
      toast.error(message);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [limit, currentPage, search, itemName, location]);

  const handleEdit = (stock: IStock) => {
    setSelectedStock(stock);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { success, message } = await deleteStock(id);
    if (success) {
      toast.success("Stock deleted successfully");
      setStocks((prev) => prev.filter((s) => s._id !== id));
    } else {
      toast.error(message);
    }
  };

  const handleStockCreated = () => {
    fetchStocks();
  };

  const handleStockUpdated = () => {
    fetchStocks();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <StockHeader
          onSearchChange={setSearch}
          onItemNameChange={setItemName}
          onLocationChange={setLocation}
          onStockCreated={handleStockCreated}
        />
        <StockTable
          stocks={stocks}
          onEdit={handleEdit}
          onDelete={handleDelete}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          limit={limit}
          setLimit={setLimit}
        />
        <EditStockDialog
          stock={selectedStock}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onStockUpdated={handleStockUpdated}
        />
      </div>
    </DashboardLayout>
  );
}
