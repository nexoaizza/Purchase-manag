import { Request, Response } from "express";
import Stock from "../models/stock.model";
import StockItem from "../models/stock-item.model";
import Product from "../models/product.model";

// CREATE
export const createStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, location } = req.body;

    if (!name || !description || !location) {
      res.status(400).json({ message: "Missing required fields: name, description, location" });
      return;
    }

    const newStock = await Stock.create({
      name,
      description,
      location,
      items: [],
    });

    res.status(201).json({ message: "Stock created successfully", stock: newStock });
  } catch (error: any) {
    console.error("Stock create error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// UPDATE
export const updateStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, location } = req.body;

    const stock = await Stock.findById(req.params.stockId);
    if (!stock) {
      res.status(404).json({ message: "Stock not found" });
      return;
    }

    if (name !== undefined) stock.name = name;
    if (description !== undefined) stock.description = description;
    if (location !== undefined) stock.location = location;

    await stock.save();

    res.status(200).json({ message: "Stock updated successfully", stock });
  } catch (error: any) {
    console.error("Stock update error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// GET ALL with pagination and filtering
export const getAllStocks = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, location, items, itemName, sortBy, order, page = 1, limit = 10 } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      res.status(400).json({ message: "Page and limit must be greater than 0" });
      return;
    }

    const query: any = {};
    
    // Filter by location
    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    // Filter by name
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    // Filter by items (check if stock contains specific item IDs)
    if (items) {
      const itemIds = Array.isArray(items) ? items : [items];
      query.items = { $in: itemIds };
    }

    // Filter by item product name
    if (itemName) {
      // Find products matching the name
      const products = await Product.find({
        name: { $regex: itemName, $options: "i" }
      }).select("_id");
      
      const productIds = products.map(p => p._id);
      
      // Find stock items with those products
      const stockItems = await StockItem.find({
        product: { $in: productIds }
      }).select("stock");
      
      const stockIds = [...new Set(stockItems.map(item => item.stock.toString()))];
      
      // Add to query to filter stocks by those IDs
      if (stockIds.length > 0) {
        query._id = { $in: stockIds };
      } else {
        // If no matching products found, return empty result
        res.status(200).json({
          total: 0,
          pages: 0,
          stocks: [],
        });
        return;
      }
    }

    const sortField = sortBy?.toString() || "createdAt";
    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);

    const stocks = await Stock.find(query)
      .populate({
        path: "items",
        populate: {
          path: "product",
          model: "Product",
        },
      })
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(Number(limit));

    const total = await Stock.countDocuments(query);

    res.status(200).json({
      total,
      pages: Math.ceil(total / Number(limit)),
      stocks,
    });
  } catch (error: any) {
    console.error("Get stocks error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// GET SINGLE
export const getStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const stock = await Stock.findById(req.params.stockId).populate({
      path: "items",
      populate: {
        path: "product",
        model: "Product",
      },
    });

    if (!stock) {
      res.status(404).json({ message: "Stock not found" });
      return;
    }

    res.status(200).json({ stock });
  } catch (error: any) {
    console.error("Get stock error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// DELETE
export const deleteStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const stock = await Stock.findById(req.params.stockId);
    
    if (!stock) {
      res.status(404).json({ message: "Stock not found" });
      return;
    }

    // Delete all associated stock items
    if (stock.items && stock.items.length > 0) {
      await StockItem.deleteMany({ _id: { $in: stock.items } });
    }

    await Stock.findByIdAndDelete(req.params.stockId);

    res.status(200).json({ message: "Stock and associated items deleted successfully" });
  } catch (error: any) {
    console.error("Delete stock error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// ADD ITEM TO STOCK
export const addItemToStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stockId } = req.params;
    const { product, price, quantity, expireAt } = req.body;

    if (!product || price === undefined || quantity === undefined) {
      res.status(400).json({ message: "Missing required fields: product, price, quantity" });
      return;
    }

    const stock = await Stock.findById(stockId);
    if (!stock) {
      res.status(404).json({ message: "Stock not found" });
      return;
    }

    const newStockItem : any = await StockItem.create({
      stock: stockId,
      product,
      price: Number(price),
      quantity: Number(quantity),
      expireAt: expireAt || undefined,
    });

    stock.items.push(newStockItem._id);
    await stock.save();

    const populatedItem = await StockItem.findById(newStockItem._id).populate("product");

    res.status(201).json({ 
      message: "Item added to stock successfully", 
      stockItem: populatedItem 
    });
  } catch (error: any) {
    console.error("Add item to stock error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// REMOVE ITEM FROM STOCK
export const removeItemFromStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stockId, itemId } = req.params;

    const stock = await Stock.findById(stockId);
    if (!stock) {
      res.status(404).json({ message: "Stock not found" });
      return;
    }

    const stockItem = await StockItem.findById(itemId);
    if (!stockItem) {
      res.status(404).json({ message: "Stock item not found" });
      return;
    }

    // Remove item reference from stock
    stock.items = stock.items.filter(item => item.toString() !== itemId);
    await stock.save();

    // Delete the stock item
    await StockItem.findByIdAndDelete(itemId);

    res.status(200).json({ message: "Item removed from stock successfully" });
  } catch (error: any) {
    console.error("Remove item from stock error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};
