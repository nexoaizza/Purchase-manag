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
  Package,
  MapPin,
  DollarSign,
  Calendar,
  AlertCircle,
  ArrowRightLeft,
  MinusCircle,
} from "lucide-react";
import { IStockItem } from "@/lib/apis/stock-items";
import { Pagination } from "../ui/pagination";
import { Badge } from "@/components/ui/badge";
import { resolveImage } from "@/lib/resolveImage";
import { TransferStockItemDialog } from "./transfer-stock-item-dialog";
import { UtiliseStockItemDialog } from "./utilise-stock-item-dialog";
import { useState } from "react";

interface StockItemTableProps {
  stockItems: IStockItem[];
  onEdit: (stockItem: IStockItem) => void;
  onDelete: (id: string) => Promise<void>;
  totalPages: number;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  limit: number;
  setLimit: (l: number) => void;
}

export function StockItemTable({
  stockItems,
  onEdit,
  onDelete,
  totalPages,
  currentPage,
  setCurrentPage,
  limit,
  setLimit,
}: StockItemTableProps) {
  const t = useTranslations("stockItems");
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [isUtiliseDialogOpen, setIsUtiliseDialogOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<IStockItem | null>(null);

  const handleTransfer = (stockItem: IStockItem) => {
    setSelectedStockItem(stockItem);
    setIsTransferDialogOpen(true);
  };

  const handleUtilise = (stockItem: IStockItem) => {
    setSelectedStockItem(stockItem);
    setIsUtiliseDialogOpen(true);
  };

  const handleStockItemTransferred = () => {
    // Reload the page or refetch data
    window.location.reload();
  };

  const handleStockItemUtilised = () => {
    // Reload the page or refetch data
    window.location.reload();
  };

  const getExpirationStatus = (expireAt?: Date) => {
    if (!expireAt) return null;
    
    const now = new Date();
    const expireDate = new Date(expireAt);
    const daysUntilExpiry = Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { label: t("expired"), color: "text-red-600 border-red-600" };
    } else if (daysUntilExpiry <= 7) {
      return { label: t("expiringSoon"), color: "text-amber-600 border-amber-600" };
    }
    return { label: t("fresh"), color: "text-green-600 border-green-600" };
  };

  if (stockItems.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 p-3 bg-muted rounded-full">
            <Package className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-1">{t("noStockItemsFound")}</h3>
          <p className="text-muted-foreground mb-4">{t("noStockItemsMessage")}</p>
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
                <TableHead>{t("stock")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("price")}</TableHead>
                <TableHead>{t("dateReceived")}</TableHead>
                <TableHead>{t("expiration")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {stockItems.map((item) => {
                const expirationStatus = getExpirationStatus(item.expireAt);

                return (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <img
                          src={resolveImage(item.product?.imageUrl)}
                          alt={item.product?.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <div className="font-medium">{item.product?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.product?.unit}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{item.stock?.name}</span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{item.stock?.location}</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="secondary" className="gap-1">
                        <Package className="h-3 w-3" />
                        {item.quantity}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{item.price.toFixed(2)}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      {item.expireAt ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <span>{new Date(item.expireAt).toLocaleDateString()}</span>
                          </div>
                          {expirationStatus && (
                            <Badge
                              variant="outline"
                              className={`gap-1 ${expirationStatus.color}`}
                            >
                              <AlertCircle className="h-3 w-3" />
                              {expirationStatus.label}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">{t("noExpiration")}</span>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUtilise(item)}>
                            <MinusCircle className="mr-2 h-4 w-4" />
                            {t("utilise")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTransfer(item)}>
                            <ArrowRightLeft className="mr-2 h-4 w-4" />
                            {t("transfer")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEdit(item)}>
                            <Edit className="mr-2 h-4 w-4" />
                            {t("edit")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(item._id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("delete")}
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          limit={limit}
          onLimitChange={setLimit}
        />
      </CardContent>

      <TransferStockItemDialog
        stockItem={selectedStockItem}
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
        onStockItemTransferred={handleStockItemTransferred}
      />

      <UtiliseStockItemDialog
        stockItem={selectedStockItem}
        open={isUtiliseDialogOpen}
        onOpenChange={setIsUtiliseDialogOpen}
        onStockItemUtilised={handleStockItemUtilised}
      />
    </Card>
  );
}
