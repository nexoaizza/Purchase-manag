import axiosAPI from "../axios.ts";

// ✅ Get all stuffs
export const createTask = async (taskData: any) => {
  try {
    const {
      data: { task },
    } = await axiosAPI.post("/tasks", taskData);
    return { success: true, task };
  } catch (error: any) {
    console.error("Task error:", error);
    const message = error.response?.data?.message || "Failed to create Task";
    return { success: false, message };
  }
};

// ✅ Get all stuffs
export const getTasks = async (params?: any) => {
  try {
    const {
      data: { tasks, pages },
    } = await axiosAPI.get("/tasks", { params });
    return { success: true, tasks, pages };
  } catch (error: any) {
    console.error("Tasks error:", error);
    const message = error.response?.data?.message || "Failed to fetch Tasks";
    return { success: false, message };
  }
};
// ✅ Update task status
export const updateTaskStatus = async (taskId: string, status: string) => {
  try {
    const {
      data: { task },
    } = await axiosAPI.put(`/tasks/${taskId}`, { status });
    return { success: true, task };
  } catch (error: any) {
    console.error("Task status update error:", error);
    const message = error.response?.data?.message || "Failed to update task status";
    return { success: false, message };
  }
};

// ✅ Delete task
export const deleteTask = async (taskId: string) => {
  try {
    const { data } = await axiosAPI.delete(`/tasks/${taskId}`);
    return { success: true, message: data.message };
  } catch (error: any) {
    console.error("Delete task error:", error);
    const message = error.response?.data?.message || "Failed to delete task";
    return { success: false, message };
  }
};
