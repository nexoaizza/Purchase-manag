"use client";

import { useState, useEffect, useRef } from "react";
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

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function TimePicker({
  value,
  onChange,
}: {
  value: string; // "HH:mm" or ""
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [selH, setSelH] = useState<number | null>(null);
  const [selM, setSelM] = useState<number | null>(null);
  const [hRaw, setHRaw] = useState("");
  const [mRaw, setMRaw] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const hourColRef = useRef<HTMLDivElement>(null);
  const minColRef = useRef<HTMLDivElement>(null);

  // Sync from external value
  useEffect(() => {
    if (value && /^\d{2}:\d{2}$/.test(value)) {
      const [h, m] = value.split(":").map(Number);
      setSelH(h);
      setSelM(m);
      setHRaw(pad(h));
      setMRaw(pad(m));
    }
  }, [value]);

  // Scroll active item into center when popup opens
  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      scrollToItem(hourColRef.current, selH ?? 0);
      scrollToItem(minColRef.current, selM ?? 0);
    });
  }, [open]);

  function scrollToItem(col: HTMLDivElement | null, idx: number) {
    if (!col) return;
    const items = col.querySelectorAll<HTMLDivElement>("[data-idx]");
    const item = items[idx];
    if (item) {
      col.scrollTop = item.offsetTop - col.clientHeight / 2 + item.clientHeight / 2;
    }
  }

  function applyHour(h: number) {
    const clamped = Math.max(0, Math.min(23, h));
    setSelH(clamped);
    setHRaw(pad(clamped));
    const m = selM ?? 0;
    onChange(`${pad(clamped)}:${pad(m)}`);
    scrollToItem(hourColRef.current, clamped);
  }

  function applyMin(m: number) {
    const clamped = Math.max(0, Math.min(59, m));
    setSelM(clamped);
    setMRaw(pad(clamped));
    const h = selH ?? 0;
    onChange(`${pad(h)}:${pad(clamped)}`);
    scrollToItem(minColRef.current, clamped);
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const displayH = selH !== null ? pad(selH) : "--";
  const displayM = selM !== null ? pad(selM) : "--";

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger with inline text inputs */}
      <div
        className="flex items-center gap-1.5 w-32 h-10 px-3 border-2 border-input rounded-lg bg-background cursor-text"
        onClick={() => setOpen(true)}
      >
        <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="flex items-center gap-0.5">
          {/* Hour input */}
          <input
            type="number"
            min={0}
            max={23}
            placeholder="HH"
            value={hRaw}
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            onChange={(e) => {
              setHRaw(e.target.value);
              const v = parseInt(e.target.value);
              if (!isNaN(v)) {
                const clamped = Math.max(0, Math.min(23, v));
                setSelH(clamped);
                scrollToItem(hourColRef.current, clamped);
                onChange(`${pad(clamped)}:${pad(selM ?? 0)}`);
              }
            }}
            onBlur={() => {
              const v = parseInt(hRaw);
              applyHour(isNaN(v) ? 0 : v);
            }}
            className="w-7 bg-transparent border-none outline-none text-center text-sm text-foreground p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <span className="text-sm text-muted-foreground select-none">:</span>
          {/* Minute input */}
          <input
            type="number"
            min={0}
            max={59}
            placeholder="MM"
            value={mRaw}
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            onChange={(e) => {
              setMRaw(e.target.value);
              const v = parseInt(e.target.value);
              if (!isNaN(v)) {
                const clamped = Math.max(0, Math.min(59, v));
                setSelM(clamped);
                scrollToItem(minColRef.current, clamped);
                onChange(`${pad(selH ?? 0)}:${pad(clamped)}`);
              }
            }}
            onBlur={() => {
              const v = parseInt(mRaw);
              applyMin(isNaN(v) ? 0 : v);
            }}
            className="w-7 bg-transparent border-none outline-none text-center text-sm text-foreground p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Dropdown — shorter height (148px) */}
      {open && (
        <div className="absolute z-50 mt-1 left-0 bg-popover border border-border rounded-xl shadow-lg overflow-hidden w-36">
          {/* Column headers */}
          <div className="grid grid-cols-2 border-b border-border">
            <div className="text-center py-1 text-xs text-muted-foreground border-r border-border">
              HH
            </div>
            <div className="text-center py-1 text-xs text-muted-foreground">
              MM
            </div>
          </div>

          {/* Scrollable columns — 148px tall */}
          <div className="grid grid-cols-2 divide-x divide-border" style={{ height: 148 }}>
            {/* Hours 00–23 */}
            <div
              ref={hourColRef}
              className="overflow-y-auto"
              style={{ scrollBehavior: "smooth" }}
            >
              <div className="py-1">
                {Array.from({ length: 24 }, (_, h) => (
                  <div
                    key={h}
                    data-idx={h}
                    onMouseDown={(e) => {
                      e.preventDefault(); // keep focus on text input
                      applyHour(h);
                    }}
                    className={`mx-1 my-0.5 py-1 text-center text-xs rounded cursor-pointer select-none transition-colors ${
                      selH === h
                        ? "bg-foreground text-background font-medium"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {pad(h)}
                  </div>
                ))}
              </div>
            </div>

            {/* Minutes 00–59 */}
            <div
              ref={minColRef}
              className="overflow-y-auto"
              style={{ scrollBehavior: "smooth" }}
            >
              <div className="py-1">
                {Array.from({ length: 60 }, (_, m) => (
                  <div
                    key={m}
                    data-idx={m}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyMin(m);
                    }}
                    className={`mx-1 my-0.5 py-1 text-center text-xs rounded cursor-pointer select-none transition-colors ${
                      selM === m
                        ? "bg-foreground text-background font-medium"
                        : "hover:bg-muted text-foreground"
                    }`}
                  >
                    {pad(m)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-1.5 border-t border-border">
            <span className="text-xs font-medium text-foreground">
              {displayH}:{displayM}
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setOpen(false)}
              className="text-xs bg-foreground text-background rounded px-3 py-1 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
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
      <DialogContent className="sm:max-w-[500px]">
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

            {/* Deadline */}
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
                <TimePicker value={deadlineTime} onChange={setDeadlineTime} />
              </div>
            </div>
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