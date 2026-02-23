// components/orders/orders-table.tsx
"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Plus,
} from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { IStaffOrder } from "@/app/[locale]/dashboard/orders/page";
import { updateOrderStatus, deleteOrder } from "@/lib/apis/order";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

import { OrderDetailDialog } from "./order-detail-dialog";

interface OrdersTableProps {
  orders: IStaffOrder[];
  setOrders: any;
  totalPages: number;
  currentPage: number;
  setCurrentPage: any;
  limit: number;
  setLimit: any;
  onUpdateOrder: (order: IStaffOrder) => void;
  onAssignOrder: () => void;
}

export function OrdersTable({
  orders,
  setOrders,
  totalPages,
  currentPage,
  setCurrentPage,
  limit,
  setLimit,
  onUpdateOrder,
  onAssignOrder,
}: OrdersTableProps) {
  const t = useTranslations("orders");
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<IStaffOrder | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "completed":
        return "default";
      case "canceled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("pending");
      case "completed":
        return t("completed");
      case "canceled":
        return t("canceled");
      default:
        return status;
    }
  };

  const handleViewOrder = (order: IStaffOrder) => {
    setSelectedOrder(order);
    setIsViewDialogOpen(true);
  };

  const handleMarkAsCompleted = async (orderId: string) => {
    try {
      const { success, order, message } = await updateOrderStatus(orderId, "completed");
      if (success) {
        toast.success(t("orderCompleted") || "Order completed successfully");
        onUpdateOrder(order);
      } else {
        toast.error(message || "Failed to complete order");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm(t("confirmCancel") || "Are you sure you want to cancel this order?")) return;
    try {
      const { success, order, message } = await updateOrderStatus(orderId, "canceled");
      if (success) {
        toast.success(t("orderCanceled") || "Order canceled successfully");
        onUpdateOrder(order);
      } else {
        toast.error(message || "Failed to cancel order");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm(t("confirmDeleteOrder") || "Are you sure you want to delete this order?")) return;
    try {
      const { success, message } = await deleteOrder(orderId);
      if (success) {
        toast.success(t("orderDeleted") || "Order deleted successfully");
        setOrders((prev: IStaffOrder[]) => prev.filter((o) => o._id !== orderId));
      } else {
        toast.error(message || "Failed to delete order");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{t("orderDirectory")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-muted rounded-full">
            <Calendar className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-1">{t("noOrdersFound")}</h3>
          <p className="text-muted-foreground mb-4">
            {t("noOrdersYet")}
          </p>
          <Button onClick={onAssignOrder}>
            <Plus className="h-4 w-4 mr-2" />
            {t("assignOrder")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{t("orderDirectory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("orderId")}</TableHead>
                  <TableHead>{t("assignedToHeader")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead>{t("deadlineHeader")}</TableHead>
                  <TableHead>{t("statusHeader")}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell>
                      <div className="font-mono font-medium">
                        {order.orderNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            process.env.NEXT_PUBLIC_BASE_URL +
                            order.staffId.avatar
                          }
                          alt={order.staffId.fullname}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium">
                            {order.staffId.fullname}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {order.staffId.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-muted-foreground">
                        {order.description || (
                          <span className="italic text-muted-foreground/60">
                            {t("noDescription") || "No description"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {order.deadline ? (
                            new Date(order.deadline).toLocaleDateString("en-GB")
                          ) : (
                            <span className="text-muted-foreground/60 italic text-sm">
                              {t("noDeadline") || "No deadline"}
                            </span>
                          )}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(order.status) as any}>
                        {getStatusLabel(order.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t("viewDetails")}
                          </DropdownMenuItem>
                          {order.status === "pending" && (
                            <>
                              {(user?.role === "admin" || user?._id === order.staffId._id) && (
                                <DropdownMenuItem
                                  onClick={() => handleMarkAsCompleted(order._id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {t("markAsCompleted")}
                                </DropdownMenuItem>
                              )}
                              {user?.role === "admin" && (
                                <DropdownMenuItem
                                  onClick={() => handleCancelOrder(order._id)}
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {t("cancelOrder")}
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          {user?.role === "admin" && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteOrder(order._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("deleteOrder")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {t("showing")} {orders.length} {t("of")} {totalPages * limit} {t("orders")}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              limit={limit}
              onLimitChange={setLimit}
            />
          </div>
        </CardContent>
      </Card>

      <OrderDetailDialog
        order={selectedOrder}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
    </>
  );
}
