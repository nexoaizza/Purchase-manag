// components/stuff/assign-order-dialog.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Package,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { ProductSelect } from "@/components/ui/product-select";
import { getProducts } from "@/lib/apis/products";
import { IProduct } from "@/app/[locale]/dashboard/products/page";
import toast from "react-hot-toast";
import { IUser } from "@/store/user.store";
import { createOrder } from "@/lib/apis/order";

// Types for real data
interface IOrderItem {
  productId: string;
  quantity: number;
}

interface AssignOrderDialogProps {
  stuff: IUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignOrderDialog({
  stuff,
  open,
  onOpenChange,
}: AssignOrderDialogProps) {
  const t = useTranslations("staff");
  const [orderName, setOrderName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [orderItems, setOrderItems] = useState<IOrderItem[]>([
    { productId: "", quantity: 1 },
  ]);
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<IProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<(IProduct | null)[]>(
    [null]
  );
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        const response = await getProducts();

        if (response && Array.isArray(response.products)) {
          setProducts(response.products);
        } else if (response && Array.isArray(response)) {
          setProducts(response);
        } else {
          console.error("Unexpected response format:", response);
          setProducts([]);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
        setError(t("loadProductsError"));
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  const addOrderItem = () => {
    setOrderItems([...orderItems, { productId: "", quantity: 1 }]);
    setSelectedProducts([...selectedProducts, null]);
  };

  const removeOrderItem = (index: number) => {
    if (orderItems.length <= 1) return;
    setOrderItems(orderItems.filter((_, i) => i !== index));
    setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
  };

  const updateOrderItem = (
    index: number,
    field: keyof IOrderItem,
    value: string | number
  ) => {
    const updated = [...orderItems];
    updated[index] = { ...updated[index], [field]: value };
    setOrderItems(updated);
  };

  const handleProductSelect = (index: number, product: IProduct | null) => {
    const updatedSelectedProducts = [...selectedProducts];
    updatedSelectedProducts[index] = product;
    setSelectedProducts(updatedSelectedProducts);

    if (product) {
      updateOrderItem(index, "productId", product._id);
    } else {
      updateOrderItem(index, "productId", "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stuff) {
      setError(t("noStaffSelected"));
      return;
    }

    if (!orderName.trim()) {
      setError(t("taskNameRequired"));
      return;
    }

    if (!deadline) {
      setError(t("deadlineRequired"));
      return;
    }

    if (orderItems.length === 0) {
      setError(t("addAtLeastOneItem"));
      return;
    }

    const hasEmptyProducts = orderItems.some((item) => !item.productId);
    if (hasEmptyProducts) {
      setError(t("selectProductsForAll"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const items = orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));

      const orderData = {
        staffId: stuff._id,
        items,
        deadline,
        notes,
      };

      const { success, message, order } = await createOrder(orderData);

      if (success) {
        toast.success(t("taskAssignedSuccess"));
        resetForm();
        onOpenChange(false);
      } else {
        setError(message || t("failedToAssignTask"));
        console.error("Error creating order:", message);
      }
    } catch (error) {
      setError(t("unexpectedError"));
      console.error("Error creating order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setOrderName("");
    setDeadline("");
    setOrderItems([{ productId: "", quantity: 1 }]);
    setSelectedProducts([null]);
    setNotes("");
    setError(null);
  };

  const handleDialogChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      resetForm();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2 text-xl">
            <Package className="h-5 w-5" />
            {t("assignTask")}
          </DialogTitle>
          <DialogDescription>
            {t("assignTaskDescription")} {stuff?.fullname || t("staffMember")}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg flex items-center gap-2 border border-destructive/20">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {isLoadingProducts && (
          <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-lg flex items-center gap-2 border border-blue-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{t("loadingProducts")}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Name */}
          <div className="space-y-2">
            <Label htmlFor="orderName" className="text-sm font-medium">
              {t("taskName")} *
            </Label>
            <Input
              id="orderName"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              placeholder={t("taskNamePlaceholder")}
              required
              className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label htmlFor="deadline" className="text-sm font-medium">
              {t("deadline")} *
            </Label>
            <Input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
              className="py-5 border-2 border-input focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg"
            />
          </div>

          {/* Order Items */}
          <Card className="border-0 shadow-sm rounded-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg">
                  {t("taskItems")}
                </CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOrderItem}
                  disabled={isLoadingProducts}
                  className="gap-2 rounded-full border-2 border-input px-4"
                >
                  <Plus className="h-4 w-4" />
                  {t("addItem")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {orderItems.length > 0 && (
                <div className="space-y-4">
                  {orderItems.map((item, index) => {
                    return (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row items-start sm:items-end gap-4 p-4 border rounded-xl bg-card"
                      >
                        <div className="flex-1 space-y-2">
                          <Label className="text-sm font-medium">
                            {t("product")} *
                          </Label>
                          <ProductSelect
                            products={products}
                            selectedProduct={selectedProducts[index] || null}
                            onSelect={(product: any) =>
                              handleProductSelect(index, product)
                            }
                            placeholder={t("selectProduct")}
                            className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg"
                          />
                        </div>
                        <div className="w-full sm:w-32 space-y-2">
                          <Label className="text-sm font-medium">
                            {t("quantity")} *
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.quantity}
                            onChange={(e) =>
                              updateOrderItem(
                                index,
                                "quantity",
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg py-5"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => removeOrderItem(index)}
                          disabled={orderItems.length <= 1}
                          className="text-destructive hover:text-destructive border-2 border-input w-10 h-10 rounded-full mt-4 sm:mt-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">
              {t("notes")} ({t("optional")})
            </Label>
            <Textarea
              id="notes"
              placeholder={t("taskNotesPlaceholder")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="border-2 border-input focus:ring-2 focus:ring-primary/30 rounded-lg"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-full px-6"
            >
              {t("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={
                !stuff ||
                !orderName.trim() ||
                !deadline ||
                orderItems.length === 0 ||
                isSubmitting ||
                isLoadingProducts ||
                orderItems.some((item) => !item.productId)
              }
              className="rounded-full px-6 bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {t("assigning")}
                </>
              ) : (
                t("assignTaskButton")
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
