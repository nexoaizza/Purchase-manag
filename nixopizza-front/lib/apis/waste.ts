import api from "../axios.ts";

export interface IWaste {
  _id: string;
  product: any;
  quantity: number;
  reason: string;
  stock?: any;
  staff?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create waste
export const createWaste = async (data: {
  product: string;
  quantity: number;
  reason: string;
  stock?: string;
  staff?: string;
}) => {
  try {
    const {
      data: { waste },
    } = await api.post("/wastes", data);
    return { success: true, waste };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to create waste record";
    return { success: false, message };
  }
};

// Get wastes
export const getWastes = async (params?: any) => {
  try {
    const {
      data: { wastes, total, pages },
    } = await api.get("/wastes", { params });
    return { success: true, wastes, total, pages };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch wastes";
    return { success: false, message };
  }
};

// Get one waste
export const getWaste = async (wasteId: string) => {
  try {
    const {
      data: { waste },
    } = await api.get("/wastes/" + wasteId);
    return { success: true, waste };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch waste";
    return { success: false, message };
  }
};

// Update waste
export const updateWaste = async (
  wasteId: string,
  data: {
    product?: string;
    quantity?: number;
    reason?: string;
    stock?: string;
    staff?: string;
  }
) => {
  try {
    const {
      data: { waste },
    } = await api.put("/wastes/" + wasteId, data);
    return { success: true, waste };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to update waste";
    return { success: false, message };
  }
};

// Delete waste
export const deleteWaste = async (wasteId: string) => {
  try {
    await api.delete("/wastes/" + wasteId);
    return { success: true };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to delete waste";
    return { success: false, message };
  }
};

// Get waste statistics by product
export const getWasteStatsByProduct = async (params?: any) => {
  try {
    const {
      data: { stats },
    } = await api.get("/wastes/stats/by-product", { params });
    return { success: true, stats };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch waste stats";
    return { success: false, message };
  }
};

// Get waste statistics by reason
export const getWasteStatsByReason = async (params?: any) => {
  try {
    const {
      data: { stats },
    } = await api.get("/wastes/stats/by-reason", { params });
    return { success: true, stats };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch waste stats";
    return { success: false, message };
  }
};
