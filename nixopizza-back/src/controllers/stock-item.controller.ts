import { Request, Response } from "express";
import { Types } from "mongoose";
import StockItem from "../models/stock-item.model";
import Stock from "../models/stock.model";

// CREATE
export const createStockItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stock, product, price, quantity, expireAt } = req.body;

    if (!stock || !product || price === undefined || quantity === undefined) {
      res.status(400).json({ message: "Missing required fields: stock, product, price, quantity" });
      return;
    }

    // Verify stock exists
    const stockDoc = await Stock.findById(stock);
    if (!stockDoc) {
      res.status(404).json({ message: "Stock not found" });
      return;
    }

    const newStockItem : any = await StockItem.create({
      stock,
      product,
      price: Number(price),
      quantity: Number(quantity),
      expireAt: expireAt || undefined,
    });

    // Add item to stock's items array
    stockDoc.items.push(newStockItem._id);
    await stockDoc.save();

    const populatedItem = await StockItem.findById(newStockItem._id)
      .populate("product")
      .populate("stock");

    res.status(201).json({ message: "Stock item created successfully", stockItem: populatedItem });
  } catch (error: any) {
    console.error("Stock item create error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// CREATE MULTIPLE
export const createMultipleStockItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stockId, items } = req.body;

    if (!stockId) {
      res.status(400).json({ message: "Missing required field: stockId" });
      return;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "Missing required field: items (must be a non-empty array)" });
      return;
    }

    // Verify stock exists
    const stockDoc = await Stock.findById(stockId);
    if (!stockDoc) {
      res.status(404).json({ message: "Stock not found" });
      return;
    }

    // Validate all items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product || item.price === undefined || item.quantity === undefined) {
        res.status(400).json({ 
          message: `Item at index ${i} is missing required fields: product, price, quantity` 
        });
        return;
      }
    }

    const createdItems: any[] = [];

    // Process each item
    for (const item of items) {
      const { product, price, quantity, expireAt } = item;

      const newStockItem: any = await StockItem.create({
        stock: stockId,
        product,
        price: Number(price),
        quantity: Number(quantity),
        expireAt: expireAt || undefined,
      });

      // Add item to stock's items array
      stockDoc.items.push(newStockItem._id);

      createdItems.push(newStockItem);
    }

    // Save stock with all new items
    await stockDoc.save();

    // Populate all created items
    const populatedItems = await StockItem.find({
      _id: { $in: createdItems.map(item => item._id) }
    })
      .populate("product")
      .populate("stock");

    res.status(201).json({ 
      message: `${createdItems.length} stock items created successfully`, 
      stockItems: populatedItems,
      count: createdItems.length
    });
  } catch (error: any) {
    console.error("Create multiple stock items error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// UPDATE
export const updateStockItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { price, quantity, expireAt } = req.body;

    const stockItem = await StockItem.findById(req.params.stockItemId);
    if (!stockItem) {
      res.status(404).json({ message: "Stock item not found" });
      return;
    }

    if (price !== undefined) stockItem.price = Number(price);
    if (quantity !== undefined) stockItem.quantity = Number(quantity);
    if (expireAt !== undefined) stockItem.expireAt = expireAt;

    await stockItem.save();

    const populatedItem = await StockItem.findById(stockItem._id)
      .populate("product")
      .populate("stock");

    res.status(200).json({ message: "Stock item updated successfully", stockItem: populatedItem });
  } catch (error: any) {
    console.error("Stock item update error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// GET ALL with pagination and filtering
export const getAllStockItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { 
      location, 
      product, 
      category,
      stock,
      minQuantity, 
      maxQuantity,
      createdAtFrom,
      createdAtTo,
      expireAtFrom,
      expireAtTo,
      page = 1, 
      limit = 10 
    } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      res.status(400).json({ message: "Page and limit must be greater than 0" });
      return;
    }

    const query: any = {};

    // Filter by product
    if (product) {
      if (!Types.ObjectId.isValid(product as string)) {
        res.status(400).json({ message: "Invalid product id" });
        return;
      }
      query.product = new Types.ObjectId(product as string);
    }

    // Filter by stock
    if (stock) {
      if (!Types.ObjectId.isValid(stock as string)) {
        res.status(400).json({ message: "Invalid stock id" });
        return;
      }
      query.stock = new Types.ObjectId(stock as string);
    }

    if (category) {
      if (!Types.ObjectId.isValid(category as string)) {
        res.status(400).json({ message: "Invalid category id" });
        return;
      }
    }

    // Filter by quantity range
    if (minQuantity !== undefined || maxQuantity !== undefined) {
      query.quantity = {};
      if (minQuantity !== undefined) query.quantity.$gte = Number(minQuantity);
      if (maxQuantity !== undefined) query.quantity.$lte = Number(maxQuantity);
    }

    // Filter by createdAt date range
    if (createdAtFrom !== undefined || createdAtTo !== undefined) {
      query.createdAt = {};
      if (createdAtFrom) query.createdAt.$gte = new Date(createdAtFrom as string);
      if (createdAtTo) query.createdAt.$lte = new Date(createdAtTo as string);
    }

    // Filter by expireAt date range
    if (expireAtFrom !== undefined || expireAtTo !== undefined) {
      query.expireAt = {};
      if (expireAtFrom) query.expireAt.$gte = new Date(expireAtFrom as string);
      if (expireAtTo) query.expireAt.$lte = new Date(expireAtTo as string);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const pipeline: any[] = [
      { $match: query },
      {
        $lookup: {
          from: "products",
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      {
        $unwind: {
          path: "$product",
          preserveNullAndEmptyArrays: true,
        },
      },
      ...(category
        ? [
            {
              $match: {
                "product.categoryId": new Types.ObjectId(category as string),
              },
            },
          ]
        : []),
      {
        $lookup: {
          from: "categories",
          localField: "product.categoryId",
          foreignField: "_id",
          as: "category",
        },
      },
      {
        $unwind: {
          path: "$category",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $addFields: {
          "product.category": "$category",
        },
      },
      {
        $project: {
          category: 0,
        },
      },
      {
        $lookup: {
          from: "stocks",
          localField: "stock",
          foreignField: "_id",
          as: "stock",
        },
      },
      {
        $unwind: {
          path: "$stock",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    if (location) {
      pipeline.push({
        $match: {
          "stock.location": { $regex: location as string, $options: "i" },
        },
      });
    }

    pipeline.push(
      { $sort: { "product.name": 1 } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: Number(limit) }],
        },
      }
    );

    const aggregatedResult = await StockItem.aggregate(pipeline);
    const total = aggregatedResult[0]?.metadata?.[0]?.total || 0;
    const stockItems = aggregatedResult[0]?.data || [];

    res.status(200).json({
      total,
      pages: Math.ceil(total / Number(limit)),
      stockItems,
    });
  } catch (error: any) {
    console.error("Get stock items error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// GET SINGLE
export const getStockItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const stockItem = await StockItem.findById(req.params.stockItemId)
      .populate("product")
      .populate("stock");

    if (!stockItem) {
      res.status(404).json({ message: "Stock item not found" });
      return;
    }

    res.status(200).json({ stockItem });
  } catch (error: any) {
    console.error("Get stock item error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// DELETE
export const deleteStockItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const stockItem = await StockItem.findById(req.params.stockItemId);
    
    if (!stockItem) {
      res.status(404).json({ message: "Stock item not found" });
      return;
    }

    // Remove item reference from stock
    const stock = await Stock.findById(stockItem.stock);
    if (stock) {
      stock.items = stock.items.filter(item => item.toString() !== req.params.stockItemId);
      await stock.save();
    }

    await StockItem.findByIdAndDelete(req.params.stockItemId);

    res.status(200).json({ message: "Stock item deleted successfully" });
  } catch (error: any) {
    console.error("Delete stock item error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// GET EXPIRED ITEMS
export const getExpiredStockItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      res.status(400).json({ message: "Page and limit must be greater than 0" });
      return;
    }

    const now = new Date();

    // Get all stock items with product populated
    const allStockItems = await StockItem.find()
      .populate("product")
      .populate("stock")
      .sort({ name: 1 });

    // Filter items that are expired based on expectedLifeTime
    const expiredItems = allStockItems.filter((item: any) => {
      if (!item.product || !item.product.expectedLifeTime || item.product.expectedLifeTime <= 0) {
        return false; // Skip items without expectedLifeTime
      }
      
      const createdAt = new Date(item.createdAt);
      const expectedLifeTimeDays = item.product.expectedLifeTime;
      const expirationDate = new Date(createdAt);
      expirationDate.setDate(expirationDate.getDate() + expectedLifeTimeDays);
      
      return now > expirationDate; // Expired if current date is past expiration
    });

    // Apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedItems = expiredItems.slice(skip, skip + Number(limit));

    res.status(200).json({
      total: expiredItems.length,
      pages: Math.ceil(expiredItems.length / Number(limit)),
      stockItems: paginatedItems,
    });
  } catch (error: any) {
    console.error("Get expired stock items error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// GET EXPIRING SOON ITEMS
export const getExpiringSoonStockItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 10 } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      res.status(400).json({ message: "Page and limit must be greater than 0" });
      return;
    }

    const now = new Date();

    // Get all stock items with product populated
    const allStockItems = await StockItem.find()
      .populate("product")
      .populate("stock")
      .sort({ createdAt: 1 });

    // Filter items that are expiring soon (>70% of lifetime passed but not yet expired)
    const expiringSoonItems = allStockItems.filter((item: any) => {
      if (!item.product || !item.product.expectedLifeTime || item.product.expectedLifeTime <= 0) {
        return false; // Skip items without expectedLifeTime
      }
      
      const createdAt = new Date(item.createdAt);
      const expectedLifeTimeDays = item.product.expectedLifeTime;
      const expirationDate = new Date(createdAt);
      expirationDate.setDate(expirationDate.getDate() + expectedLifeTimeDays);
      
      // Calculate how much time has passed
      const timeElapsedMs = now.getTime() - createdAt.getTime();
      const totalLifetimeMs = expectedLifeTimeDays * 24 * 60 * 60 * 1000;
      const percentagePassed = timeElapsedMs / totalLifetimeMs;
      
      // Expiring soon if >70% passed and not yet expired
      return percentagePassed > 0.7 && now <= expirationDate;
    });

    // Apply pagination
    const skip = (Number(page) - 1) * Number(limit);
    const paginatedItems = expiringSoonItems.slice(skip, skip + Number(limit));

    res.status(200).json({
      total: expiringSoonItems.length,
      pages: Math.ceil(expiringSoonItems.length / Number(limit)),
      stockItems: paginatedItems,
    });
  } catch (error: any) {
    console.error("Get expiring soon stock items error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};
