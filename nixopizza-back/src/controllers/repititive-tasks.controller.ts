import { Request, Response } from "express";
import Task from "../models/repetitive-tasks";

export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
  try {
    const tasks = await Task.find().sort({ selectedAt: -1 });
    res.status(200).json({ success: true, tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const createTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { description } = req.body;
    if (!description) {
      res.status(400).json({ success: false, message: "Description is required" });
      return;
    }
    const newTask = new Task({ description });
    await newTask.save();
    res.status(201).json({ success: true, message: "Task created successfully", task: newTask });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { description, selectedAt } = req.body;
    
    if (!description && !selectedAt) {
      res.status(400).json({ success: false, message: "Description or selectedAt is required" });
      return;
    }

    const updateData: any = {};
    if (description) updateData.description = description;
    if (selectedAt) updateData.selectedAt = selectedAt;

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedTask) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Task updated successfully", task: updatedTask });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }

    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};