// components/shortcuts/shortcuts-grid.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function ShortcutsGrid() {
  const router = useRouter();
  const t = useTranslations("shortcuts");

  const getLastThursday = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 4 = Thursday

    // Calculate days since last Thursday (inclusive of today if today is Thursday)
    let daysToSubtract;
    if (dayOfWeek >= 4) {
      // If today is Thursday (4) or later, go back to this week's Thursday
      daysToSubtract = dayOfWeek - 4;
    } else {
      // If today is before Thursday, go back to last week's Thursday
      daysToSubtract = dayOfWeek + 3;
    }

    const lastThursday = new Date(today);
    lastThursday.setDate(today.getDate() - daysToSubtract);
    lastThursday.setHours(0, 0, 0, 0);

    return lastThursday;
  };

  const getTodayRange = () => {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
  };

  const handleLastWeekFilter = () => {
    const lastThursday = getLastThursday();
    const today = new Date();

    // Format dates as ISO strings for URL params
    const startDate = lastThursday.toISOString();
    const endDate = today.toISOString();

    // Navigate to purchases page with query parameters - EXCLUDING paid
    const params = new URLSearchParams({
      dateFrom: startDate,
      dateTo: endDate,
      status: "not assigned,assigned,confirmed", // All statuses EXCEPT paid
    });

    router.push(`/dashboard/purchases?${params.toString()}`);
  };

  const handleLastWeekPaidFilter = () => {
    const lastThursday = getLastThursday();
    const today = new Date();

    // Format dates as ISO strings for URL params
    const startDate = lastThursday.toISOString();
    const endDate = today.toISOString();

    // Navigate to purchases page with query parameters - ONLY paid
    const params = new URLSearchParams({
      dateFrom: startDate,
      dateTo: endDate,
      status: "paid", // Only paid status
    });

    router.push(`/dashboard/purchases?${params.toString()}`);
  };

  const handleTodayFilter = () => {
    const { startOfDay, endOfDay } = getTodayRange();

    // Navigate to purchases page with query parameters - ALL statuses
    const params = new URLSearchParams({
      dateFrom: startOfDay.toISOString(),
      dateTo: endOfDay.toISOString(),
      status: "all",
    });

    router.push(`/dashboard/purchases?${params.toString()}`);
  };

  const handleTodayPaidFilter = () => {
    const { startOfDay, endOfDay } = getTodayRange();

    // Navigate to purchases page with query parameters - ONLY paid
    const params = new URLSearchParams({
      dateFrom: startOfDay.toISOString(),
      dateTo: endOfDay.toISOString(),
      status: "paid",
    });

    router.push(`/dashboard/purchases?${params.toString()}`);
  };

  const handleOwsUsFilter = () => {
    // Navigate to the dedicated To Pay page
    router.push(`/dashboard/to-pay`);
  };

  const shortcuts = [
    {
      title: t("lastWeekOrders"),
      description: t("lastWeekOrdersDesc"),
      icon: Calendar,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
      count: t("active"),
      onClick: handleLastWeekFilter,
    },
    {
      title: t("lastWeekPaid"),
      description: t("lastWeekPaidDesc"),
      icon: DollarSign,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
      count: t("paid"),
      onClick: handleLastWeekPaidFilter,
    },
    {
      title: t("todayOrders"),
      description: t("todayOrdersDesc"),
      icon: Clock,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
      count: t("today"),
      onClick: handleTodayFilter,
    },
    {
      title: t("todayPaidOrders"),
      description: t("todayPaidOrdersDesc"),
      icon: CheckCircle,
      iconColor: "text-emerald-600",
      bgColor: "bg-emerald-50",
      count: t("completed"),
      onClick: handleTodayPaidFilter,
    },
    {
      title: t("owsUs"),
      description: t("owsUsDesc"),
      icon: AlertCircle,
      iconColor: "text-orange-600",
      bgColor: "bg-orange-50",
      count: t("toPay"),
      onClick: handleOwsUsFilter,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {shortcuts.map((shortcut, index) => (
        <Card
          key={index}
          className="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
          onClick={shortcut.onClick}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {shortcut.title}
            </CardTitle>
            <div className={`p-2 rounded-full ${shortcut.bgColor}`}>
              <shortcut.icon className={`h-4 w-4 ${shortcut.iconColor}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{shortcut.count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {shortcut.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
