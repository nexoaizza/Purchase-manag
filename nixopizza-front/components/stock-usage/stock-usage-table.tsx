"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, AlertTriangle } from "lucide-react";
import { IStockUsage } from "@/lib/apis/stock-usage";
import { Pagination } from "../ui/pagination";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface StockUsageTableProps {
  usages: IStockUsage[];
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  limit: number;
  setLimit: (l: number) => void;
}

export function StockUsageTable({
  usages,
  totalPages,
  currentPage,
  setCurrentPage,
  limit,
  setLimit,
}: StockUsageTableProps) {
  if (usages.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-muted rounded-full">
            <AlertTriangle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-1">No Usage Records Found</h3>
          <p className="text-muted-foreground mb-4">You don't have any stock usage records with this filtration.</p>
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
                <TableHead>Product</TableHead>
                <TableHead>Quantity Used</TableHead>
                <TableHead>Stock Location</TableHead>
                <TableHead>Staff Member</TableHead>
                <TableHead>Date of Usage</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usages.map((usage) => (
                <TableRow key={usage._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      {usage.product?.name || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {usage.quantityUsed} {usage.product?.unit || ""}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {usage.stock?.name || "N/A"}
                  </TableCell>
                  <TableCell>
                    {usage.staff?.fullname || usage.staff?.email || "N/A"}
                  </TableCell>
                  <TableCell>
                    {usage.usedAt
                      ? format(new Date(usage.usedAt), "dd/MM/yyyy HH:mm")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {usage.note || "-"}
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
