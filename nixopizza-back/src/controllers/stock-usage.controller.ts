import { Request, Response } from "express";
import { Types } from "mongoose";
import StockUsage from "../models/stock-usage.model";
import StockItem from "../models/stock-item.model";
import Product from "../models/product.model";

// ─── CREATE ────────────────────────────────────────────────────────────────────
export const createStockUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stockItemId, quantityUsed, staffId, note } = req.body;

    if (!stockItemId || !quantityUsed || !staffId) {
      res.status(400).json({ message: "stockItemId, quantityUsed, and staffId are required" });
      return;
    }

    const qty = Number(quantityUsed);
    if (qty < 1) {
      res.status(400).json({ message: "quantityUsed must be at least 1" });
      return;
    }

    // Fetch the stock item to denormalize product + stock
    const stockItem = await StockItem.findById(stockItemId);
    if (!stockItem) {
      res.status(404).json({ message: "StockItem not found" });
      return;
    }

    if (qty > stockItem.quantity) {
      res.status(400).json({ message: `quantityUsed (${qty}) exceeds available stock (${stockItem.quantity})` });
      return;
    }

    // Deduct from stock
    stockItem.quantity -= qty;
    await stockItem.save();

    // Record usage
    const usage = await StockUsage.create({
      stockItem: stockItemId,
      product: stockItem.product,
      stock: stockItem.stock,
      quantityUsed: qty,
      staff: staffId,
      usedAt: new Date(),
      note: note || undefined,
    });

    const populated = await StockUsage.findById(usage._id)
      .populate("product", "name imageUrl unit")
      .populate("stock", "name location")
      .populate("staff", "fullname email avatar")
      .populate("stockItem");

    res.status(201).json({ message: "Stock usage recorded successfully", usage: populated });
  } catch (error: any) {
    console.error("createStockUsage error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── GET ALL (paginated + filtered) ─────────────────────────────────────────────
export const getAllStockUsages = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      staffId,
      productId,
      productName,
      stockId,
      from,
      to,
      page = 1,
      limit = 20,
    } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      res.status(400).json({ message: "page and limit must be > 0" });
      return;
    }

    const query: any = {};

    if (staffId && Types.ObjectId.isValid(staffId as string)) {
      query.staff = new Types.ObjectId(staffId as string);
    }
    
    if (productId && Types.ObjectId.isValid(productId as string)) {
      query.product = new Types.ObjectId(productId as string);
    } else if (productName) {
      const products = await Product.find({
        name: { $regex: productName, $options: "i" },
      }).select("_id");
      const productIds = products.map((p) => p._id);
      query.product = { $in: productIds };
    }

    if (stockId && Types.ObjectId.isValid(stockId as string)) {
      query.stock = new Types.ObjectId(stockId as string);
    }
    if (from || to) {
      query.usedAt = {};
      if (from) query.usedAt.$gte = new Date(from as string);
      if (to)   query.usedAt.$lte = new Date(to as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await StockUsage.countDocuments(query);
    const usages = await StockUsage.find(query)
      .sort({ usedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate("product", "name imageUrl unit")
      .populate("stock", "name location")
      .populate("staff", "fullname email avatar")
      .populate({
        path: "stockItem",
        populate: { path: "product", select: "name unit" },
      });

    res.status(200).json({
      total,
      pages: Math.ceil(total / Number(limit)),
      usages,
    });
  } catch (error: any) {
    console.error("getAllStockUsages error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── GET BY ID ──────────────────────────────────────────────────────────────────
export const getStockUsageById = async (req: Request, res: Response): Promise<void> => {
  try {
    const usage = await StockUsage.findById(req.params.usageId)
      .populate("product", "name imageUrl unit")
      .populate("stock", "name location")
      .populate("staff", "fullname email avatar")
      .populate("stockItem");

    if (!usage) {
      res.status(404).json({ message: "Stock usage record not found" });
      return;
    }

    res.status(200).json({ usage });
  } catch (error: any) {
    console.error("getStockUsageById error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── UPDATE (note only — cannot change core usage facts) ───────────────────────
export const updateStockUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { note } = req.body;

    const usage = await StockUsage.findById(req.params.usageId);
    if (!usage) {
      res.status(404).json({ message: "Stock usage record not found" });
      return;
    }

    if (note !== undefined) usage.note = note;
    await usage.save();

    const populated = await StockUsage.findById(usage._id)
      .populate("product", "name imageUrl unit")
      .populate("stock", "name location")
      .populate("staff", "fullname email avatar");

    res.status(200).json({ message: "Stock usage updated", usage: populated });
  } catch (error: any) {
    console.error("updateStockUsage error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── DELETE ─────────────────────────────────────────────────────────────────────
export const deleteStockUsage = async (req: Request, res: Response): Promise<void> => {
  try {
    const usage = await StockUsage.findById(req.params.usageId);
    if (!usage) {
      res.status(404).json({ message: "Stock usage record not found" });
      return;
    }

    await StockUsage.findByIdAndDelete(req.params.usageId);
    res.status(200).json({ message: "Stock usage record deleted" });
  } catch (error: any) {
    console.error("deleteStockUsage error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── STATS by product ────────────────────────────────────────────────────────────
export const getStockUsageStatsByProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await StockUsage.aggregate([
      {
        $group: {
          _id: "$product",
          totalUsed: { $sum: "$quantityUsed" },
          usageCount: { $sum: 1 },
          lastUsed: { $max: "$usedAt" },
        },
      },
      { $sort: { totalUsed: -1 } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
      { $limit: 20 },
    ]);
    res.status(200).json({ stats });
  } catch (error: any) {
    console.error("getStockUsageStatsByProduct error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ─── STATS by staff ───────────────────────────────────────────────────────────
export const getStockUsageStatsByStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await StockUsage.aggregate([
      {
        $group: {
          _id: "$staff",
          totalUsed: { $sum: "$quantityUsed" },
          usageCount: { $sum: 1 },
          lastUsed: { $max: "$usedAt" },
        },
      },
      { $sort: { usageCount: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "staff",
        },
      },
      { $unwind: { path: "$staff", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          "staff.password": 0,
          "staff.fcmToken": 0,
        },
      },
    ]);
    res.status(200).json({ stats });
  } catch (error: any) {
    console.error("getStockUsageStatsByStaff error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
