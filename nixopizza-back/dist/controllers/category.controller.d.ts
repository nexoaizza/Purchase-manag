import { Request, Response } from "express";
/**
 * GET /api/categories
 * Optional query: name (regex match)
 */
export declare const getCategoriesByFilter: (req: Request, res: Response) => Promise<void>;
/**
 * POST /api/categories
 * Fields: name (required), description (optional), image (optional)
 */
export declare const createCategory: (req: Request, res: Response) => Promise<void>;
/**
 * PUT /api/categories/:categoryId
 */
export declare const updateCategory: (req: Request, res: Response) => Promise<void>;
/**
 * DELETE /api/categories/:categoryId
 */
export declare const deleteCategory: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=category.controller.d.ts.map