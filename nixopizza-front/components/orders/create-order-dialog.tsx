"use client";

import { useState, useEffect } from "react";
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
import { createOrder } from "@/lib/apis/order";
import { ClipboardList, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { resolveImage } from "@/lib/resolveImage";
import { useTranslations } from "next-intl";

interface Staff {
  _id: string;
  fullname: string;
  email: string;
  avatar: string;
}

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated?: () => void;
}

export function CreateOrderDialog({
  open,
  onOpenChange,
  onOrderCreated,
}: CreateOrderDialogProps) {
  const t = useTranslations("orders");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!open) return;

      try {
        setIsFetchingData(true);

        const staffParams = { page: 1, limit: 1000 } as unknown as { name?: string };
        const staffResponse = await getStuff(staffParams);

        if (staffResponse.success && staffResponse.staffs) {
          setStaffList(staffResponse.staffs);
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

  const handleCreateOrder = async () => {
    if (!selectedStaffId) {
      toast.error(t("selectStaffError") || "Please select a staff member");
      return;
    }

    setIsLoading(true);
    try {
      const orderData = {
        staffId: selectedStaffId,
        description: description || undefined,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      };

      const { success, order, message } = await createOrder(orderData);

      if (success && order) {
        toast.success(t("orderCreated") || "Order created successfully");
        onOrderCreated?.();
        onOpenChange(false);

        setSelectedStaffId("");
        setDescription("");
        setDeadline("");

        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        toast.error(message || t("failedCreateOrder") || "Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(t("failedCreateOrder") || "Failed to create order");
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
            {t("createOrder") || "Create New Order"}
          </DialogTitle>
          <DialogDescription>
            {t("createOrderDescription") || "Assign an order to a staff member"}
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
                {t("staffMember") || "Staff Member"} <span className="text-destructive">*</span>
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
                          <div className="text-xs text-muted-foreground">
                            {staff.email}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                {t("description") || "Description"} <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder={t("orderDescriptionPlaceholder") || "Enter order description..."}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg min-h-[80px]"
              />
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-sm font-medium">
                {t("deadline") || "Deadline"} <span className="text-muted-foreground text-xs">(Optional)</span>
              </Label>
              <Input
                id="deadline"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg"
                min={new Date().toISOString().slice(0, 16)}
              />
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
            onClick={handleCreateOrder}
            disabled={isLoading || isFetchingData || !selectedStaffId}
            className="rounded-full px-6"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("creating") || "Creating..."}
              </>
            ) : (
              t("createOrder") || "Create Order"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
