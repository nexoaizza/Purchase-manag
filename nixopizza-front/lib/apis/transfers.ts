import api from "../axios.ts";

export interface ITransfer {
  _id: string;
  items: any[];
  takenFrom: any;
  takenTo: any;
  quantity: number;
  status: "pending" | "arrived";
  createdAt?: Date;
  updatedAt?: Date;
}

// Create transfer
export const createTransfer = async (data: {
  items: string[];
  takenFrom: string;
  takenTo: string;
  quantity: number;
  status?: "pending" | "arrived";
}) => {
  try {
    const {
      data: { transfer },
    } = await api.post("/transfers", data);
    return { success: true, transfer };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to create transfer";
    return { success: false, message };
  }
};

// Get transfers
export const getTransfers = async (params?: any) => {
  try {
    const {
      data: { transfers, total, pages },
    } = await api.get("/transfers", { params });
    return { success: true, transfers, total, pages };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch transfers";
    return { success: false, message };
  }
};

// Get one transfer
export const getTransfer = async (transferId: string) => {
  try {
    const {
      data: { transfer },
    } = await api.get("/transfers/" + transferId);
    return { success: true, transfer };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch transfer";
    return { success: false, message };
  }
};

// Update transfer
export const updateTransfer = async (
  transferId: string,
  data: {
    items?: string[];
    takenFrom?: string;
    takenTo?: string;
    quantity?: number;
    status?: "pending" | "arrived";
  }
) => {
  try {
    const {
      data: { transfer },
    } = await api.put("/transfers/" + transferId, data);
    return { success: true, transfer };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to update transfer";
    return { success: false, message };
  }
};

// Delete transfer
export const deleteTransfer = async (transferId: string) => {
  try {
    await api.delete("/transfers/" + transferId);
    return { success: true };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to delete transfer";
    return { success: false, message };
  }
};

// Get transfers by stock
export const getTransfersByStock = async (stockId: string) => {
  try {
    const {
      data: { transfers },
    } = await api.get(`/transfers/stock/${stockId}`);
    return { success: true, transfers };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch transfers";
    return { success: false, message };
  }
};
