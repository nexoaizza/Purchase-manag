// app/dashboard/shortcuts/page.tsx
"use client";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ShortcutsGrid } from "@/components/shortcuts/shortcuts-grid";
import { useTranslations } from "next-intl";

export default function ShortcutsPage() {
  const t = useTranslations("shortcuts");
  
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("quickFilters")}</h1>
            <p className="text-muted-foreground">
              {t("quickFiltersDesc")}
            </p>
          </div>
        </div>
        <ShortcutsGrid />
      </div>
    </DashboardLayout>
  );
}