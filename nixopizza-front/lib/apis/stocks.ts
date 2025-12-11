import api from "../axios.ts";

export interface IStock {
  _id: string;
  name: string;
  description: string;
  location: string;
  items: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Create stock
export const createStock = async (data: {
  name: string;
  description: string;
  location: string;
}) => {
  try {
    const {
      data: { stock },
    } = await api.post("/stocks", data);
    return { success: true, stock };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to create stock";
    return { success: false, message };
  }
};

// Get stocks
export const getStocks = async (params?: any) => {
  try {
    const {
      data: { stocks, total, pages },
    } = await api.get("/stocks", { params });
    return { success: true, stocks, total, pages };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch stocks";
    return { success: false, message };
  }
};

// Get one stock
export const getStock = async (stockId: string) => {
  try {
    const {
      data: { stock },
    } = await api.get("/stocks/" + stockId);
    return { success: true, stock };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to fetch stock";
    return { success: false, message };
  }
};

// Update stock
export const updateStock = async (
  stockId: string,
  data: {
    name?: string;
    description?: string;
    location?: string;
  }
) => {
  try {
    const {
      data: { stock },
    } = await api.put("/stocks/" + stockId, data);
    return { success: true, stock };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to update stock";
    return { success: false, message };
  }
};

// Delete stock
export const deleteStock = async (stockId: string) => {
  try {
    const { data } = await api.delete("/stocks/" + stockId);
    return { success: true, message: data.message };
  } catch (error: any) {
    const message = error.response?.data?.message || "Failed to delete stock";
    return { success: false, message };
  }
};

// Add item to stock
export const addItemToStock = async (
  stockId: string,
  data: {
    product: string;
    price: number;
    quantity: number;
    expireAt?: Date;
  }
) => {
  try {
    const {
      data: { stockItem },
    } = await api.post(`/stocks/${stockId}/items`, data);
    return { success: true, stockItem };
  } catch (error: any) {
    const message =
      error.response?.data?.message || "Failed to add item to stock";
    return { success: false, message };
  }
};

// Remove item from stock
export const removeItemFromStock = async (
  stockId: string,
  itemId: string
) => {
  try {
    const { data } = await api.delete(`/stocks/${stockId}/items/${itemId}`);
    return { success: true, message: data.message };
  } catch (error: any) {
    const message =
      error.response?.data?.message || "Failed to remove item from stock";
    return { success: false, message };
  }
};
