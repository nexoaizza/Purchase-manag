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
  Warehouse,
  Package,
  MapPin,
} from "lucide-react";
import { IStock } from "@/lib/apis/stocks";
import { Pagination } from "../ui/pagination";
import { Badge } from "@/components/ui/badge";

interface StockTableProps {
  stocks: IStock[];
  onEdit: (stock: IStock) => void;
  onDelete: (id: string) => Promise<void>;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  limit: number;
  setLimit: (l: number) => void;
}

export function StockTable({
  stocks,
  onEdit,
  onDelete,
  totalPages,
  currentPage,
  setCurrentPage,
  limit,
  setLimit,
}: StockTableProps) {
  const t = useTranslations("stocks");

  if (stocks.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-muted rounded-full">
            <Warehouse className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-1">{t("noStocksFound")}</h3>
          <p className="text-muted-foreground mb-4">{t("noStocksMessage")}</p>
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
                <TableHead>{t("name")}</TableHead>
                <TableHead>{t("description")}</TableHead>
                <TableHead>{t("location")}</TableHead>
                <TableHead>{t("items")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {stocks.map((stock) => (
                <TableRow key={stock._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Warehouse className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{stock.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(stock.createdAt!).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="max-w-xs truncate">
                      {stock.description}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{stock.location}</span>
                    </div>
                  </TableCell>

                  <TableCell>
                    <Badge variant="secondary" className="gap-1">
                      <Package className="h-3 w-3" />
                      {stock.items?.length || 0} {t("itemsCount")}
                    </Badge>
                  </TableCell>

                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(stock)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(stock._id)}
                          className="text-destructive focus:text-destructive"
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          limit={limit}
          onLimitChange={setLimit}
        />
      </CardContent>
    </Card>
  );
}
