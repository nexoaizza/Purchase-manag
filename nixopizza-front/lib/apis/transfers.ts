import api from "../axios.ts";

export type TransferStatus = "pending" | "in_progress" | "arrived" | "canceled";

export interface ITransfer {
  _id: string;
  items: any[];
  takenFrom: any;
  takenTo: any;
  quantity: number;
<<<<<<< HEAD
  status: "pending" | "arrived";
  assignedTo?: any;
  startTime?: Date | string;
=======
  status: TransferStatus;
  assignedTo?: any;
  startTime?: Date;
>>>>>>> development
  createdAt?: Date;
  updatedAt?: Date;
}

// Create transfer
export const createTransfer = async (data: {
  items: string[];
  takenFrom: string;
  takenTo: string;
  quantity: number;
<<<<<<< HEAD
  status?: "pending" | "arrived";
  assignedTo: string;
  startTime: string;
=======
  assignedTo: string;
  startTime: string;
  status?: TransferStatus;
>>>>>>> development
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
    const { data } = await api.get("/transfers", { params });
    const transfers = data?.transfers || [];
    const total = data?.total ?? data?.pagination?.totalItems ?? 0;
    const pages = data?.pages ?? data?.pagination?.totalPages ?? 1;
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
<<<<<<< HEAD
    status?: "pending" | "arrived";
    assignedTo?: string;
    startTime?: string;
=======
    assignedTo?: string;
    status?: TransferStatus;
>>>>>>> development
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

// Get transfers assigned to the logged-in staff member
export const getMyTransfers = async (params?: { page?: number; limit?: number }) => {
  try {
    const {
      data: { transfers, pagination },
    } = await api.get("/transfers/my", { params });
    return { success: true, transfers, pagination };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch your transfers";
    return { success: false, message };
  }
};
