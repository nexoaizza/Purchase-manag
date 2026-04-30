"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  RefreshCw,
  CheckCircle2,
  ClipboardList,
  ArrowRightLeft,
  ShoppingCart,
  Clock,
  User,
  MapPin,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import {
  getPendingSummary,
  PendingSummaryData,
} from "@/lib/apis/pending-summary";
import { updateTaskStatus } from "@/lib/apis/task";
import toast from "react-hot-toast";
import Link from "next/link";
import { useLocale } from "next-intl";

/* ──────────────────── helpers ──────────────────── */

function timeAgo(date: string | Date | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ──────────────────── page ──────────────────── */

export default function QuickAccessPage() {
  const t = useTranslations("quickAccess");
  const locale = useLocale();

  const [data, setData] = useState<PendingSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [completingTask, setCompletingTask] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const res = await getPendingSummary();
    if (res.success && res.data) {
      setData(res.data);
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCompleteTask = async (taskId: string) => {
    setCompletingTask(taskId);
    const res = await updateTaskStatus(taskId, "completed");
    if (res.success) {
      toast.success(t("taskCompleted"));
      fetchData(true);
    } else {
      toast.error(res.message || t("taskCompleteFailed"));
    }
    setCompletingTask(null);
  };

  /* ──────────────────── render ──────────────────── */

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
        {/* ── header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/10 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 ring-1 ring-amber-500/20">
                <LayoutDashboard className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {t("title")}
                </h1>
                <p className="mt-1 text-muted-foreground text-sm sm:text-base">
                  {t("subtitle")}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="shrink-0"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              {t("refresh")}
            </Button>
          </div>

          {/* ── stat pills ── */}
          {data && (
            <div className="relative mt-5 flex flex-wrap gap-3">
              <StatPill
                label={t("pendingTasks")}
                count={data.tasks}
                color="blue"
              />
              <StatPill
                label={t("pendingTransfers")}
                count={data.transfers}
                color="purple"
              />
              <StatPill
                label={t("pendingOrders")}
                count={data.orders}
                color="orange"
              />
              <StatPill
                label={t("totalPending")}
                count={data.total}
                color="red"
              />
            </div>
          )}
        </div>

        {/* ── loading state ── */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* ── 3-column grid ── */}
        {!loading && data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* ── Column 1: Pending Tasks ── */}
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-sm">{t("pendingTasks")}</h2>
                  <p className="text-xs text-muted-foreground">
                    {data.tasks} {t("pending")}
                  </p>
                </div>
                <Badge
                  variant={data.tasks > 0 ? "default" : "secondary"}
                  className={
                    data.tasks > 0
                      ? "bg-blue-500 hover:bg-blue-600 text-white"
                      : ""
                  }
                >
                  {data.tasks}
                </Badge>
              </div>

              <div className="divide-y">
                {data.latestTasks.length === 0 ? (
                  <EmptyState message={t("noTasks")} />
                ) : (
                  data.latestTasks.map((task: any) => (
                    <div
                      key={task._id}
                      className="p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {task.taskNumber}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {task.description || t("noDescription")}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        >
                          {t("pending")}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">
                            {task.staffId?.fullname || "—"}
                          </span>
                          <span>·</span>
                          <Clock className="h-3 w-3" />
                          <span>{timeAgo(task.createdAt)}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-green-600 hover:text-green-700 hover:bg-green-50"
                          disabled={completingTask === task._id}
                          onClick={() => handleCompleteTask(task._id)}
                        >
                          {completingTask === task._id ? (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                          )}
                          {t("markComplete")}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {data.tasks > 5 && (
                <div className="p-3 border-t">
                  <Link href={`/${locale}/dashboard/tasks`}>
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      {t("viewAll")} ({data.tasks})
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* ── Column 2: Pending Transfers ── */}
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
                  <ArrowRightLeft className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-sm">
                    {t("pendingTransfers")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {data.transfers} {t("pending")}
                  </p>
                </div>
                <Badge
                  variant={data.transfers > 0 ? "default" : "secondary"}
                  className={
                    data.transfers > 0
                      ? "bg-purple-500 hover:bg-purple-600 text-white"
                      : ""
                  }
                >
                  {data.transfers}
                </Badge>
              </div>

              <div className="divide-y">
                {data.latestTransfers.length === 0 ? (
                  <EmptyState message={t("noTransfers")} />
                ) : (
                  data.latestTransfers.map((tr: any) => (
                    <div
                      key={tr._id}
                      className="p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {tr.items
                              ?.map(
                                (i: any) => i.product?.name || "Item"
                              )
                              .join(", ") || t("transfer")}
                          </p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">
                              {tr.takenFrom?.name || "—"} → {tr.takenTo?.name || "—"}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        >
                          {t("pending")}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">
                            {tr.assignedTo?.fullname || "—"}
                          </span>
                          <span>·</span>
                          <span>Qty: {tr.quantity}</span>
                          <span>·</span>
                          <Clock className="h-3 w-3" />
                          <span>{timeAgo(tr.createdAt)}</span>
                        </div>
                        <Link href={`/${locale}/dashboard/transfers`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {t("view")}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {data.transfers > 5 && (
                <div className="p-3 border-t">
                  <Link href={`/${locale}/dashboard/transfers`}>
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      {t("viewAll")} ({data.transfers})
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </Card>

            {/* ── Column 3: Pending Orders ── */}
            <Card className="overflow-hidden">
              <div className="flex items-center gap-3 border-b p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10">
                  <ShoppingCart className="h-5 w-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-sm">
                    {t("pendingOrders")}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {data.orders} {t("pending")}
                  </p>
                </div>
                <Badge
                  variant={data.orders > 0 ? "default" : "secondary"}
                  className={
                    data.orders > 0
                      ? "bg-orange-500 hover:bg-orange-600 text-white"
                      : ""
                  }
                >
                  {data.orders}
                </Badge>
              </div>

              <div className="divide-y">
                {data.latestOrders.length === 0 ? (
                  <EmptyState message={t("noOrders")} />
                ) : (
                  data.latestOrders.map((order: any) => (
                    <div
                      key={order._id}
                      className="p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {order.orderNumber || `#${order._id?.slice(-6)}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">
                            {order.supplierId?.name || "—"}{" "}
                            {order.totalAmount
                              ? `· ${order.totalAmount.toLocaleString()} DA`
                              : ""}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={
                            order.status === "assigned"
                              ? "shrink-0 border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-300"
                              : "shrink-0 border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
                          }
                        >
                          {order.status === "assigned"
                            ? t("assigned")
                            : t("notAssigned")}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">
                            {order.staffId?.fullname || t("notAssigned")}
                          </span>
                          <span>·</span>
                          <span>
                            {order.items?.length || 0} {t("items")}
                          </span>
                          <span>·</span>
                          <Clock className="h-3 w-3" />
                          <span>{timeAgo(order.createdAt)}</span>
                        </div>
                        <Link href={`/${locale}/dashboard/purchases`}>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            {t("process")}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {data.orders > 5 && (
                <div className="p-3 border-t">
                  <Link href={`/${locale}/dashboard/purchases`}>
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      {t("viewAll")} ({data.orders})
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

/* ──────── sub-components ──────── */

function StatPill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: "blue" | "purple" | "orange" | "red";
}) {
  const colors = {
    blue: "bg-blue-500/10 text-blue-700 ring-blue-500/20 dark:text-blue-300",
    purple:
      "bg-purple-500/10 text-purple-700 ring-purple-500/20 dark:text-purple-300",
    orange:
      "bg-orange-500/10 text-orange-700 ring-orange-500/20 dark:text-orange-300",
    red: "bg-red-500/10 text-red-700 ring-red-500/20 dark:text-red-300",
  };

  return (
    <div
      className={`flex items-center gap-2 rounded-full px-3 py-1.5 ring-1 text-xs font-medium ${colors[color]}`}
    >
      <span className="font-bold text-sm">{count}</span>
      <span>{label}</span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
      <AlertCircle className="h-8 w-8 mb-2 opacity-40" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
