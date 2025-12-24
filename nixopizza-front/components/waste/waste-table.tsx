"use client";

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
  MoreHorizontal,
  Edit,
  Trash2,
  AlertTriangle,
  Package,
} from "lucide-react";
import { IWaste } from "@/lib/apis/waste";
import { Pagination } from "../ui/pagination";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface WasteTableProps {
  wastes: IWaste[];
  onEdit: (waste: IWaste) => void;
  onDelete: (id: string) => Promise<void>;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  limit: number;
  setLimit: (l: number) => void;
}

export function WasteTable({
  wastes,
  onEdit,
  onDelete,
  totalPages,
  currentPage,
  setCurrentPage,
  limit,
  setLimit,
}: WasteTableProps) {
  const t = useTranslations("waste");

  const getReasonBadge = (reason: string) => {
    const lowerReason = reason.toLowerCase();
    if (lowerReason.includes("expired")) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{reason}</Badge>;
    } else if (lowerReason.includes("damaged")) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{reason}</Badge>;
    } else if (lowerReason.includes("spoiled")) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{reason}</Badge>;
    }
    return <Badge variant="outline">{reason}</Badge>;
  };

  if (wastes.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-muted rounded-full">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-1">{t("noWasteFound")}</h3>
          <p className="text-muted-foreground mb-4">{t("noWasteMessage")}</p>
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
                <TableHead>{t("product")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("reason")}</TableHead>
                <TableHead>{t("stock")}</TableHead>
                <TableHead>{t("staff")}</TableHead>
                <TableHead>{t("date")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wastes.map((waste) => (
                <TableRow key={waste._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {waste.product?.name || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{waste.quantity}</Badge>
                  </TableCell>
                  <TableCell>{getReasonBadge(waste.reason)}</TableCell>
                  <TableCell>
                    {waste.stock?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    {waste.staff?.name || waste.staff?.email || "N/A"}
                  </TableCell>
                  <TableCell>
                    {waste.createdAt
                      ? format(new Date(waste.createdAt), "MMM dd, yyyy")
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
                        <DropdownMenuItem onClick={() => onEdit(waste)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(waste._id)}
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
    </Card>
  );
}
