"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package, ShoppingCart, Users, Clock, CheckCircle, X, ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { get_all_notifications, read_notification } from "@/lib/apis/notifications"
import { useTranslations } from "next-intl"

interface Notification {
  _id: string
  title: string
  message: string
  type: "critical" | "warning" | "info" | "success"
  category: "inventory" | "orders" | "suppliers" | "system"
  createdAt: string
  isRead: boolean
}



export function NotificationsList() {
  const t = useTranslations("notifications")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "unread" | "critical">("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const getIcon = (category: string) => {
    switch (category) {
      case "inventory":
        return Package
      case "orders":
        return ShoppingCart
      case "suppliers":
        return Users
      default:
        return AlertTriangle
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-200"
      case "warning":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "success":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-blue-100 text-blue-800 border-blue-200"
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (filter === "unread") return !notification.isRead
    if (filter === "critical") return notification.type === "critical"
    return true
  })

  const markAsRead = async (id: string) => {
    try {
      await read_notification(id)
      setNotifications((prev) =>
        prev.map((notification) => (notification._id === id ? { ...notification, isRead: true } : notification)),
      )
    } catch (e) {
      console.error(e)
    }
  }

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification._id !== id))
  }
  
  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await get_all_notifications(currentPage)
      const fetchedNotifications = data?.notifications || []
      setNotifications(fetchedNotifications)
      setTotalPages(data?.pages || 1)
      
      // Automatically mark visible fetched notifications as read
      if (fetchedNotifications.length > 0) {
        const unreadIds = fetchedNotifications.filter((n: Notification) => !n.isRead).map((n: Notification) => n._id)
        if (unreadIds.length > 0) {
          unreadIds.forEach(async (id: string) => {
            try {
              await read_notification(id)
            } catch (e) {
              console.error(e)
            }
          })
          setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        }
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    fetchNotifications()
  }, [currentPage])
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("recentNotifications")}</CardTitle>
          <div className="flex gap-2">
            <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")}>
              {t("all")}
            </Button>
            <Button variant={filter === "unread" ? "default" : "outline"} size="sm" onClick={() => setFilter("unread")}>
              {t("unread")}
            </Button>
            <Button
              variant={filter === "critical" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("critical")}
            >
              {t("critical")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-8">
              <Clock className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              {t("noNotifications")}
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = getIcon(notification.category)
              return (
                <div
                  key={notification._id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    notification.isRead ? "bg-muted/30" : "bg-background"
                  }`}
                >
                <div className="p-2 rounded-full bg-muted">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className={`font-medium ${!notification.isRead ? "font-semibold" : ""}`}>
                        {notification.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getTypeColor(notification.type)}>
                        {t(`type${notification.type.charAt(0).toUpperCase()}${notification.type.slice(1)}`)}
                      </Badge>
                      {!notification.isRead && (
                        <Button variant="ghost" size="sm" onClick={() => markAsRead(notification._id)}>
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => dismissNotification(notification._id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(notification.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )
            })
          )}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground mx-2">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
