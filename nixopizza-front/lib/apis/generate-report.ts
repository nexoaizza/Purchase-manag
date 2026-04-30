import * as XLSX from "xlsx";
import { getOrders } from "./purchase-list";
import { getWastes } from "./waste";
import { getStockItems } from "./stock-items";
import { getTransfers } from "./transfers";
import { getProducts } from "./products";
import { get_all_suppliers } from "./suppliers";

export type ReportDataType =
  | "orders"
  | "waste"
  | "stockItems"
  | "transfers"
  | "products"
  | "suppliers";

interface ReportOptions {
  dataTypes: ReportDataType[];
  fromDate?: Date;
  toDate?: Date;
}

// ── helpers ──────────────────────────────────────────────────────────

function fmt(date: string | Date | undefined | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtDateTime(date: string | Date | undefined | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function autoFitColumns(ws: XLSX.WorkSheet, data: Record<string, unknown>[]) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const colWidths = keys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? "").length)
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws["!cols"] = colWidths;
}

// ── per-type fetchers & mappers ──────────────────────────────────────

async function fetchOrders(from?: Date, to?: Date) {
  const params: Record<string, unknown> = { limit: 10000, page: 1 };
  if (from) params.fromDate = from.toISOString();
  if (to) params.toDate = to.toISOString();

  const res = await getOrders(params);
  if (!res.success || !res.orders) return [];

  return res.orders.map((o: any) => ({
    "Order #": o.orderNumber || "",
    Supplier: o.supplierId?.name || o.supplierId || "",
    "Contact Person": o.supplierId?.contactPerson || "",
    Staff: o.staffId?.fullname || o.staffId || "",
    Status: o.status || "",
    "Total Amount (DA)": o.totalAmount ?? 0,
    "Items Count": o.items?.length ?? 0,
    Notes: o.notes || "",
    "Created At": fmtDateTime(o.createdAt),
    "Assigned Date": fmtDateTime(o.assignedDate),
    "Verified Date": fmtDateTime(o.verifiedDate),
    "Paid Date": fmtDateTime(o.paidDate),
    "Expected Date": fmt(o.expectedDate),
  }));
}

async function fetchWaste(from?: Date, to?: Date) {
  const params: Record<string, unknown> = { limit: 10000, page: 1 };
  if (from) params.fromDate = from.toISOString();
  if (to) params.toDate = to.toISOString();

  const res = await getWastes(params);
  if (!res.success || !res.wastes) return [];

  return res.wastes.map((w: any) => ({
    Product: w.product?.name || w.product || "",
    Quantity: w.quantity ?? 0,
    Unit: w.product?.unit || "",
    Reason: w.reason || "",
    Stock: w.stock?.name || w.stock || "",
    "Reported By": w.staff?.fullname || w.staff || "",
    Date: fmtDateTime(w.createdAt),
  }));
}

async function fetchStockItems(from?: Date, to?: Date) {
  const params: Record<string, unknown> = { limit: 10000, page: 1 };
  if (from) params.fromDate = from.toISOString();
  if (to) params.toDate = to.toISOString();

  const res = await getStockItems(params);
  if (!res.success || !res.stockItems) return [];

  return res.stockItems.map((si: any) => ({
    Product: si.product?.name || si.product || "",
    "Stock Location": si.stock?.name || si.stock || "",
    "Price (DA)": si.price ?? 0,
    Quantity: si.quantity ?? 0,
    Unit: si.product?.unit || "",
    "Expiration Date": fmt(si.expireAt),
    "Date Added": fmtDateTime(si.createdAt),
  }));
}

