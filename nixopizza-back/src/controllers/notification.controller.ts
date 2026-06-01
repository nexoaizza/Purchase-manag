import { Request, Response } from "express";
import Notification, { NotificationCategoryEnum, NotificationTypeEnum } from "../models/notification.model";


export const createNotification = async (req: Request, res: Response) => {
  try {
    const { message, type, title } = req.body;
    if (!message || !type || !title) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }
    const notification = new Notification({ message, type, title });
    await notification.save();
    res.status(201).json({ message: "Notification created successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const createLocalNotification = async (message: string, type: NotificationTypeEnum, title: string, category: NotificationCategoryEnum) => {
  try {
    const notification = new Notification({ message, type, title, category });
    await notification.save();
  } catch (error: any) {
    console.error("Error creating notification:", error);
  }
};
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, category } = req.query;

    if (Number(page) < 1 || Number(limit) < 1) {
      res
        .status(400)
        .json({ message: "Page and limit must be greater than 0" });
      return;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const filter: any = {};
    if (category && category !== "all") {
      filter.category = category;
    }

    const notifications = await Notification.find(filter)
      .sort({ ["createdAt"]: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      total,
      pages: Math.ceil(total / Number(limit)),
      notifications
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};
export const getUnreadNotificationsCount = async (req: Request, res: Response) => {
  try {
    const totalUnread = await Notification.countDocuments({ isRead: false });
    res.status(200).json({ count: totalUnread });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const readNotification = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ message: "Notification marked as read" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};

export const readAllNotifications = async (req: Request, res: Response) => {
  try {
    await Notification.updateMany({ isRead: false }, { isRead: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: "Internal server error", err: error.message });
  }
};
