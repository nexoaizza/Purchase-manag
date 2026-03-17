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


supplierRouter.post("/", upload().single("image"), createSupplier);
supplierRouter.get("/", getSuppliers);
supplierRouter.get("/:supplierId", getSupplierById);
supplierRouter.put("/:supplierId", upload().single("image"), updateSupplier);

// Product assignment routes
supplierRouter.post("/:supplierId/products", addProductToSupplierController);
supplierRouter.delete("/:supplierId/products/:productId", removeProductFromSupplierController);
supplierRouter.get("/:supplierId/products", getSupplierProducts);
supplierRouter.put("/:supplierId/products", setSupplierProductsController);

export default supplierRouter;
