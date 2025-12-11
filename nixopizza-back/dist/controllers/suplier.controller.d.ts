import { Request, Response } from "express";
/**
 * GET /api/suppliers
 */
export declare const getSuppliers: (_req: Request, res: Response) => Promise<void>;
/**
 * GET /api/suppliers/:supplierId
 */
export declare const getSupplierById: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/suppliers
 * Email optional, duplicates allowed.
 */
export declare const createSupplier: (req: Request, res: Response) => Promise<void>;
/**
 * PUT /api/suppliers/:supplierId
 * Removing email (blank) sets it to undefined.
 */
export declare const updateSupplier: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=suplier.controller.d.ts.map