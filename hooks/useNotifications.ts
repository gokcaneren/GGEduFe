"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  getNotificationConnection,
  startNotificationConnection,
  stopNotificationConnection,
} from "@/lib/signalr";
import { authService } from "@/lib/auth";
import api from "@/lib/api";
import { ApiResponse, NotificationOutputDto, PagedResponse } from "@/types";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationOutputDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  // İlk yükleme — DB'den son bildirimleri ve okunmamış sayısını çek
  const fetchInitial = useCallback(async () => {
    try {
      const [notifRes, countRes] = await Promise.all([
        api.get<ApiResponse<PagedResponse<NotificationOutputDto>>>(
          "/api/Notification",
          { params: { page: 1, pageSize: 20 } }
        ),
        api.get<ApiResponse<number>>("/api/Notification/unread-count"),
      ]);

      if (notifRes.data.success && notifRes.data.data) {
        setNotifications(notifRes.data.data.items);
      }
      if (countRes.data.success && countRes.data.data !== null) {
        setUnreadCount(countRes.data.data);
      }
    } catch {
      // sessiz hata
    } finally {
      setLoading(false);
    }
  }, []);

  // SignalR bağlantısı
  useEffect(() => {
  const user = authService.getUser();
  if (!user) return;

  const connect = async () => {
    try {
      await startNotificationConnection();
      const conn = getNotificationConnection();

      // Önce DB'den çek, SONRA SignalR listener'ı kur
      await fetchInitial();

      conn.on("ReceiveNotification", (notification: NotificationOutputDto) => {
        setNotifications((prev) => {
          // Aynı id zaten varsa ekleme
          if (prev.some((n) => n.id === notification.id)) return prev;
          return [notification, ...prev];
        });
        // setUnreadCount((prev) => prev + 1);
        api.get<ApiResponse<number>>("/api/Notification/unread-count").then((res) => {
    if (res.data.success && res.data.data !== null) {
      setUnreadCount(res.data.data);
    }
  });
      });

    } catch {
      // bağlantı hatası
    }
  };

  connect();

  return () => {
    const conn = getNotificationConnection();
    conn.off("ReceiveNotification");
    stopNotificationConnection();
  };
}, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await api.patch(`/api/Notification/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch { /* sessiz hata */ }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/api/Notification/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* sessiz hata */ }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  };
}