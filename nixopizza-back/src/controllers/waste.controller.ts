import { Request, Response } from "express";
import Waste from "../models/waste.model";
import Product from "../models/product.model";
import Stock from "../models/stock.model";

// CREATE - Add a record when stock is discarded or expired
export const createWaste = async (req: Request, res: Response): Promise<void> => {
  try {
    const { product, quantity, reason, stock, staff } = req.body;

    // Validation
    if (!product) {
      res.status(400).json({ message: "Product is required" });
      return;
    }

    if (!quantity || quantity < 1) {
      res.status(400).json({ message: "Quantity must be at least 1" });
      return;
    }

    if (!reason || !reason.trim()) {
      res.status(400).json({ message: "Reason is required" });
      return;
    }

    // Verify product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    // Verify stock exists if provided
    if (stock) {
      const stockExists = await Stock.findById(stock);
      if (!stockExists) {
        res.status(404).json({ message: "Stock not found" });
        return;
      }
    }

    const newWaste = await Waste.create({
      product,
      quantity,
      reason: reason.trim(),
      stock,
      staff,
    });

    const populatedWaste = await Waste.findById(newWaste._id)
      .populate("product", "name description")
      .populate("stock", "name location")
      .populate("staff", "name email");

    res.status(201).json({
      message: "Waste record created successfully",
      waste: populatedWaste,
    });
  } catch (error: any) {
    console.error("Waste create error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// READ - Get all waste records with pagination, filtering, and sorting
export const getAllWastes = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      product,
      productName,
      reason,
      stock,
      staff,
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

    // Filter by product ID
    if (product) {
      query.product = product;
    }

    // Filter by product name
    if (productName) {
      const products = await Product.find({
        name: { $regex: productName, $options: "i" },
      }).select("_id");

      const productIds = products.map((p) => p._id);

      if (productIds.length > 0) {
        query.product = { $in: productIds };
      } else {
        // No matching products found, return empty result
        res.status(200).json({
          wastes: [],
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

    // Filter by reason (case-insensitive partial match)
    if (reason) {
      query.reason = { $regex: reason, $options: "i" };
    }

    // Filter by stock location
    if (stock) {
      query.stock = stock;
    }

    // Filter by staff
    if (staff) {
      query.staff = staff;
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

    // Sorting
    let sortOption: any = {};
    switch (sortBy) {
      case "newest":
        sortOption = { createdAt: -1 };
        break;
      case "oldest":
        sortOption = { createdAt: 1 };
        break;
      case "product":
        sortOption = { product: 1, createdAt: -1 };
        break;
      case "reason":
        sortOption = { reason: 1, createdAt: -1 };
        break;
      case "quantity_desc":
        sortOption = { quantity: -1 };
        break;
      case "quantity_asc":
        sortOption = { quantity: 1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [wastes, totalItems] = await Promise.all([
      Waste.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit))
        .populate("product", "name description")
        .populate("stock", "name location")
        .populate("staff", "name email"),
      Waste.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalItems / Number(limit));

    res.status(200).json({
      wastes,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems,
        itemsPerPage: Number(limit),
      },
    });
  } catch (error: any) {
    console.error("Waste getAll error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// READ - Get single waste record by ID
export const getWasteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { wasteId } = req.params;

    const waste = await Waste.findById(wasteId)
      .populate("product", "name description")
      .populate("stock", "name location description")
      .populate("staff", "name email");

    if (!waste) {
      res.status(404).json({ message: "Waste record not found" });
      return;
    }

    res.status(200).json({ waste });
  } catch (error: any) {
    console.error("Waste getById error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// UPDATE - Edit reason or quantity if mistake found
export const updateWaste = async (req: Request, res: Response): Promise<void> => {
  try {
    const { wasteId } = req.params;
    const { quantity, reason, stock, staff } = req.body;

    const waste = await Waste.findById(wasteId);

    if (!waste) {
      res.status(404).json({ message: "Waste record not found" });
      return;
    }

    // Update quantity if provided
    if (quantity !== undefined) {
      if (quantity < 1) {
        res.status(400).json({ message: "Quantity must be at least 1" });
        return;
      }
      waste.quantity = quantity;
    }

    // Update reason if provided
    if (reason !== undefined) {
      if (!reason.trim()) {
        res.status(400).json({ message: "Reason cannot be empty" });
        return;
      }
      waste.reason = reason.trim();
    }

    // Update stock if provided
    if (stock !== undefined) {
      if (stock) {
        const stockExists = await Stock.findById(stock);
        if (!stockExists) {
          res.status(404).json({ message: "Stock not found" });
          return;
        }
      }
      waste.stock = stock;
    }

    // Update staff if provided
    if (staff !== undefined) {
      waste.staff = staff;
    }

    await waste.save();

    const updatedWaste = await Waste.findById(wasteId)
      .populate("product", "name description")
      .populate("stock", "name location")
      .populate("staff", "name email");

    res.status(200).json({
      message: "Waste record updated successfully",
      waste: updatedWaste,
    });
  } catch (error: any) {
    console.error("Waste update error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// DELETE - Delete a waste record
export const deleteWaste = async (req: Request, res: Response): Promise<void> => {
  try {
    const { wasteId } = req.params;

    const waste = await Waste.findById(wasteId);

    if (!waste) {
      res.status(404).json({ message: "Waste record not found" });
      return;
    }

    await Waste.findByIdAndDelete(wasteId);

    res.status(200).json({ message: "Waste record deleted successfully" });
  } catch (error: any) {
    console.error("Waste delete error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// Get waste statistics by product
export const getWasteStatsByProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo } = req.query;

    const matchQuery: any = {};

    // Filter by date range if provided
    if (dateFrom || dateTo) {
      matchQuery.createdAt = {};
      if (dateFrom) {
        matchQuery.createdAt.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        matchQuery.createdAt.$lte = new Date(dateTo as string);
      }
    }

    const stats = await Waste.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$product",
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 },
          reasons: { $push: "$reason" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $project: {
          product: {
            _id: "$productDetails._id",
            name: "$productDetails.name",
            description: "$productDetails.description",
          },
          totalQuantity: 1,
          count: 1,
          reasons: 1,
        },
      },
    ]);

    res.status(200).json({ stats });
  } catch (error: any) {
    console.error("Waste stats error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// Get waste statistics by reason
export const getWasteStatsByReason = async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo } = req.query;

    const matchQuery: any = {};

    // Filter by date range if provided
    if (dateFrom || dateTo) {
      matchQuery.createdAt = {};
      if (dateFrom) {
        matchQuery.createdAt.$gte = new Date(dateFrom as string);
      }
      if (dateTo) {
        matchQuery.createdAt.$lte = new Date(dateTo as string);
      }
    }

    const stats = await Waste.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$reason",
          totalQuantity: { $sum: "$quantity" },
          count: { $sum: 1 },
          products: { $addToSet: "$product" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      {
        $project: {
          reason: "$_id",
          totalQuantity: 1,
          count: 1,
          productCount: { $size: "$products" },
        },
      },
    ]);

    res.status(200).json({ stats });
  } catch (error: any) {
    console.error("Waste stats by reason error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};
