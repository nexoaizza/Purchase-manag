"use client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { StockItemTable } from "@/components/stock-items/stock-item-table";
import { StockItemHeader } from "@/components/stock-items/stock-item-header";
import { EditStockItemDialog } from "@/components/stock-items/edit-stock-item-dialog";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getStockItems, deleteStockItem, IStockItem } from "@/lib/apis/stock-items";

export default function StockItemsPage() {
  const [stockItems, setStockItems] = useState<IStockItem[]>([]);
  const [productName, setProductName] = useState("");
  const [stock, setStock] = useState("");
  const [expirationStatus, setExpirationStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<IStockItem | null>(null);

  const fetchStockItems = async () => {
    const params: any = {
      limit,
      page: currentPage,
      sortBy: "createdAt",
      order: "desc",
    };

    if (stock && stock !== "all") params.stock = stock;

    const { stockItems: fetchedItems, pages, message, success } = await getStockItems(params);

    if (success) {
      let filteredItems = fetchedItems;
      
      // Filter by product name
      if (productName) {
        filteredItems = filteredItems.filter(
          (item: IStockItem) =>
            item.product?.name.toLowerCase().includes(productName.toLowerCase())
        );
      }

      // Filter by expiration status
      if (expirationStatus && expirationStatus !== "all") {
        const now = new Date();

        filteredItems = filteredItems.filter((item: IStockItem) => {
          // Skip items without expectedLifeTime
          if (!item.product?.expectedLifeTime || item.product.expectedLifeTime <= 0) {
            return expirationStatus === "fresh";
          }
          
          const createdAt = item.createdAt ? new Date(item.createdAt) : new Date();
          const expectedLifeTimeDays = item.product.expectedLifeTime;
          const expirationDate = new Date(createdAt);
          expirationDate.setDate(expirationDate.getDate() + expectedLifeTimeDays);
          
          // Calculate how much time has passed
          const timeElapsedMs = now.getTime() - createdAt.getTime();
          const totalLifetimeMs = expectedLifeTimeDays * 24 * 60 * 60 * 1000;
          const percentagePassed = timeElapsedMs / totalLifetimeMs;
          
          if (expirationStatus === "expired") {
            return now > expirationDate;
          } else if (expirationStatus === "expiring-soon") {
            return percentagePassed > 0.7 && now <= expirationDate;
          } else if (expirationStatus === "fresh") {
            return percentagePassed <= 0.7 && now <= expirationDate;
          }
          return true;
        });
      }

      setStockItems(filteredItems);
      setTotalPages(pages);
    } else {
      toast.error(message);
    }
  };

  useEffect(() => {
    fetchStockItems();
  }, [limit, currentPage, productName, stock, expirationStatus]);

  const handleEdit = (stockItem: IStockItem) => {
    setSelectedStockItem(stockItem);
    setEditDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { success, message } = await deleteStockItem(id);
    if (success) {
      toast.success("Stock item deleted successfully");
      setStockItems((prev) => prev.filter((item) => item._id !== id));
    } else {
      toast.error(message);
    }
  };

  const handleStockItemCreated = () => {
    fetchStockItems();
  };

  const handleStockItemUpdated = () => {
    fetchStockItems();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <StockItemHeader
          onProductNameChange={setProductName}
          onStockChange={setStock}
          onExpirationStatusChange={setExpirationStatus}
          onStockItemCreated={handleStockItemCreated}
        />
        <StockItemTable
          stockItems={stockItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          limit={limit}
          setLimit={setLimit}
        />
        <EditStockItemDialog
          stockItem={selectedStockItem}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onStockItemUpdated={handleStockItemUpdated}
        />
      </div>
    </DashboardLayout>
  );
}
