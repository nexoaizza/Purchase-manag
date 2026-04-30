import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/Token";
import Transfer from "../models/transfer.model";

const ACCESS_SECRET = process.env.ACCESS_SECRET || "default_secret_key";
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "Unauthorized: No token provided" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = verifyToken(token, ACCESS_SECRET) as {
      userId: string;
      isAdmin: boolean;
    };
    req.user = decoded;
    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || !req.user.isAdmin) {
    res.status(403).json({ message: "Admins only." });
    return;
  }
  next();
};

export const canUpdateTransfer = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Admins can update any transfer
  if (req.user?.isAdmin) {
    next();
    return;
  }

  const { transferId } = req.params;
  const transfer = await Transfer.findById(transferId);

  if (!transfer) {
    res.status(404).json({ message: "Transfer not found" });
    return;
  }

  const userId = req.user?.userId;
  const isAssignee = transfer.assignedTo.toString() === userId;

  if (!isAssignee) {
    res.status(403).json({ message: "Forbidden: you are not the assignee of this transfer." });
    return;
  }

  // Staff assignee can only change status — no other fields allowed
  const allowedKeys = new Set(["status"]);
  const bodyKeys = Object.keys(req.body);
  if (bodyKeys.some((key) => !allowedKeys.has(key))) {
    res.status(403).json({ message: "Staff can only update status." });
    return;
  }

  if (req.body.status !== "arrived" || transfer.status !== "pending") {
    res.status(403).json({ message: "Staff can only change status from pending to arrived." });
    return;
  }

  next();
};
