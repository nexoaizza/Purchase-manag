"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Check, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslations } from "next-intl";
import {
  IRepetitiveTask,
  getRepetitiveTasks,
  createRepetitiveTask,
  updateRepetitiveTask,
  deleteRepetitiveTask,
} from "@/lib/apis/repetitive-tasks";

interface AddRepetitiveTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskSelected?: (task: IRepetitiveTask) => void;
}

export function AddRepetitiveTaskDialog({
  open,
  onOpenChange,
  onTaskSelected,
}: AddRepetitiveTaskDialogProps) {
  const t = useTranslations("tasks");

  const [tasks, setTasks] = useState<IRepetitiveTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [newTaskDescription, setNewTaskDescription] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (open) {
      fetchTasks();
    }
  }, [open]);

  const fetchTasks = async () => {
    setFetching(true);
    const result = await getRepetitiveTasks();
    if (result.success && result.tasks) {
      setTasks(result.tasks);
    } else {
      toast.error(result.message || "Failed to load tasks");
    }
    setFetching(false);
  };

  const handleCreate = async () => {
    if (!newTaskDescription.trim()) return;
    setLoading(true);
    const result = await createRepetitiveTask(newTaskDescription);
    if (result.success && result.task) {
      toast.success("Task created successfully");
      setTasks([result.task, ...tasks]);
      setNewTaskDescription("");
    } else {
      toast.error(result.message || "Failed to create task");
    }
    setLoading(false);
  };

  const startEditing = (task: IRepetitiveTask) => {
    setEditingTaskId(task._id);
    setEditDescription(task.description);
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditDescription("");
  };

  const saveEdit = async () => {
    if (!editingTaskId || !editDescription.trim()) return;
    setLoading(true);
    const result = await updateRepetitiveTask(editingTaskId, editDescription);
    if (result.success && result.task) {
      toast.success("Task updated successfully");
      setTasks((prev) =>
        prev.map((t) => (t._id === editingTaskId ? result.task! : t))
      );
      setEditingTaskId(null);
      setEditDescription("");
    } else {
      toast.error(result.message || "Failed to update task");
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    setLoading(true);
    const result = await deleteRepetitiveTask(id);
    if (result.success) {
      toast.success("Task deleted successfully");
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } else {
      toast.error(result.message || "Failed to delete task");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-heading">Repetitive Tasks</DialogTitle>
          <DialogDescription>
            Manage your template repetitive tasks here.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Add New Task Form */}
          <div className="flex gap-2 items-end bg-muted/30 p-4 rounded-xl border border-muted/50">
            <div className="space-y-2 flex-1">
              <Label>New Repetitive Task Description</Label>
              <Input
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                placeholder="E.g., Clean the coffee machine"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                disabled={loading}
              />
            </div>
            <Button
              className="gap-2 shrink-0"
              onClick={handleCreate}
              disabled={loading || !newTaskDescription.trim()}
            >
              {loading && newTaskDescription ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add
            </Button>
          </div>

          {/* Task List */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Existing Tasks</Label>
            {fetching ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-lg bg-muted/20 text-muted-foreground">
                No repetitive tasks found. Add one above.
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-card border rounded-lg hover:shadow-sm transition-all"
                  >
                    {editingTaskId === task._id ? (
                      // Editing mode
                      <div className="flex items-center gap-2 w-full">
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveEdit();
                            if (e.key === "Escape") cancelEditing();
                          }}
                          disabled={loading}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 shrink-0"
                          onClick={saveEdit}
                          disabled={loading || !editDescription.trim()}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="shrink-0"
                          onClick={cancelEditing}
                          disabled={loading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      // Display mode
                      <>
                        <div className="flex-1 min-w-0 w-full px-1">
                          <p className="text-sm font-medium text-foreground line-clamp-3">
                            {task.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {onTaskSelected && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                onTaskSelected(task);
                                onOpenChange(false);
                              }}
                            >
                              Use
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => startEditing(task)}
                            disabled={loading}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(task._id)}
                            disabled={loading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex justify-end border-t pt-4 mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
