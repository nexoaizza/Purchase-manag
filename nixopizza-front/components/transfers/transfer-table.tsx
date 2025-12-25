"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowRightLeft,
  Package,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { ITransfer, updateTransfer } from "@/lib/apis/transfers";
import { Pagination } from "../ui/pagination";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import toast from "react-hot-toast";

interface TransferTableProps {
  transfers: ITransfer[];
  onEdit: (transfer: ITransfer) => void;
  onDelete: (id: string) => Promise<void>;
  onStatusChange?: () => void;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  limit: number;
  setLimit: (l: number) => void;
}

export function TransferTable({
  transfers,
  onEdit,
  onDelete,
  onStatusChange,
  totalPages,
  currentPage,
  setCurrentPage,
  limit,
  setLimit,
}: TransferTableProps) {
  const t = useTranslations("transfers");
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<ITransfer | null>(null);
  const [newStatus, setNewStatus] = useState<"pending" | "arrived">("pending");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChangeClick = (transfer: ITransfer) => {
    setSelectedTransfer(transfer);
    setNewStatus(transfer.status);
    setIsStatusDialogOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedTransfer) return;

    setIsUpdating(true);
    try {
      const result = await updateTransfer(selectedTransfer._id, {
        status: newStatus,
      });

      if (result.success) {
        toast.success(t("transferUpdated"));
        setIsStatusDialogOpen(false);
        if (onStatusChange) {
          onStatusChange();
        }
      } else {
        toast.error(result.message || "Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred while updating status");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{t("pending")}</Badge>;
      case "arrived":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("arrived")}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (transfers.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-muted rounded-full">
            <ArrowRightLeft className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-1">{t("noTransfersFound")}</h3>
          <p className="text-muted-foreground mb-4">{t("noTransfersMessage")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardContent>
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>{t("from")}</TableHead>
                <TableHead>{t("to")}</TableHead>
                <TableHead>{t("items")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.map((transfer) => (
                <TableRow key={transfer._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {transfer.takenFrom?.name || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      {transfer.takenTo?.name || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {transfer.items?.length || 0} {t("itemsCount")}
                    </Badge>
                  </TableCell>
                  <TableCell>{transfer.quantity}</TableCell>
                  <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                  <TableCell>
                    {transfer.createdAt
                      ? format(new Date(transfer.createdAt), "MMM dd, yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChangeClick(transfer)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Change Status
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(transfer)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(transfer._id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t("delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            limit={limit}
            setLimit={setLimit}
          />
        </div>
      </CardContent>

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Transfer Status</DialogTitle>
            <DialogDescription>
              Update the status of the transfer from{" "}
              <strong>{selectedTransfer?.takenFrom?.name}</strong> to{" "}
              <strong>{selectedTransfer?.takenTo?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="status" className="text-sm font-medium">
                {t("status")}
              </label>
              <Select
                value={newStatus}
                onValueChange={(value: "pending" | "arrived") => setNewStatus(value)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        {t("pending")}
                      </Badge>
                    </div>
                  </SelectItem>
                  <SelectItem value="arrived">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {t("arrived")}
                      </Badge>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={isUpdating}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleStatusUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? t("updating") : t("update")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
