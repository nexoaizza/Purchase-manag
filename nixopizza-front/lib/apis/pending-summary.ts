import api from "../axios.ts";

export interface PendingSummaryData {
  tasks: number;
  transfers: number;
  orders: number;
  total: number;
  latestTasks: any[];
  latestTransfers: any[];
  latestOrders: any[];
}

export const getPendingSummary = async () => {
  try {
    const {
      data: { data },
    } = await api.get("/admin/pending-summary");
    return { success: true, data: data as PendingSummaryData };
  } catch (error: any) {
    console.error("PendingSummary error:", error);
    const message =
      error.response?.data?.message ||
      "Failed to fetch pending summary";
    return { success: false, message };
  }
};
