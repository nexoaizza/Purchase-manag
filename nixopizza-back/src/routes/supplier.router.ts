import { Router } from "express";
import { authenticate, requireAdmin } from "../middlewares/Auth";
import {
  createSupplier,
  getSupplierById,
  getSuppliers,
  updateSupplier,
  addProductToSupplierController,
  removeProductFromSupplierController,
  getSupplierProducts,
  setSupplierProductsController,
} from "../controllers/suplier.controller";
import { upload } from "../middlewares/Multer";

const supplierRouter = Router();


supplierRouter.post("/", requireAdmin, upload().single("image"), createSupplier);
supplierRouter.get("/", getSuppliers);
supplierRouter.get("/:supplierId", getSupplierById);
supplierRouter.put("/:supplierId", requireAdmin, upload().single("image"), updateSupplier);

// Product assignment routes
supplierRouter.post("/:supplierId/products", requireAdmin, addProductToSupplierController);
supplierRouter.delete("/:supplierId/products/:productId", requireAdmin, removeProductFromSupplierController);
supplierRouter.get("/:supplierId/products", getSupplierProducts);
supplierRouter.put("/:supplierId/products", requireAdmin, setSupplierProductsController);

export default supplierRouter;
