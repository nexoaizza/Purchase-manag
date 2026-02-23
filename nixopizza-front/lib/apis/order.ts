import axiosAPI from "../axios.ts";

// ✅ Create order
export const createOrder = async (orderData: any) => {
  try {
    const {
      data: { order },
    } = await axiosAPI.post("/staff-orders", orderData);
    return { success: true, order };
  } catch (error: any) {
    console.error("Order error:", error);
    const message = error.response?.data?.message || "Failed to create Order";
    return { success: false, message };
  }
};

// ✅ Get all orders
export const getOrders = async (params?: any) => {
  try {
    const {
      data: { orders, pages },
    } = await axiosAPI.get("/staff-orders", { params });
    return { success: true, orders, pages };
  } catch (error: any) {
    console.error("Orders error:", error);
    const message = error.response?.data?.message || "Failed to fetch Orders";
    return { success: false, message };
  }
};

// ✅ Update order status
export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const {
      data: { order },
    } = await axiosAPI.put(`/staff-orders/${orderId}`, { status });
    return { success: true, order };
  } catch (error: any) {
    console.error("Order status update error:", error);
    const message = error.response?.data?.message || "Failed to update order status";
    return { success: false, message };
  }
};

// ✅ Delete order
export const deleteOrder = async (orderId: string) => {
  try {
    const { data } = await axiosAPI.delete(`/staff-orders/${orderId}`);
    return { success: true, message: data.message };
  } catch (error: any) {
    console.error("Delete order error:", error);
    const message = error.response?.data?.message || "Failed to delete order";
    return { success: false, message };
  }
};
