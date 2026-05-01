"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  FileSpreadsheet,
  Download,
  ShoppingCart,
  Trash2,
  Box,
  ArrowRightLeft,
  Package,
  Users,
  Loader2,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  generateReport,
  ReportDataType,
  REPORT_CONFIG,
} from "@/lib/apis/generate-report";
import toast from "react-hot-toast";

/* ───────────────────── data-type definitions ───────────────────── */

interface DataTypeOption {
  id: ReportDataType;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
}

const DATA_TYPES: DataTypeOption[] = [
  {
    id: "orders",
    icon: ShoppingCart,
    gradient: "from-blue-500/20 to-blue-600/5",
    borderColor: "border-blue-500/30",
  },
  {
    id: "waste",
    icon: Trash2,
    gradient: "from-red-500/20 to-red-600/5",
    borderColor: "border-red-500/30",
  },
  {
    id: "stockItems",
    icon: Box,
    gradient: "from-emerald-500/20 to-emerald-600/5",
    borderColor: "border-emerald-500/30",
  },
  {
    id: "transfers",
    icon: ArrowRightLeft,
    gradient: "from-purple-500/20 to-purple-600/5",
    borderColor: "border-purple-500/30",
  },
  {
    id: "products",
    icon: Package,
    gradient: "from-amber-500/20 to-amber-600/5",
    borderColor: "border-amber-500/30",
  },
  {
    id: "suppliers",
    icon: Users,
    gradient: "from-cyan-500/20 to-cyan-600/5",
    borderColor: "border-cyan-500/30",
  },
];

/* ────────────────────────── page ────────────────────────── */

export default function ReportsPage() {
  const t = useTranslations("reports");

  const [selected, setSelected] = useState<Set<ReportDataType>>(new Set());
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [downloaded, setDownloaded] = useState(false);

  // reset success badge after 4s
  useEffect(() => {
    if (!downloaded) return;
    const id = setTimeout(() => setDownloaded(false), 4000);
    return () => clearTimeout(id);
  }, [downloaded]);

  /* toggle helpers */
  const toggle = (id: ReportDataType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === DATA_TYPES.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(DATA_TYPES.map((d) => d.id)));
    }
  };

  /* download handler */
  const handleDownload = async () => {
    if (selected.size === 0) {
      toast.error(t("selectAtLeast"));
      return;
    }

    setLoading(true);
    setProgress({ current: 0, total: selected.size });

    try {
      await generateReport(
        {
          dataTypes: Array.from(selected),
          fromDate: fromDate ? new Date(fromDate) : undefined,
          toDate: toDate ? new Date(toDate) : undefined,
        },
        (current, total) => setProgress({ current, total })
      );
      setDownloaded(true);
      toast.success(t("downloadSuccess"));
    } catch (err: any) {
      console.error("Report generation failed:", err);
      toast.error(t("downloadError"));
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────── render ─────────────────────── */

  return (
    <DashboardLayout>
      <div className="space-y-8 p-4 sm:p-6 max-w-5xl mx-auto">
        {/* ── header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-6 sm:p-8">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <FileSpreadsheet className="h-6 w-6 text-primary" />
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
        </div>

        {/* ── data types ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("selectData")}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="text-xs"
            >
              {selected.size === DATA_TYPES.length
                ? t("deselectAll")
                : t("selectAll")}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DATA_TYPES.map((dt) => {
              const isSelected = selected.has(dt.id);
              const Icon = dt.icon;

              return (
                <div
                  key={dt.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggle(dt.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(dt.id);
                    }
                  }}
                  className={`
                    group relative flex items-center gap-3 rounded-xl border p-4
                    transition-all duration-200 text-left cursor-pointer
                    ${
                      isSelected
                        ? `bg-gradient-to-br ${dt.gradient} ${dt.borderColor} shadow-sm ring-1 ring-primary/10`
                        : "border-border hover:border-primary/20 hover:bg-muted/50"
                    }
                  `}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors
                    ${
                      isSelected
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {t(`types.${dt.id}`)}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {t(`typesDesc.${dt.id}`)}
                    </p>
                  </div>

                  <Checkbox
                    checked={isSelected}
                    className="shrink-0 pointer-events-none"
                    tabIndex={-1}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* ── date range ── */}
        <Card className="p-5 sm:p-6 space-y-4 border-dashed">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" />
            {t("dateRange")}
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            {t("dateRangeHint")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="report-from-date">{t("fromDate")}</Label>
              <Input
                id="report-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="report-to-date">{t("toDate")}</Label>
              <Input
                id="report-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* ── download button ── */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            id="download-report-btn"
            size="lg"
            onClick={handleDownload}
            disabled={loading || selected.size === 0}
            className="w-full sm:w-auto relative overflow-hidden bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {t("generating")} ({progress.current}/{progress.total})
              </>
            ) : downloaded ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                {t("downloaded")}
              </>
            ) : (
              <>
                <Download className="mr-2 h-5 w-5" />
                {t("download")}
              </>
            )}
          </Button>

          {selected.size > 0 && (
            <p className="text-sm text-muted-foreground">
              {selected.size} {t("sheetsSelected")}
            </p>
          )}

          {selected.size === 0 && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              {t("selectAtLeast")}
            </p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
