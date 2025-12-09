import { Request, Response } from "express";
import PurchaseTemplate from "../models/template.model";

export const listTemplates = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query: any = { ownerId: req.user?.userId };
    if (req.query.search) {
      const s = String(req.query.search).trim();
      if (s) query.name = { $regex: s, $options: "i" };
    }

    const [items, total] = await Promise.all([
      PurchaseTemplate.find(query)
        .populate({ path: "items.productId", select: "name imageUrl barcode" })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      PurchaseTemplate.countDocuments(query),
    ]);

    res.json({ templates: items, total, pages: Math.ceil(total / limit) });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to list templates", error: err.message });
  }
};

export const getTemplate = async (req: Request, res: Response) => {
  try {
    const tpl = await PurchaseTemplate.findOne({ _id: req.params.id, ownerId: req.user?.userId })
      .populate({ path: "items.productId", select: "name imageUrl barcode" });
    if (!tpl) return res.status(404).json({ message: "Template not found" });
    res.json({ template: tpl });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch template", error: err.message });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, items } = req.body as {
      name: string;
      description?: string;
      items: { productId: string; quantity: number }[];
    };

    if (!name || !Array.isArray(items)) {
      return res.status(400).json({ message: "Name and items are required" });
    }
    for (const it of items) {
      if (!it.productId || it.quantity == null || it.quantity < 0) {
        return res.status(400).json({ message: "Invalid item values" });
      }
    }

    const tpl = await PurchaseTemplate.create({
      name,
      description,
      items,
      ownerId: req.user?.userId,
    });
    res.status(201).json({ message: "Template created", template: tpl });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create template", error: err.message });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, items } = req.body as {
      name?: string;
      description?: string;
      items?: { productId: string; quantity: number }[];
    };

    const tpl = await PurchaseTemplate.findOne({ _id: req.params.id, ownerId: req.user?.userId });
    if (!tpl) return res.status(404).json({ message: "Template not found" });

    if (name !== undefined) tpl.name = name;
    if (description !== undefined) tpl.description = description;
    if (items !== undefined) {
      for (const it of items) {
        if (!it.productId || it.quantity == null || it.quantity < 0) {
          return res.status(400).json({ message: "Invalid item values" });
        }
      }
      (tpl as any).items = items;
    }

    await tpl.save();
    const populated = await PurchaseTemplate.findById(tpl._id)
      .populate({ path: "items.productId", select: "name imageUrl barcode" });
    res.json({ message: "Template updated", template: populated });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to update template", error: err.message });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const tpl = await PurchaseTemplate.findOneAndDelete({ _id: req.params.id, ownerId: req.user?.userId });
    if (!tpl) return res.status(404).json({ message: "Template not found" });
    res.json({ message: "Template deleted" });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to delete template", error: err.message });
  }
};
