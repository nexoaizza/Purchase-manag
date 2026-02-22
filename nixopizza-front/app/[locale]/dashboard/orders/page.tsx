// app/dashboard/orders/page.tsx
"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { OrdersHeader } from "@/components/orders/orders-header";
import { OrdersTable } from "@/components/orders/orders-table";
import { getOrders } from "@/lib/apis/order";
import { useEffect, useState } from "react";

import toast from "react-hot-toast";

export interface IStaffOrder {
  _id: string;
  orderNumber: string;
  staffId: {
    _id: string;
    fullname: string;
    email: string;
    avatar: string;
  };
  description?: string;
  items?: {
    productId: {
      _id: string;
      name: string;
      imageUrl: string;
    };
    quantity: number;
  }[];
  status: "pending" | "completed" | "canceled";
  deadline?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<IStaffOrder[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState({ sortBy: "createdAt", order: "desc" });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const params: any = {
          orderNumber: search,
          page: currentPage,
          limit,
          sortBy: sort.sortBy,
          order: sort.order,
        };

        if (status !== "all") {
          params.status = status;
        }

        const { orders, success, message, pages } = await getOrders(params);

        if (success) {
          setOrders(orders || []);
          setTotalPages(pages || 1);
        } else {
          toast.error(message || "Failed to fetch orders");
        }
      } catch (error: any) {
        toast.error("Failed to fetch orders");
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, [search, status, sort, currentPage, limit]);

  const handleUpdateOrder = (updatedOrder: IStaffOrder) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order._id === updatedOrder._id ? updatedOrder : order
      )
    );
  };

  const [isCreateOrderDialogOpen, setIsCreateOrderDialogOpen] = useState(false);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <OrdersHeader
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onSortChange={setSort}
          isCreateDialogOpen={isCreateOrderDialogOpen}
          setIsCreateDialogOpen={setIsCreateOrderDialogOpen}
        />
        <OrdersTable
          orders={orders}
          setOrders={setOrders}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          limit={limit}
          setLimit={setLimit}
          onUpdateOrder={handleUpdateOrder}
          onAssignOrder={() => setIsCreateOrderDialogOpen(true)}
        />
      </div>
    </DashboardLayout>
  );
}
