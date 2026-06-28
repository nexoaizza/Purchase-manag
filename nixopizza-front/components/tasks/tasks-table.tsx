// components/tasks/tasks-table.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  Plus,
  Clock,
  Pause,
  Play,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pagination } from "@/components/ui/pagination";
import { ITask } from "@/app/[locale]/dashboard/tasks/page";
import { updateTaskStatus, deleteTask } from "@/lib/apis/task";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";

import { TaskDetailDialog } from "./task-detail-dialog";

interface TasksTableProps {
  tasks: ITask[];
  setTasks: any;
  totalPages: number;
  currentPage: number;
  setCurrentPage: any;
  limit: number;
  setLimit: any;
  onUpdateTask: (task: ITask) => void;
  onAssignTask: () => void;
  targetItemId?: string;
}

export function TasksTable({
  tasks,
  setTasks,
  totalPages,
  currentPage,
  setCurrentPage,
  limit,
  setLimit,
  onUpdateTask,
  onAssignTask,
  targetItemId,
}: TasksTableProps) {
  const t = useTranslations("tasks");
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<ITask | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | undefined>(targetItemId);
  const [completeDialog, setCompleteDialog] = useState<{isOpen: boolean, taskId: string, description: string}>({
    isOpen: false, taskId: "", description: ""
  });
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());
  const scrolledRef = useRef(false);

  useEffect(() => {
    if (!targetItemId || scrolledRef.current || tasks.length === 0) return;
    const el = rowRefs.current.get(targetItemId);
    if (!el) return;
    scrolledRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(targetItemId);
    const timer = setTimeout(() => setHighlightedId(undefined), 2000);
    return () => clearTimeout(timer);
  }, [targetItemId, tasks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "completed":
        return "default";
      case "canceled":
        return "destructive";
      case "paused":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return t("pending");
      case "completed":
        return t("completed");
      case "canceled":
        return t("canceled");
      case "paused":
        return "Paused";
      default:
        return status;
    }
  };

  const handleViewTask = (task: ITask) => {
    setSelectedTask(task);
    setIsViewDialogOpen(true);
  };

  const handleMarkAsCompleted = (taskId: string) => {
    setCompleteDialog({ isOpen: true, taskId, description: "" });
  };

  const submitCompletion = async () => {
    try {
      const { success, task, message } = await updateTaskStatus(
        completeDialog.taskId, 
        "completed", 
        completeDialog.description
      );
      if (success) {
        toast.success(t("taskCompleted") || "Task completed successfully");
        onUpdateTask(task);
        setCompleteDialog({ isOpen: false, taskId: "", description: "" });
      } else {
        toast.error(message || "Failed to complete task");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handlePauseResume = async (taskId: string, newStatus: string) => {
    try {
      const { success, task, message } = await updateTaskStatus(taskId, newStatus);
      if (success) {
        toast.success(`Task ${newStatus === "paused" ? "paused" : "resumed"} successfully`);
        onUpdateTask(task);
      } else {
        toast.error(message || "Failed to update task status");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleCancelTask = async (taskId: string) => {
    if (!confirm(t("confirmCancel") || "Are you sure you want to cancel this task?")) return;
    try {
      const { success, task, message } = await updateTaskStatus(taskId, "canceled");
      if (success) {
        toast.success(t("taskCanceled") || "Task canceled successfully");
        onUpdateTask(task);
      } else {
        toast.error(message || "Failed to cancel task");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm(t("confirmDeleteTask") || "Are you sure you want to delete this task?")) return;
    try {
      const { success, message } = await deleteTask(taskId);
      if (success) {
        toast.success(t("taskDeleted") || "Task deleted successfully");
        // Remove from local state
        setTasks((prev: ITask[]) => prev.filter((t) => t._id !== taskId));
      } else {
        toast.error(message || "Failed to delete task");
      }
    } catch (error) {
      toast.error("An error occurred");
    }
  };

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{t("taskDirectory")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-muted rounded-full">
            <Calendar className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-1">{t("noTasksFound")}</h3>
          <p className="text-muted-foreground mb-4">
            {t("noTasksYet")}
          </p>
          <Button onClick={onAssignTask}>
            <Plus className="h-4 w-4 mr-2" />
            {t("assignTask")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">{t("taskDirectory")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("taskId")}</TableHead>
                  <TableHead>{t("assignedToHeader")}</TableHead>
                  <TableHead>{t("description")}</TableHead>
                  <TableHead>{t("deadlineHeader")}</TableHead>
                  <TableHead>{t("statusHeader")}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow
                    key={task._id}
                    ref={(el) => {
                      if (el) rowRefs.current.set(task._id, el);
                      else rowRefs.current.delete(task._id);
                    }}
                    className={cn(
                      "transition-colors duration-500",
                      highlightedId === task._id && "bg-yellow-50 dark:bg-yellow-950/30"
                    )}
                  >
                    <TableCell>
                      <div className="font-mono font-medium">
                        {task.taskNumber}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            task.staffId?.avatar
                              ? process.env.NEXT_PUBLIC_BASE_URL + task.staffId.avatar
                              : "/default-avatar.png" // Fallback avatar or handle null gracefully
                          }
                          alt={task.staffId?.fullname || "Unknown Staff"}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium">
                            {task.staffId?.fullname || "Unknown Staff"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {task.staffId?.email || "No email"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-muted-foreground">
                        {task.description || (
                          <span className="italic text-muted-foreground/60">
                            {t("noDescription") || "No description"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {task.deadline ? (
                              new Date(task.deadline).toLocaleDateString("en-GB")
                            ) : (
                              <span className="text-muted-foreground/60 italic text-sm">
                                {t("noDeadline") || "No deadline"}
                              </span>
                            )}
                          </span>
                        </div>
                        {task.type === "periodic" && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 bg-blue-50 w-fit px-2 py-0.5 rounded-full">
                            <Clock className="h-3 w-3" />
                            <span>Periodic {task.startTime ? `at ${task.startTime}` : ""}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(task.status) as any}>
                        {getStatusLabel(task.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end items-center gap-2">
                        {(task.status === "pending" || (task.type === "periodic" && task.status === "completed")) && (user?.role === "admin" || user?._id === task.staffId?._id) && task.status !== "paused" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            title={t("markAsCompleted")}
                            onClick={() => handleMarkAsCompleted(task._id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewTask(task)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t("viewDetails")}
                          </DropdownMenuItem>

                          {task.type === "periodic" && user?.role === "admin" && (
                            <>
                              {task.status === "paused" ? (
                                <DropdownMenuItem onClick={() => handlePauseResume(task._id, "pending")}>
                                  <Play className="h-4 w-4 mr-2" />
                                  Resume Task
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handlePauseResume(task._id, "paused")}>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause Task
                                </DropdownMenuItem>
                              )}
                            </>
                          )}

                          {(task.status === "pending" || (task.type === "periodic" && task.status === "completed")) && (
                            <>
                              {(user?.role === "admin" || user?._id === task.staffId?._id) && task.status !== "paused" && (
                                <DropdownMenuItem
                                  onClick={() => handleMarkAsCompleted(task._id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  {t("markAsCompleted")}
                                </DropdownMenuItem>
                              )}
                              {user?.role === "admin" && (
                                <DropdownMenuItem
                                  onClick={() => handleCancelTask(task._id)}
                                  className="text-destructive"
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {t("cancelTask")}
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          {user?.role === "admin" && (
                            <DropdownMenuItem
                              onClick={() => handleDeleteTask(task._id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("deleteTask")}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              {t("showing")} {tasks.length} {t("of")} {totalPages * limit} {t("tasks")}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              limit={limit}
              onLimitChange={setLimit}
            />
          </div>
        </CardContent>
      </Card>

      <TaskDetailDialog
        task={selectedTask}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      <Dialog 
        open={completeDialog.isOpen} 
        onOpenChange={(open) => setCompleteDialog(prev => ({...prev, isOpen: open}))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Completion Notes (Optional)</Label>
              <Textarea 
                placeholder="Add any notes about the task completion..."
                value={completeDialog.description} 
                onChange={(e) => setCompleteDialog(prev => ({...prev, description: e.target.value}))} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteDialog(prev => ({...prev, isOpen: false}))}>
              Cancel
            </Button>
            <Button onClick={submitCompletion}>
              Complete Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
