import { Request, Response } from "express";
import Transfer from "../models/transfer.model";
import StockItem from "../models/stock-item.model";
import Stock from "../models/stock.model";
import Product from "../models/product.model";

// CREATE - Create a transfer request from one stock to another
export const createTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { items, takenFrom, takenTo, quantity, status } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: "Items array is required and must not be empty" });
      return;
    }

    if (!takenFrom || !takenTo) {
      res.status(400).json({ message: "Both source (takenFrom) and destination (takenTo) stocks are required" });
      return;
    }

    if (!quantity || quantity < 1) {
      res.status(400).json({ message: "Quantity must be at least 1" });
      return;
    }

    // Verify stocks exist
    const sourceStock = await Stock.findById(takenFrom);
    const destStock = await Stock.findById(takenTo);

    if (!sourceStock) {
      res.status(404).json({ message: "Source stock not found" });
      return;
    }

    if (!destStock) {
      res.status(404).json({ message: "Destination stock not found" });
      return;
    }

    if (takenFrom === takenTo) {
      res.status(400).json({ message: "Source and destination stocks cannot be the same" });
      return;
    }

    // Verify all items exist
    const stockItems = await StockItem.find({ _id: { $in: items } });
    if (stockItems.length !== items.length) {
      res.status(404).json({ message: "One or more stock items not found" });
      return;
    }

    const newTransfer = await Transfer.create({
      items,
      takenFrom,
      takenTo,
      quantity,
      status: status || "pending",
    });

    const populatedTransfer = await Transfer.findById(newTransfer._id)
      .populate("takenFrom", "name location")
      .populate("takenTo", "name location")
      .populate({
        path: "items",
        populate: {
          path: "product",
          select: "name",
        },
      });

    res.status(201).json({ 
      message: "Transfer created successfully", 
      transfer: populatedTransfer 
    });
  } catch (error: any) {
    console.error("Transfer create error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// READ - Get all transfers with pagination, filtering, and sorting
export const getAllTransfers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status,
      takenFrom,
      takenTo,
      productName,
      dateFrom,
      dateTo,
      sortBy = "newest",
      page = 1,
      limit = 10,
    } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      res.status(400).json({ message: "Page and limit must be greater than 0" });
      return;
    }

    const query: any = {};

    // Filter by status
    if (status && (status === "pending" || status === "arrived")) {
      query.status = status;
    }

    // Filter by source stock
    if (takenFrom) {
      query.takenFrom = takenFrom;
    }

    // Filter by destination stock
    if (takenTo) {
      query.takenTo = takenTo;
    }

    // Filter by date range
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) {
        query.createdAt.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        query.createdAt.$lte = new Date(dateTo as string);
      }
    }

    // Filter by product name inside items
    if (productName) {
      // Find products matching the name
      const products = await Product.find({
        name: { $regex: productName, $options: "i" },
      }).select("_id");

      const productIds = products.map((p) => p._id);

      // Find stock items with those products
      const stockItems = await StockItem.find({
        product: { $in: productIds },
      }).select("_id");

      const stockItemIds = stockItems.map((item) => item._id);

      // Add to query to filter transfers by those item IDs
      if (stockItemIds.length > 0) {
        query.items = { $in: stockItemIds };
      } else {
        // No matching products found, return empty result
        res.status(200).json({
          transfers: [],
          pagination: {
            currentPage: Number(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: Number(limit),
          },
        });
        return;
      }
    }

    // Sorting
    let sortOption: any = {};
    switch (sortBy) {
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "status":
        sortOption = { status: 1, createdAt: -1 };
        break;
      case "stock_asc":
        sortOption = { takenFrom: 1 };
        break;
      case "stock_desc":
        sortOption = { takenFrom: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transfers, totalItems] = await Promise.all([
      Transfer.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .populate("takenFrom", "name location")
        .populate("takenTo", "name location")
        .populate({
          path: "items",
          populate: {
            path: "product",
            select: "name",
          },
        }),
      Transfer.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalItems / Number(limit));

    res.status(200).json({
      transfers,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error: any) {
    console.error("Transfer getAll error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// READ - Get single transfer by ID
export const getTransferById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transferId } = req.params;

    const transfer = await Transfer.findById(transferId)
      .populate("takenFrom", "name location description")
      .populate("takenTo", "name location description")
      .populate({
        path: "items",
        populate: {
          path: "product",
          select: "name description",
        },
      });

    if (!transfer) {
      res.status(404).json({ message: "Transfer not found" });
      return;
    }

    res.status(200).json({ transfer });
  } catch (error: any) {
    console.error("Transfer getById error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// UPDATE - Update arrival status and quantity (before approval)
export const updateTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transferId } = req.params;
    const { status, quantity, items } = req.body;

    const transfer = await Transfer.findById(transferId);

    if (!transfer) {
      res.status(404).json({ message: "Transfer not found" });
      return;
    }

    // Update status if provided
    if (status !== undefined) {
      if (status !== "pending" && status !== "arrived") {
        res.status(400).json({ message: "Status must be either 'pending' or 'arrived'" });
        return;
      }
      transfer.status = status;
    }

    // Update quantity if provided (only if still pending)
    if (quantity !== undefined) {
      if (transfer.status === "arrived") {
        res.status(400).json({ message: "Cannot update quantity after transfer has arrived" });
        return;
      }
      if (quantity < 1) {
        res.status(400).json({ message: "Quantity must be at least 1" });
        return;
      }
      transfer.quantity = quantity;
    }

    // Update items if provided (only if still pending)
    if (items !== undefined) {
      if (transfer.status === "arrived") {
        res.status(400).json({ message: "Cannot update items after transfer has arrived" });
        return;
      }
      if (!Array.isArray(items) || items.length === 0) {
        res.status(400).json({ message: "Items must be a non-empty array" });
        return;
      }

      // Verify all items exist
      const stockItems = await StockItem.find({ _id: { $in: items } });
      if (stockItems.length !== items.length) {
        res.status(404).json({ message: "One or more stock items not found" });
        return;
      }

      transfer.items = items;
    }

    await transfer.save();

    const updatedTransfer = await Transfer.findById(transferId)
      .populate("takenFrom", "name location")
      .populate("takenTo", "name location")
      .populate({
        path: "items",
        populate: {
          path: "product",
          select: "name",
        },
      });

    res.status(200).json({ 
      message: "Transfer updated successfully", 
      transfer: updatedTransfer 
    });
  } catch (error: any) {
    console.error("Transfer update error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// DELETE - Delete a transfer
export const deleteTransfer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { transferId } = req.params;

    const transfer = await Transfer.findById(transferId);

    if (!transfer) {
      res.status(404).json({ message: "Transfer not found" });
      return;
    }

    // Optional: Prevent deletion of arrived transfers
    // if (transfer.status === "arrived") {
    //   res.status(400).json({ message: "Cannot delete a transfer that has already arrived" });
    //   return;
    // }

    await Transfer.findByIdAndDelete(transferId);

    res.status(200).json({ message: "Transfer deleted successfully" });
  } catch (error: any) {
    console.error("Transfer delete error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// Get transfers by stock (useful for stock-specific views)
export const getTransfersByStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { stockId } = req.params;
    const { type = "all", page = 1, limit = 10 } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      res.status(400).json({ message: "Page and limit must be greater than 0" });
      return;
    }

    // Verify stock exists
    const stock = await Stock.findById(stockId);
    if (!stock) {
      res.status(404).json({ message: "Stock not found" });
      return;
    }

    let query: any = {};

    // Filter by transfer type
    switch (type) {
      case "incoming":
        query.takenTo = stockId;
        break;
      case "outgoing":
        query.takenFrom = stockId;
        break;
      case "all":
      default:
        query.$or = [{ takenFrom: stockId }, { takenTo: stockId }];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [transfers, totalItems] = await Promise.all([
      Transfer.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("takenFrom", "name location")
        .populate("takenTo", "name location")
        .populate({
          path: "items",
          populate: {
            path: "product",
            select: "name",
          },
        }),
      Transfer.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalItems / Number(limit));

    res.status(200).json({
      transfers,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error: any) {
    console.error("Transfer getByStock error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};
