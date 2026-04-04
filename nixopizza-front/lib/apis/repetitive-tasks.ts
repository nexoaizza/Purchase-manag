import axiosAPI from "../axios.ts";

export interface IRepetitiveTask {
  _id: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export const getRepetitiveTasks = async () => {
  try {
    const { data } = await axiosAPI.get("/repetitive-tasks");
    return { success: true, tasks: data.tasks as IRepetitiveTask[] };
  } catch (error: any) {
    console.error("Get Repetitive Tasks error:", error);
    const message = error.response?.data?.message || "Failed to fetch repetitive tasks";
    return { success: false, message };
  }
};

export const createRepetitiveTask = async (description: string) => {
  try {
    const { data } = await axiosAPI.post("/repetitive-tasks", { description });
    return { success: true, task: data.task as IRepetitiveTask };
  } catch (error: any) {
    console.error("Create Repetitive Task error:", error);
    const message = error.response?.data?.message || "Failed to create repetitive task";
    return { success: false, message };
  }
};

export const updateRepetitiveTask = async (id: string, description: string) => {
  try {
    const { data } = await axiosAPI.put(`/repetitive-tasks/${id}`, { description });
    return { success: true, task: data.task as IRepetitiveTask };
  } catch (error: any) {
    console.error("Update Repetitive Task error:", error);
    const message = error.response?.data?.message || "Failed to update repetitive task";
    return { success: false, message };
  }
};

export const selectRepetitiveTask = async (id: string) => {
  try {
    const { data } = await axiosAPI.put(`/repetitive-tasks/${id}`, { selectedAt: new Date().toISOString() });
    return { success: true, task: data.task as IRepetitiveTask };
  } catch (error: any) {
    console.error("Select Repetitive Task error:", error);
    const message = error.response?.data?.message || "Failed to select repetitive task";
    return { success: false, message };
  }
};

export const deleteRepetitiveTask = async (id: string) => {
  try {
    await axiosAPI.delete(`/repetitive-tasks/${id}`);
    return { success: true, message: "Task deleted successfully" };
  } catch (error: any) {
    console.error("Delete Repetitive Task error:", error);
    const message = error.response?.data?.message || "Failed to delete repetitive task";
    return { success: false, message };
  }
};
