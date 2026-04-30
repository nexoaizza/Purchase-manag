import { Types } from "mongoose";
import Supplier from "../models/supplier.model";
import Product from "../models/product.model";

/**
 * Automatically sync supplier's categoryIds based on the products they supply.
 * A supplier should have a category in their categoryIds if they supply at least one product from that category.
 * 
 * @param supplierId - The supplier ID to sync categories for
 */
export async function syncSupplierCategories(supplierId: string | Types.ObjectId): Promise<void> {
  try {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new Error("Supplier not found");
    }

    // Find all products that this supplier provides based on their productIds
    const products = await Product.find({
      _id: { $in: supplier.productIds }
    }).select("categoryId");

    // Extract unique category IDs from these products
    const uniqueCategoryIds = [...new Set(
      products.map(p => p.categoryId.toString())
    )];

    // Update supplier's categoryIds
    supplier.categoryIds = uniqueCategoryIds.map(id => new Types.ObjectId(id));
    await supplier.save();
  } catch (error) {
    console.error("Error syncing supplier categories:", error);
    throw error;
  }
}

/**
 * Add a product to a supplier and sync the supplier's categories.
 * 
 * @param supplierId - The supplier ID
 * @param productId - The product ID to add
 */
export async function addProductToSupplier(
  supplierId: string | Types.ObjectId,
  productId: string | Types.ObjectId
): Promise<void> {
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new Error("Supplier not found");
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Product not found");
  }

  // Add product to supplier if not already present
  const productIdStr = productId.toString();
  if (!supplier.productIds.some(id => id.toString() === productIdStr)) {
    supplier.productIds.push(new Types.ObjectId(productId));
    await supplier.save();
  }

  // Sync supplier categories based on all products they supply
  await syncSupplierCategories(supplierId);
}

/**
 * Remove a product from a supplier and sync the supplier's categories.
 * 
 * @param supplierId - The supplier ID
 * @param productId - The product ID to remove
 */
export async function removeProductFromSupplier(
  supplierId: string | Types.ObjectId,
  productId: string | Types.ObjectId
): Promise<void> {
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new Error("Supplier not found");
  }

  // Remove product from supplier
  const productIdStr = productId.toString();
  supplier.productIds = supplier.productIds.filter(
    id => id.toString() !== productIdStr
  );
  await supplier.save();

  // Sync supplier categories based on remaining products they supply
  await syncSupplierCategories(supplierId);
}
