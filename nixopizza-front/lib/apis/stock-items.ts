import api from "../axios.ts";

export interface IStockItem {
  _id: string;
  stock: {
    _id: string;
    name: string;
    location: string;
  };
  product: {
    _id: string;
    name: string;
    imageUrl: string;
    unit: string;
  };
  price: number;
  quantity: number;
  expireAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// Create stock item
export const createStockItem = async (data: {
  stock: string;
  product: string;
  price: number;
  quantity: number;
  expireAt?: Date;
}) => {
  try {
    const {
      data: { stockItem },
    } = await api.post("/stock-items", data);
    return { success: true, stockItem };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to create stock item";
    return { success: false, message };
  }
};

// Create multiple stock items
export const createMultipleStockItems = async (data: {
  stockId: string;
  items: {
    product: string;
    price: number;
    quantity: number;
    expireAt?: Date;
  }[];
}) => {
  try {
    const {
      data: { stockItems, count, message },
    } = await api.post("/stock-items/bulk", data);
    return { success: true, stockItems, count, message };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to create stock items";
    return { success: false, message };
  }
};

// Get stock items
export const getStockItems = async (params?: any) => {
  try {
    const {
      data: { stockItems, total, pages },
    } = await api.get("/stock-items", { params });
    return { success: true, stockItems, total, pages };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch stock items";
    return { success: false, message };
  }
};

// Get one stock item
export const getStockItem = async (stockItemId: string) => {
  try {
    const {
      data: { stockItem },
    } = await api.get("/stock-items/" + stockItemId);
    return { success: true, stockItem };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch stock item";
    return { success: false, message };
  }
};

// Update stock item
export const updateStockItem = async (
  stockItemId: string,
  data: {
    price?: number;
    quantity?: number;
    expireAt?: Date;
  }
) => {
  try {
    const {
      data: { stockItem },
    } = await api.put("/stock-items/" + stockItemId, data);
    return { success: true, stockItem };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to update stock item";
    return { success: false, message };
  }
};

// Delete stock item
export const deleteStockItem = async (stockItemId: string) => {
  try {
    const { data } = await api.delete("/stock-items/" + stockItemId);
    return { success: true, message: data.message };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to delete stock item";
    return { success: false, message };
  }
};

// Get expired stock items
export const getExpiredStockItems = async (params?: any) => {
  try {
    const {
      data: { stockItems, total, pages },
    } = await api.get("/stock-items/expired", { params });
    return { success: true, stockItems, total, pages };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch expired stock items";
    return { success: false, message };
  }
};

// Get expiring soon stock items
export const getExpiringSoonStockItems = async (params?: any) => {
  try {
    const {
      data: { stockItems, total, pages },
    } = await api.get("/stock-items/expiring-soon", { params });
    return { success: true, stockItems, total, pages };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch expiring soon stock items";
    return { success: false, message };
  }
};
