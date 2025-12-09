import axiosAPI from "../axios.ts";

export interface TemplateItemDTO {
  productId: string;
  quantity: number;
}

export interface PurchaseTemplateDTO {
  _id: string;
  name: string;
  description?: string;
  items: Array<{ productId: any; quantity: number }>;
  createdAt: string;
  updatedAt: string;
}

export const listTemplates = async (params?: { page?: number; limit?: number; search?: string }) => {
  try {
    const { data } = await axiosAPI.get("/templates", { params });
    return { success: true, templates: data.templates as PurchaseTemplateDTO[], total: data.total, pages: data.pages };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Failed to load templates" };
  }
};

export const getTemplate = async (id: string) => {
  try {
    const { data } = await axiosAPI.get(`/templates/${id}`);
    return { success: true, template: data.template as PurchaseTemplateDTO };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Failed to fetch template" };
  }
};

export const createTemplate = async (payload: { name: string; description?: string; items: TemplateItemDTO[] }) => {
  try {
    const { data } = await axiosAPI.post("/templates", payload);
    return { success: true, template: data.template as PurchaseTemplateDTO };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Failed to create template" };
  }
};

export const updateTemplate = async (id: string, payload: { name?: string; description?: string; items?: TemplateItemDTO[] }) => {
  try {
    const { data } = await axiosAPI.put(`/templates/${id}`, payload);
    return { success: true, template: data.template as PurchaseTemplateDTO };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Failed to update template" };
  }
};

export const deleteTemplate = async (id: string) => {
  try {
    const { data } = await axiosAPI.delete(`/templates/${id}`);
    return { success: true, message: data.message };
  } catch (error: any) {
    return { success: false, message: error.response?.data?.message || "Failed to delete template" };
  }
};
