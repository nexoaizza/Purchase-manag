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
  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [expirationStatus, setExpirationStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<IStockItem | null>(null);
  const [sortBy, setSortBy] = useState("product");
  const [order, setOrder] = useState("desc");

  const fetchStockItems = async () => {
    const params: any = {
      limit,
      page: currentPage,
      sortBy,
      order,
    };

    if (category && category !== "all") params.category = category;
    if (stock && stock !== "all") params.stock = stock;
    if (minPrice !== undefined && minPrice !== "") params.minPrice = minPrice;
    if (maxPrice !== undefined && maxPrice !== "") params.maxPrice = maxPrice;
    if (productName) params.productName = productName;
    if (expirationStatus && expirationStatus !== "all") params.expirationStatus = expirationStatus;

    const { stockItems: fetchedItems, pages, message, success } = await getStockItems(params);

    if (success) {
      setStockItems(fetchedItems);
      setTotalPages(pages);
    } else {
      toast.error(message);
    }
  };

  useEffect(() => {
    fetchStockItems();
  }, [limit, currentPage, productName, category, stock, expirationStatus, sortBy, order, minPrice, maxPrice]);

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
          onCategoryChange={setCategory}
          onStockChange={setStock}
          onExpirationStatusChange={setExpirationStatus}
          onMinPriceChange={setMinPrice}
          onMaxPriceChange={setMaxPrice}
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
          sortBy={sortBy}
          order={order}
          onSort={(newSortBy: string) => {
            if (sortBy === newSortBy) {
              setOrder(order === "desc" ? "asc" : "desc");
            } else {
              setSortBy(newSortBy);
              setOrder("desc"); // first click desc
            }
          }}
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