async function fetchTransfers(from?: Date, to?: Date) {
  const params: Record<string, unknown> = { limit: 10000, page: 1 };
  if (from) params.fromDate = from.toISOString();
  if (to) params.toDate = to.toISOString();

  const res = await getTransfers(params);
  if (!res.success || !res.transfers) return [];

  return res.transfers.map((t: any) => ({
    "From Stock": t.takenFrom?.name || t.takenFrom || "",
    "To Stock": t.takenTo?.name || t.takenTo || "",
    Quantity: t.quantity ?? 0,
    Status: t.status || "",
    "Assigned To": t.assignedTo?.fullname || t.assignedTo || "",
    "Start Time": fmtDateTime(t.startTime),
    "Created At": fmtDateTime(t.createdAt),
  }));
}

async function fetchProducts() {
  const res = await getProducts({ limit: 10000, page: 1 });
  if (!res.success || !res.products) return [];

  return res.products.map((p: any) => ({
    Name: p.name || "",
    Barcode: p.barcode || "",
    Category: p.categoryId?.name || p.categoryId || "",
    Unit: p.unit || "",
    "Min Qty": p.minQty ?? 0,
    "Recommended Qty": p.recommendedQty ?? 0,
    "Expected Life (days)": p.expectedLifeTime ?? "",
    Description: p.description || "",
    "Created At": fmtDateTime(p.createdAt),
  }));
}

async function fetchSuppliers() {
  const res = await get_all_suppliers({ limit: 10000 });
  const suppliers = res?.suppliers || res || [];
  if (!Array.isArray(suppliers)) return [];

  return suppliers.map((s: any) => ({
    Name: s.name || "",
    "Contact Person": s.contactPerson || "",
    Email: s.email || "",
    "Phone 1": s.phone1 || "",
    "Phone 2": s.phone2 || "",
    "Phone 3": s.phone3 || "",
    Address: s.address || "",
    City: s.city || "",
    Active: s.isActive ? "Yes" : "No",
    Notes: s.notes || "",
    "Created At": fmtDateTime(s.createdAt),
  }));
}

// ── map of data type → { fetcher, sheet-name } ──────────────────────

const REPORT_CONFIG: Record<
  ReportDataType,
  {
    label: string;
    fetch: (from?: Date, to?: Date) => Promise<Record<string, unknown>[]>;
    useDateRange: boolean;
  }
> = {
  orders: { label: "Purchase Orders", fetch: fetchOrders, useDateRange: true },
  waste: { label: "Waste Records", fetch: fetchWaste, useDateRange: true },
  stockItems: {
    label: "Stock Items",
    fetch: fetchStockItems,
    useDateRange: true,
  },
  transfers: { label: "Transfers", fetch: fetchTransfers, useDateRange: true },
  products: { label: "Products", fetch: fetchProducts, useDateRange: false },
  suppliers: { label: "Suppliers", fetch: fetchSuppliers, useDateRange: false },
};

// ── main export function ────────────────────────────────────────────

export async function generateReport(
  options: ReportOptions,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const { dataTypes, fromDate, toDate } = options;
  const wb = XLSX.utils.book_new();
  const total = dataTypes.length;

  for (let i = 0; i < dataTypes.length; i++) {
    const dtype = dataTypes[i];
    const config = REPORT_CONFIG[dtype];
    if (!config) continue;

    onProgress?.(i + 1, total);

    const from = config.useDateRange ? fromDate : undefined;
    const to = config.useDateRange ? toDate : undefined;

    const rows = await config.fetch(from, to);

    let ws: XLSX.WorkSheet;
    if (rows.length === 0) {
      ws = XLSX.utils.aoa_to_sheet([["No data found for this period"]]);
    } else {
      ws = XLSX.utils.json_to_sheet(rows);
      autoFitColumns(ws, rows);
    }

    // sheet name max 31 chars
    const sheetName = config.label.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  // Generate filename with date range
  const today = new Date().toISOString().slice(0, 10);
  let filename = `Report_${today}`;
  if (fromDate) filename += `_from_${fromDate.toISOString().slice(0, 10)}`;
  if (toDate) filename += `_to_${toDate.toISOString().slice(0, 10)}`;
  filename += ".xlsx";

  XLSX.writeFile(wb, filename);
}

export { REPORT_CONFIG };
