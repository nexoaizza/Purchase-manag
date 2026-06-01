"use client";

import { useState, useEffect } from "react";
import { CustomTimePicker } from "@/components/ui/custom-time-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStuff } from "@/lib/apis/stuff";
import { createTask } from "@/lib/apis/task";
import {
  getRepetitiveTasks,
  IRepetitiveTask,
  selectRepetitiveTask,
} from "@/lib/apis/repetitive-tasks";
import { ClipboardList, Clock, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { resolveImage } from "@/lib/resolveImage";
import { useTranslations } from "next-intl";

interface Staff {
  _id: string;
  fullname: string;
  email: string;
  avatar: string;
}

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated?: () => void;
}


export function CreateTaskDialog({
  open,
  onOpenChange,
  onTaskCreated,
}: CreateTaskDialogProps) {
  const t = useTranslations("tasks");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [deadlineDate, setDeadlineDate] = useState<string>("");
  const [deadlineTime, setDeadlineTime] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [repetitiveTasks, setRepetitiveTasks] = useState<IRepetitiveTask[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [type, setType] = useState<"normal" | "periodic">("normal");
  const [periodicDays, setPeriodicDays] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("");

  const deadlineISO = deadlineDate
    ? `${deadlineDate}T${deadlineTime || "00:00"}`
    : "";

  useEffect(() => {
    const fetchData = async () => {
      if (!open) return;
      try {
        setIsFetchingData(true);
        const staffParams = { page: 1, limit: 1000 } as unknown as { name?: string };
        const [staffResponse, repetitiveTasksResponse] = await Promise.all([
          getStuff(staffParams),
          getRepetitiveTasks(),
        ]);
        if (staffResponse.success && staffResponse.staffs) {
          setStaffList(staffResponse.staffs);
        }
        if (repetitiveTasksResponse.success && repetitiveTasksResponse.tasks) {
          setRepetitiveTasks(repetitiveTasksResponse.tasks);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error(t("unexpectedError") || "Failed to load data");
      } finally {
        setIsFetchingData(false);
      }
    };
    fetchData();
  }, [open]);

  const handleCreateTask = async () => {
    if (!selectedStaffId) {
      toast.error(t("selectStaffError") || "Please select a staff member");
      return;
    }
    setIsLoading(true);
    try {
      const taskData = {
        staffId: selectedStaffId,
        description: description || undefined,
        deadline: deadlineISO ? new Date(deadlineISO).toISOString() : undefined,
        type,
        periodicDays,
        startTime: type === "periodic" ? startTime : undefined,
      };
      const { success, task, message } = await createTask(taskData);
      if (success && task) {
        toast.success(t("taskCreated") || "Task created successfully");
        onTaskCreated?.();
        onOpenChange(false);
        setSelectedStaffId("");
        setDescription("");
        setDeadlineDate("");
        setDeadlineTime("");
        setType("normal");
        setPeriodicDays([]);
        setStartTime("");
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast.error(message || t("failedCreateTask") || "Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error(t("failedCreateTask") || "Failed to create task");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            {t("createTask") || "Create New Task"}
          </DialogTitle>
          <DialogDescription>
            {t("createTaskDescription") || "Assign a task to a staff member"}
          </DialogDescription>
        </DialogHeader>

        {isFetchingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Staff Selection */}
            <div className="space-y-2">
              <Label htmlFor="staff" className="text-sm font-medium">
                {t("staffMember") || "Staff Member"}{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg">
                  <SelectValue placeholder={t("selectStaffMember") || "Select staff member"} />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff._id} value={staff._id}>
                      <div className="flex items-center gap-2">
                        <img
                          src={resolveImage(staff.avatar)}
                          alt={staff.fullname}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-medium">{staff.fullname}</div>
                          <div className="text-xs text-muted-foreground">{staff.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2 relative">
              <Label htmlFor="description" className="text-sm font-medium">
                {t("description") || "Description"}{" "}
                <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <div className="relative">
                <Textarea
                  id="description"
                  placeholder={t("taskDescriptionPlaceholder") || "Enter task description..."}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setShowDropdown(false)}
                  className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg min-h-[80px]"
                />
                {showDropdown && repetitiveTasks.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-[250px] overflow-y-auto top-[100%] left-0">
                    {repetitiveTasks.map((task) => (
                      <div
                        key={task._id}
                        className="px-3 py-2 text-sm cursor-pointer hover:bg-muted text-popover-foreground border-b last:border-0"
                        onMouseDown={async (e) => {
                          e.preventDefault();
                          setDescription(task.description);
                          setShowDropdown(false);
                          try {
                            await selectRepetitiveTask(task._id);
                          } catch (error) {
                            console.error("Failed to update task selection time", error);
                          }
                        }}
                      >
                        {task.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Type Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Task Type</Label>
              <div className="flex gap-4">
                <Button 
                  variant={type === "normal" ? "default" : "outline"} 
                  onClick={() => setType("normal")}
                  className="flex-1"
                >
                  One-time Task
                </Button>
                <Button 
                  variant={type === "periodic" ? "default" : "outline"} 
                  onClick={() => setType("periodic")}
                  className="flex-1"
                >
                  Periodic Task
                </Button>
              </div>
            </div>

            {type === "periodic" && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Days of the week <span className="text-destructive">*</span></Label>
                  <div className="flex gap-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
                      <Button
                        key={index}
                        variant={periodicDays.includes(index) ? "default" : "outline"}
                        onClick={() => {
                          setPeriodicDays((prev) => 
                            prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
                          );
                        }}
                        className="flex-1 px-0 text-xs"
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Start Time <span className="text-destructive">*</span></Label>
                  <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                </div>
              </>
            )}

            {/* Deadline */}
            {type === "normal" && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("deadline") || "Deadline"}{" "}
                  <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="deadline-date"
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg flex-1"
                    min={new Date().toISOString().slice(0, 10)}
                  />
                  <CustomTimePicker value={deadlineTime} onChange={setDeadlineTime} />
                </div>
              </div>
            )}
          </div>

        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="rounded-full px-6"
          >
            {t("cancel") || "Cancel"}
          </Button>
          <Button
            type="button"
            onClick={handleCreateTask}
            disabled={isLoading || isFetchingData || !selectedStaffId}
            className="rounded-full px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("creating") || "Creating..."}
              </>
            ) : (
              t("createTask") || "Create Task"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}