"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useTranslations, useLocale } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CheckCircle,
  XCircle,
  ArrowRightLeft,
  ClipboardList,
  ShoppingCart,
  ExternalLink,
} from "lucide-react";
import { getTasks, updateTaskStatus } from "@/lib/apis/task";
import { getTransfers, updateTransfer } from "@/lib/apis/transfers";
import { getOrders } from "@/lib/apis/purchase-list";
import { format } from "date-fns";
import Link from "next/link";
import toast from "react-hot-toast";

interface ITask {
  _id: string;
  taskNumber: string;
  staffId: { fullname: string; email: string };
  description?: string;
  status: "pending" | "completed" | "canceled";
  deadline?: Date;
}

interface ITransfer {
  _id: string;
  takenFrom: any;
  takenTo: any;
  status: "pending" | "arrived";
  items: any[];
  createdAt?: Date;
}

interface IOrder {
  _id: string;
  orderNumber: string;
  supplierId: { name: string };
  status: string;
  totalAmount: number;
  createdAt: Date;
}

const PENDING_ORDER_STATUSES = ["not assigned", "assigned", "pending_review"];

export default function QuickAccessPage() {
  const t = useTranslations("quickAccess");
  const locale = useLocale();

  const [tasks, setTasks] = useState<ITask[]>([]);
  const [transfers, setTransfers] = useState<ITransfer[]>([]);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [tasksRes, transfersRes, ordersRes] = await Promise.all([
        getTasks({ status: "pending", page: 1, limit: 5, sortBy: "createdAt", order: "desc" }),
        getTransfers({ status: "pending", page: 1, limit: 5, sortBy: "createdAt", order: "desc" }),
        getOrders({ page: 1, limit: 1000, sortBy: "createdAt", order: "desc" }),
      ]);

      if (tasksRes.success) setTasks(tasksRes.tasks || []);
      if (transfersRes.success) setTransfers(transfersRes.transfers || []);
      if (ordersRes.success) {
        const pendingOrders = (ordersRes.orders as IOrder[]).filter((o) =>
          PENDING_ORDER_STATUSES.includes(o.status)
        );
        setOrders(pendingOrders.slice(0, 5));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleCompleteTask = async (taskId: string) => {
    const { success, task, message } = await updateTaskStatus(taskId, "completed");
    if (success) {
      toast.success(t("markCompleted"));
      setTasks((prev: ITask[]) => prev.filter((item: ITask) => item._id !== taskId));
    } else {
      toast.error(message);
    }
  };

  const handleCancelTask = async (taskId: string) => {
    if (!confirm(t("cancelTask") + "?")) return;
    const { success, message } = await updateTaskStatus(taskId, "canceled");
    if (success) {
      toast.success(t("cancelTask"));
      setTasks((prev: ITask[]) => prev.filter((item: ITask) => item._id !== taskId));
    } else {
      toast.error(message);
    }
  };

  const handleMarkArrived = async (transferId: string) => {
    const { success, message } = await updateTransfer(transferId, { status: "arrived" });
    if (success) {
      toast.success(t("markArrived"));
      setTransfers((prev: ITransfer[]) => prev.filter((item: ITransfer) => item._id !== transferId));
    } else {
      toast.error(message);
    }
  };

  const getOrderStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      "not assigned": "bg-gray-100 text-gray-700 border-gray-200",
      assigned: "bg-blue-50 text-blue-700 border-blue-200",
      pending_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
      verified: "bg-green-50 text-green-700 border-green-200",
      paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
      canceled: "bg-red-50 text-red-700 border-red-200",
    };
    return (
      <Badge variant="outline" className={variants[status] || ""}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Tasks ── */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-orange-500" />
                  <CardTitle className="text-base">{t("pendingTasks")}</CardTitle>
                  {tasks.length > 0 && (
                    <Badge className="bg-orange-500 text-white text-xs">
                      {tasks.length}
                    </Badge>
                  )}
                </div>
                <Link href={`/${locale}/dashboard/tasks`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    {t("viewAll")} <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm px-4">
                  {t("noItems")}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {tasks.map((task: ITask) => (
                    <div key={task._id} className="px-4 py-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {t("taskNumber")}{task.taskNumber}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {task.staffId?.fullname}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {task.description}
                            </p>
                          )}
                          {task.deadline && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {t("deadline")}: {format(new Date(task.deadline), "dd/MM/yyyy")}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => handleCompleteTask(task._id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {t("markCompleted")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleCancelTask(task._id)}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            {t("cancelTask")}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Transfers ── */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">{t("pendingTransfers")}</CardTitle>
                  {transfers.length > 0 && (
                    <Badge className="bg-blue-500 text-white text-xs">
                      {transfers.length}
                    </Badge>
                  )}
                </div>
                <Link href={`/${locale}/dashboard/transfers`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    {t("viewAll")} <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {transfers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm px-4">
                  {t("noItems")}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {transfers.map((transfer: ITransfer) => (
                    <div key={transfer._id} className="px-4 py-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {t("from")}: {transfer.takenFrom?.name || "—"} → {transfer.takenTo?.name || "—"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transfer.items?.length || 0} item(s)
                          </p>
                          {transfer.createdAt && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(transfer.createdAt), "dd/MM/yyyy")}
                            </p>
                          )}
                          <Badge variant="outline" className="mt-1 text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                            {t("pending")}
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 shrink-0"
                          onClick={() => handleMarkArrived(transfer._id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {t("markArrived")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Purchases ── */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-purple-500" />
                  <CardTitle className="text-base">{t("pendingPurchases")}</CardTitle>
                  {orders.length > 0 && (
                    <Badge className="bg-purple-500 text-white text-xs">
                      {orders.length}
                    </Badge>
                  )}
                </div>
                <Link href={`/${locale}/dashboard/purchases`}>
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    {t("viewAll")} <ExternalLink className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm px-4">
                  {t("noItems")}
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {orders.map((order: IOrder) => (
                    <div key={order._id} className="px-4 py-3 hover:bg-muted/40 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {t("orderNumber")}{order.orderNumber}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {order.supplierId?.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {format(new Date(order.createdAt), "dd/MM/yyyy")}
                          </p>
                        </div>
                        <div className="shrink-0">
                          {getOrderStatusBadge(order.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
