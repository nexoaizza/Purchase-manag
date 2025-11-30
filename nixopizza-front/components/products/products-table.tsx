"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  Package,
} from "lucide-react";
import { resolveImage } from "@/lib/resolveImage";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { IProduct } from "@/app/[locale]/dashboard/products/page";
import { Pagination } from "../ui/pagination";

interface ProductsTableProps {
  products: IProduct[];
  onEdit: (p: IProduct) => void;
  onDelete: (id: string) => Promise<void>;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  limit: number;
  setLimit: (l: number) => void;
}

export function ProductsTable({
  products,
  onEdit,
  onDelete,
  totalPages,
  currentPage,
  setCurrentPage,
  limit,
  setLimit,
}: ProductsTableProps) {
  const t = useTranslations("products");

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0)
      return {
        label: t("outOfStock"),
        variant: "outline" as const,
        color: "text-destructive border-destructive",
      };
    if (stock <= minStock)
      return {
        label: t("lowStock"),
        variant: "outline" as const,
        color: "text-amber-600 border-amber-600",
      };
    return {
      label: t("inStock"),
      variant: "outline" as const,
      color: "text-green-600 border-green-600",
    };
  };

  if (products.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-muted rounded-full">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-1">{t("noProductsFound")}</h3>
          <p className="text-muted-foreground mb-4">
            {t("noProductsMessage")}
          </p>
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
                <TableHead>{t("categoryHeader")}</TableHead>
                <TableHead>{t("stockHeader")}</TableHead>
                <TableHead>{t("statusHeader")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {products.map((product) => {
                const stockStatus = getStockStatus(
                  product.currentStock,
                  product.minQty
                );

                return (
                  <TableRow key={product._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img
                            src={resolveImage(product.imageUrl)}
                            alt={product.name}
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                          {product.currentStock <= product.minQty && (
                            <div className="absolute -top-1 -right-1 bg-destructive rounded-full p-1">
                              <AlertTriangle className="h-3 w-3 text-destructive-foreground" />
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {t("barcode")}: {product.barcode || "N/A"}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={resolveImage(product.categoryId?.image)}
                          alt={product.categoryId?.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <span>{product.categoryId?.name}</span>
                      </div>
                    </TableCell>

                    <TableCell>{product.currentStock}</TableCell>

                    <TableCell>
                      <Badge
                        variant={stockStatus.variant}
                        className={`${stockStatus.color} capitalize`}
                      >
                        {stockStatus.label}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted"
                            type="button"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(product)}>
                            <Edit className="h-4 w-4 mr-2" /> {t("edit")}
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => onDelete(product._id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> {t("delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            {t("showingProducts")} {products.length} {t("of")}{" "}
            {totalPages * limit} {t("products")}
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
  );
}
