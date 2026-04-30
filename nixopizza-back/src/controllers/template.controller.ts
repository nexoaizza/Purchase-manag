import { Request, Response } from "express";
import PurchaseTemplate from "../models/template.model";
import Supplier from "../models/supplier.model";
import Product from "../models/product.model";

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
        .populate({ path: "items.productId", select: "name imageUrl barcode categoryId" })
        .populate({ path: "supplierId", select: "name image" })
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
      .populate({ path: "items.productId", select: "name imageUrl barcode categoryId" })
      .populate({ path: "supplierId", select: "name image" });
    if (!tpl) return res.status(404).json({ message: "Template not found" });
    res.json({ template: tpl });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to fetch template", error: err.message });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, items, supplierId } = req.body as {
      name: string;
      description?: string;
      items: { productId: string; quantity: number }[];
      supplierId: string;
    };

    if (!name || !Array.isArray(items) || !supplierId) {
      return res.status(400).json({ message: "Name, supplierId and items are required" });
    }
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) return res.status(404).json({ message: "Supplier not found" });
    for (const it of items) {
      if (!it.productId || it.quantity == null || it.quantity < 0) {
        return res.status(400).json({ message: "Invalid item values" });
      }
      const product = await Product.findById(it.productId).select("categoryId");
      if (!product) return res.status(404).json({ message: `Product not found: ${it.productId}` });
      const allowed = supplier.categoryIds.map(String);
      if (!allowed.includes(String(product.categoryId))) {
        return res.status(400).json({ message: "Product does not belong to supplier categories" });
      }
    }

    const tpl = await PurchaseTemplate.create({
      name,
      description,
      items,
      supplierId,
      ownerId: req.user?.userId,
    });
    res.status(201).json({ message: "Template created", template: tpl });
  } catch (err: any) {
    res.status(500).json({ message: "Failed to create template", error: err.message });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { name, description, items, supplierId } = req.body as {
      name?: string;
      description?: string;
      items?: { productId: string; quantity: number }[];
      supplierId?: string;
    };

    const tpl = await PurchaseTemplate.findOne({ _id: req.params.id, ownerId: req.user?.userId });
    if (!tpl) return res.status(404).json({ message: "Template not found" });

    if (name !== undefined) tpl.name = name;
    if (description !== undefined) tpl.description = description;
    if (supplierId !== undefined) {
      const supplier = await Supplier.findById(supplierId);
      if (!supplier) return res.status(404).json({ message: "Supplier not found" });
      (tpl as any).supplierId = supplier._id;
      if (items === undefined) {
        // still validate existing items against new supplier
        for (const it of tpl.items) {
          const product = await Product.findById((it as any).productId).select("categoryId");
          if (!product) return res.status(404).json({ message: "Product not found in existing items" });
          const allowed = supplier.categoryIds.map(String);
          if (!allowed.includes(String(product.categoryId))) {
            return res.status(400).json({ message: "Existing item not allowed for new supplier" });
          }
        }
      }
    }
    if (items !== undefined) {
      for (const it of items) {
        if (!it.productId || it.quantity == null || it.quantity < 0) {
          return res.status(400).json({ message: "Invalid item values" });
        }
        const supplier = await Supplier.findById(supplierId ?? (tpl as any).supplierId);
        if (!supplier) return res.status(404).json({ message: "Supplier not found" });
        const product = await Product.findById(it.productId).select("categoryId");
        if (!product) return res.status(404).json({ message: `Product not found: ${it.productId}` });
        const allowed = supplier.categoryIds.map(String);
        if (!allowed.includes(String(product.categoryId))) {
          return res.status(400).json({ message: "Product does not belong to supplier categories" });
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
