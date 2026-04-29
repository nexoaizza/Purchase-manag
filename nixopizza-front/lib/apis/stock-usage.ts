import api from "../axios.ts";

export interface IStockUsage {
  _id: string;
  stockItem: string | { _id: string; quantity: number };
  product: { _id: string; name: string; imageUrl?: string; unit: string };
  stock: { _id: string; name: string; location: string };
  quantityUsed: number;
  staff: { _id: string; fullname: string; email: string; avatar: string };
  usedAt: Date;
  note?: string;
  createdAt?: Date;
}

// Record a stock usage (also deducts quantity from the stock item)
export const createStockUsage = async (data: {
  stockItemId: string;
  quantityUsed: number;
  staffId: string;
  note?: string;
}) => {
  try {
    const { data: res } = await api.post("/stock-usages", data);
    return { success: true, usage: res.usage as IStockUsage };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to record stock usage";
    return { success: false, message };
  }
};

// Get paginated/filtered stock usages
export const getStockUsages = async (params?: {
  staffId?: string;
  productId?: string;
  productName?: string;
  stockId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}) => {
  try {
    const { data } = await api.get("/stock-usages", { params });
    return { success: true, usages: data.usages as IStockUsage[], total: data.total, pages: data.pages };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch stock usages";
    return { success: false, message, usages: [] };
  }
};

// Get a single stock usage by ID
export const getStockUsageById = async (usageId: string) => {
  try {
    const { data } = await api.get(`/stock-usages/${usageId}`);
    return { success: true, usage: data.usage as IStockUsage };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch stock usage";
    return { success: false, message };
  }
};

// Update note
export const updateStockUsage = async (usageId: string, note: string) => {
  try {
    const { data } = await api.put(`/stock-usages/${usageId}`, { note });
    return { success: true, usage: data.usage as IStockUsage };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to update stock usage";
    return { success: false, message };
  }
};

// Delete
export const deleteStockUsage = async (usageId: string) => {
  try {
    const { data } = await api.delete(`/stock-usages/${usageId}`);
    return { success: true, message: data.message };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to delete stock usage";
    return { success: false, message };
  }
};

// Stats
export const getStockUsageStatsByProduct = async () => {
  try {
    const { data } = await api.get("/stock-usages/stats/by-product");
    return { success: true, stats: data.stats };
  } catch (error: any) {
    return { success: false, stats: [] };
  }
};

export const getStockUsageStatsByStaff = async () => {
  try {
    const { data } = await api.get("/stock-usages/stats/by-staff");
    return { success: true, stats: data.stats };
  } catch (error: any) {
    return { success: false, stats: [] };
  }
};
