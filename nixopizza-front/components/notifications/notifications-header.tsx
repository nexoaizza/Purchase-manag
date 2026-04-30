"use client"

import { Button } from "@/components/ui/button"
import { CheckCheck, Settings } from "lucide-react"
import { useTranslations } from "next-intl"

export function NotificationsHeader() {
  const t = useTranslations("notifications")

  const handleMarkAllRead = () => {
    // In a real app, this would mark all notifications as read
    console.log("Marking all notifications as read")
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-heading font-bold text-balance">{t("title")}</h1>
        <p className="text-muted-foreground text-pretty">
          {t("subtitle")}
        </p>
      </div>
    </div>
  )
}
