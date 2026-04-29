import { Request, Response } from "express";
import { Types } from "mongoose";
import Product from "../models/product.model";
import { deleteImage } from "../utils/Delete";
import crypto from "crypto";
import { uploadBufferToBlob } from "../utils/blob";

// CREATE
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      barcode,
      unit,
      categoryId,
      description,
      minQty,
      recommendedQty,
      expectedLifeTime,
    } = req.body;

    if (!name || !unit || !categoryId || minQty === undefined) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    if ((req as any).fileValidationError) {
      res.status(400).json({ message: (req as any).fileValidationError });
      return;
    }

    let imageUrl: string | undefined;
    if (req.file) {
      const ext = (req.file.originalname.match(/\.[^/.]+$/) || [".bin"])[0];
      const unique = crypto.randomBytes(8).toString("hex");
      const key = `${Date.now()}-${unique}${ext}`;
      const uploaded = await uploadBufferToBlob(key, req.file.buffer, req.file.mimetype);
      imageUrl = uploaded.url;
    }

    try {
      const newProduct = await Product.create({
        name,
        barcode,
        unit,
        categoryId,
        description,
        minQty: Number(minQty),
        imageUrl,
        recommendedQty: recommendedQty ? Number(recommendedQty) : 0,
        expectedLifeTime: expectedLifeTime ? Number(expectedLifeTime) : undefined,
      });

      res.status(201).json({ message: "Product created successfully", product: newProduct });
    } catch (err: any) {
      if (err.code === 11000 && err.keyPattern?.name) {
        res.status(409).json({ message: "Product name must be unique" });
        return;
      }
      throw err;
    }
  } catch (error: any) {
    console.error("Product create error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// UPDATE
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      barcode,
      unit,
      categoryId,
      description,
      minQty,
      recommendedQty,
      expectedLifeTime,
    } = req.body;

    const product = await Product.findById(req.params.productId);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if ((req as any).fileValidationError) {
      res.status(400).json({ message: (req as any).fileValidationError });
      return;
    }

    if (name) product.name = name;
    if (barcode) product.barcode = barcode;
    if (unit) product.unit = unit;
    if (categoryId) product.categoryId = categoryId;
    if (description !== undefined) product.description = description;
    if (minQty !== undefined) product.minQty = Number(minQty);
    if (recommendedQty !== undefined) product.recommendedQty = Number(recommendedQty);
    if (expectedLifeTime !== undefined) product.expectedLifeTime = expectedLifeTime ? Number(expectedLifeTime) : undefined;

    if (req.file) {
      if (product.imageUrl && product.imageUrl.startsWith("/uploads/")) {
        try {
          deleteImage(product.imageUrl);
        } catch (e) {
          console.warn("Failed to delete legacy product image:", e);
        }
      }
      const ext = (req.file.originalname.match(/\.[^/.]+$/) || [".bin"])[0];
      const unique = crypto.randomBytes(8).toString("hex");
      const key = `${Date.now()}-${unique}${ext}`;
      const uploaded = await uploadBufferToBlob(key, req.file.buffer, req.file.mimetype);
      product.imageUrl = uploaded.url;
    } else if (req.body.removeImage === "true") {
      if (product.imageUrl && product.imageUrl.startsWith("/uploads/")) {
        try {
          deleteImage(product.imageUrl);
        } catch (e) {
          console.warn("Failed to delete legacy product image:", e);
        }
      }
      product.imageUrl = undefined;
    }

    try {
      await product.save();
    } catch (err: any) {
      if (err.code === 11000 && err.keyPattern?.name) {
        res.status(409).json({ message: "Product name must be unique" });
        return;
      }
      throw err;
    }

    res.status(200).json({ message: "Product updated successfully", product });
  } catch (error: any) {
    console.error("Product update error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// GET ALL
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, categoryId, sortBy, order, page = 1, limit = 10, status } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      res.status(400).json({ message: "Page and limit must be greater than 0" });
      return;
    }

    const query: any = {};
    if (name) {
      query.$or = [
        { name: { $regex: name, $options: "i" } },
        { description: { $regex: name, $options: "i" } },
        { barcode: { $regex: name, $options: "i" } },
      ];
    }
    if (categoryId) {
      if (!Types.ObjectId.isValid(categoryId as string)) {
        res.status(400).json({ message: "Invalid category id" });
        return;
      }
      query.categoryId = new Types.ObjectId(categoryId as string);
    }

    const sortField = sortBy?.toString() || "name";
    const sortOrder = order === "desc" ? -1 : 1;
    const skip = (Number(page) - 1) * Number(limit);

    const basePipeline: any[] = [
      { $match: query },
      {
        $lookup: {
          from: "stockitems",
          localField: "_id",
          foreignField: "product",
          as: "stockItems",
        },
      },
      {
        $addFields: {
          totalQuantity: { $sum: "$stockItems.quantity" },
        },
      },
      {
        $lookup: {
          from: "stocks",
          localField: "stockItems.stock",
          foreignField: "_id",
          as: "stocks",
        },
      },
      {
        $addFields: {
          storedIn: {
            $setUnion: [
              {
                $map: {
                  input: "$stocks",
                  as: "stock",
                  in: {
                    $cond: [
                      {
                        $and: [
                          { $ne: ["$$stock.location", null] },
                          { $ne: ["$$stock.location", ""] },
                        ],
                      },
                      { $concat: ["$$stock.name", " (", "$$stock.location", ")"] },
                      "$$stock.name",
                    ],
                  },
                },
              },
              [],
            ],
          },
          inventoryStatus: {
            $cond: [
              { $lte: ["$totalQuantity", { $ifNull: ["$minQty", 0] }] },
              "Rupture",
              {
                $cond: [
                  {
                    $and: [
                      { $gt: ["$totalQuantity", { $ifNull: ["$minQty", 0] }] },
                      {
                        $lt: [
                          "$totalQuantity",
                          { $ifNull: ["$recommendedQty", { $ifNull: ["$minQty", 0] }] },
                        ],
                      },
                    ],
                  },
                  "Shortage",
                  "Available",
                ],
              },
            ],
          },
        },
      },
    ];

    if (name) {
      basePipeline.push({
        $addFields: {
          startsWithSearch: {
            $cond: {
              if: { $eq: [{ $indexOfCP: [{ $toLower: "$name" }, (name as string).toLowerCase()] }, 0] },
              then: 1,
              else: 0
            }
          }
        }
      });
    }

    if (status && ["Rupture", "Shortage", "Available"].includes(status.toString())) {
      basePipeline.push({ $match: { inventoryStatus: status.toString() } });
    }

    let sortStage: any = {};
    if (name) {
      sortStage.startsWithSearch = -1;
    }
    sortStage[sortField] = sortOrder;
    if (sortField !== "barcode") {
      sortStage["barcode"] = 1;
    }

    const pipeline = [...basePipeline];
    pipeline.push(
      { $sort: sortStage },
      { $skip: skip },
      { $limit: Number(limit) }
    );

    const products = await Product.aggregate(pipeline);
    await Product.populate(products, { path: "categoryId" });

    const totalCountPipeline = [...basePipeline, { $count: "total" }];
    const totalCountResult = await Product.aggregate(totalCountPipeline);
    const total = totalCountResult[0]?.total || 0;

    res.status(200).json({
      total,
      pages: Math.ceil(total / Number(limit)),
      products,
    });
  } catch (error: any) {
    console.error("Get products error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// GET SINGLE
export const getProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.productId).populate("categoryId");
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    res.status(200).json({ product });
  } catch (error: any) {
    console.error("Get product error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};

// DELETE
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.productId);
    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }
    if (product.imageUrl && product.imageUrl.startsWith("/uploads/")) {
      try {
        deleteImage(product.imageUrl);
      } catch (e) {
        console.warn("Failed to delete legacy product image:", e);
      }
    }
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Internal server error", err: error.message });
  }
};
