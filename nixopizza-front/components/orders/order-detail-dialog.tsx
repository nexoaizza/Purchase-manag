"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, ClipboardList, User, Info, CheckCircle, XCircle, Clock } from "lucide-react";
import { IStaffOrder } from "@/app/[locale]/dashboard/orders/page";
import { useTranslations } from "next-intl";
import { resolveImage } from "@/lib/resolveImage";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OrderDetailDialogProps {
  order: IStaffOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailDialog({
  order,
  open,
  onOpenChange,
}: OrderDetailDialogProps) {
  const t = useTranslations("orders");

  if (!order) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "canceled":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "completed":
        return "default";
      case "canceled":
        return "destructive";
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
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] gap-0 p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b border-primary/10">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Badge variant={getStatusColor(order.status) as any} className="mb-2 px-3 py-1 rounded-full flex items-center gap-1.5 border-none shadow-sm">
                {getStatusIcon(order.status)}
                <span className="font-bold tracking-tight uppercase text-[10px]">{getStatusLabel(order.status)}</span>
              </Badge>
              <div className="text-xs font-mono text-muted-foreground bg-background/50 px-2 py-1 rounded-md">
                {order.orderNumber}
              </div>
            </div>
            <DialogTitle className="text-2xl font-heading font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <ClipboardList className="h-6 w-6 text-primary" />
              {t("orderDetails") || "Order Details"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/80 mt-1">
              {t("viewDetailsDescription") || "Full information about this order instance."}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6 bg-background">
          {/* Assigned To Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <User className="h-3 w-3" />
              {t("assignedTo") || "Assigned To"}
            </h4>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-muted transition-all hover:bg-muted/50">
              <img
                src={resolveImage(order.staffId.avatar)}
                alt={order.staffId.fullname}
                className="w-12 h-12 rounded-full object-cover shadow-md ring-2 ring-primary/10"
              />
              <div className="space-y-0.5">
                <div className="font-bold text-foreground">{order.staffId.fullname}</div>
                <div className="text-sm text-muted-foreground select-all">
                  {order.staffId.email}
                </div>
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Info className="h-3 w-3" />
              {t("description") || "Description"}
            </h4>
            <div className="p-4 rounded-xl bg-muted/20 border border-muted/50 min-h-[60px]">
              {order.description ? (
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">{order.description}</p>
              ) : (
                <p className="text-muted-foreground italic text-sm">{t("noDescription") || "No description provided for this order."}</p>
              )}
            </div>
          </div>

          {/* Timing Section */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {t("dateCreated") || "Date Created"}
              </h4>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-muted/20 p-3 rounded-lg border border-muted/30">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Clock className="h-3 w-3" />
                {t("deadline") || "Deadline"}
              </h4>
              <div className={cn(
                "flex items-center gap-2 text-sm font-medium p-3 rounded-lg border",
                order.deadline ? "text-foreground bg-muted/20 border-muted/30" : "text-muted-foreground italic bg-muted/10 border-dashed border-muted"
              )}>
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {order.deadline ? format(new Date(order.deadline), "dd/MM/yyyy HH:mm") : (t("noDeadline") || "None")}
              </div>
            </div>
          </div>

          {/* Items Section - Only if they exist */}
          {order.items && order.items.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <ClipboardList className="h-3 w-3" />
                {t("orderItems") || "Order Items"}
              </h4>
              <div className="border border-muted rounded-xl overflow-hidden divide-y divide-muted bg-muted/5">
                {order.items.map((item, index) => (
                  <div key={index} className="flex font-medium items-center justify-between p-3 hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-muted overflow-hidden">
                        <img
                          src={resolveImage(item.productId.imageUrl)}
                          alt={item.productId.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-sm">{item.productId.name}</span>
                    </div>
                    <Badge variant="outline" className="font-mono bg-background">
                      x{item.quantity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Last Updated */}
          <div className="pt-4 border-t border-muted/50 flex justify-end">
             <div className="text-[10px] text-muted-foreground italic">
                {t("lastUpdated") || "Last updated"}: {format(new Date(order.updatedAt), "dd/MM/yyyy HH:mm")}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
