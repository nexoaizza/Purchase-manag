import { Request, Response } from "express";
/** GET /api/admin/staffs */
export declare const getAllStaff: (req: Request, res: Response) => Promise<void>;
/** POST /api/admin/staffs */
export declare const newStaffMember: (req: Request, res: Response) => Promise<void>;
/** PUT /api/admin/staffs/:staffId */
export declare const updateStaff: (req: Request, res: Response) => Promise<void>;
/** DELETE /api/admin/staffs/:staffId */
export declare const deleteStaff: (req: Request, res: Response) => Promise<void>;
export declare const getCategoryAnalytics: (req: Request, res: Response) => Promise<void>;
export declare const getMonthlySpendingAnalytics: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=admin.controller.d.ts.map