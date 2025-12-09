"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  Menu,
  LogOut,
  Bell,
  Shapes,
  Zap,
  MoreVertical,
  Cog,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { logoutUser } from "@/lib/apis/auth";
import { getProfile, useAuth } from "@/hooks/useAuth";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();
  const locale = useLocale();
  const isRTL = locale === "ar";
  const t = useTranslations("navigation");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const navigation =
    user?.role === "admin"
      ? [
          { name: t("dashboard"), href: "/dashboard", icon: BarChart3 },
          { name: t("categories"), href: "/dashboard/categories", icon: Shapes },
          { name: t("products"), href: "/dashboard/products", icon: Package },
          { name: t("suppliers"), href: "/dashboard/suppliers", icon: Users },
          {
            name: t("purchaseLists"),
            href: "/dashboard/purchases",
            icon: ShoppingCart,
          },
          { name: t("templates"), href: "/dashboard/purchases/templates", icon: FileText },
          { name: t("shortcuts"), href: "/dashboard/shortcuts", icon: Zap },
          { name: t("lowStock"), href: "/dashboard/alerts", icon: AlertTriangle },
          { name: t("staff"), href: "/dashboard/stuff", icon: Users },
          { name: t("tasks"), href: "/dashboard/tasks", icon: Users },
          {
            name: t("notifications"),
            href: "/dashboard/notifications",
            icon: Bell,
          },
        ]
      : [
          { name: t("dashboard"), href: "/dashboardstaff", icon: BarChart3 },
          { name: t("orders"), href: "/dashboardstaff/orders", icon: Users },
        ];

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "fixed top-4 z-40 md:hidden",
              isRTL ? "right-4" : "left-4"
            )}
            size="icon"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side={isRTL ? "right" : "left"} className="p-0 w-64">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col",
          isRTL ? "md:right-0" : "md:left-0"
        )}
      >
        <Sidebar />
      </div>

      {/* Main content */}
      <div
        className={cn(
          "md:w-[calc(100%-16rem)]",
          isRTL ? "md:mr-64" : "md:ml-64"
        )}
      >
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );

  /************************************
   *            SIDEBAR
   ************************************/
  function Sidebar() {
    return (
      <div
        className={cn(
          "flex grow flex-col gap-y-5 overflow-y-auto bg-card border-r border-border px-6 pb-4",
          isRTL && "border-r-0 border-l"
        )}
      >
        <div className="flex h-16 shrink-0 items-center">
          <img src="/nexo-logo.png" alt="Logo" className="w-[150px]" />
        </div>

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href;

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted hover:text-foreground"
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon className="h-5 w-5 shrink-0" />
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </li>

            {/* ⭐ USER MENU (new section) */}
            <li className="mt-auto">
              <UserMenu />
            </li>
          </ul>
        </nav>
      </div>
    );
  }
}

/************************************
 *      USER MENU COMPONENT
 ************************************/
function UserMenu() {
  const [langIndex, setLangIndex] = useState(0);
  const languages = [
    { code: "fr", label: "FR", flag: "🇫🇷" },
    { code: "ar", label: "AR", flag: "🇩🇿" },
    { code: "en", label: "EN", flag: "🇬🇧" },
  ];

  const locale = useLocale();
  const t = useTranslations("navigation");
  const user = getProfile();
  console.log("user", user);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
       <div className="w-full cursor-pointer rounded-md hover:bg-muted relative">
  <div className="flex items-center gap-2">
    <Avatar className="h-8 w-8">
      <AvatarImage
        src={user?.avatar ?? undefined}
        alt={user?.fullname}
        className="object-cover"
      />
      <AvatarFallback
        className="bg-orange-500 text-white font-semibold"
      >
        {(user?.fullname?.[0] || "N").toUpperCase()}
      </AvatarFallback>
    </Avatar>

    {
      (() => {
        const full = user?.fullname || "";
        const display = full.length > 18 ? `${full.slice(0, 18)}...` : full;
        return (
          <span className="text-sm font-medium" title={full}>
            {display}
          </span>
        );
      })()
    }
  </div>

  <MoreVertical className={`w-4 h-4 absolute ${locale === "ar" ? "left-[-8px]" : "right-[-8px]"} top-0`} />
</div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem
          onClick={() => (window.location.href = "/logout")}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          {t("signOut")}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => (window.location.href = `/${locale}/dashboard/parameters`) }
          className="flex items-center gap-2"
        >
          <Cog className="h-4 w-4" />
          {t("parameters")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
