"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Bell, Check, BookOpen, Users, Loader2 } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationOutputDto, NotificationType } from "@/types";
import { useRouter } from "next/navigation";

const TYPE_ICONS: Record<NotificationType, React.ReactNode> = {
  0: <BookOpen size={14} color="#2563eb" />,   // BookingRequest
  1: <BookOpen size={14} color="#16a34a" />,   // BookingAccepted
  2: <BookOpen size={14} color="#dc2626" />,   // BookingRejected
  3: <BookOpen size={14} color="#d97706" />,   // BookingCancelled
  4: <Users size={14} color="#2563eb" />,       // SubscriptionRequest
  5: <Users size={14} color="#16a34a" />,       // SubscriptionAccepted
  6: <Users size={14} color="#dc2626" />,       // SubscriptionRejected
};

function timeAgo(dateStr: string, locale: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return locale === "tr" ? "Az önce" : "Just now";
  if (diff < 3600) return locale === "tr"
    ? `${Math.floor(diff / 60)} dk önce`
    : `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return locale === "tr"
    ? `${Math.floor(diff / 3600)} sa önce`
    : `${Math.floor(diff / 3600)}h ago`;
  return locale === "tr"
    ? `${Math.floor(diff / 86400)} gün önce`
    : `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ locale }: { locale: string }) {
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();

  // Dışarı tıklayınca kapat
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleItemClick = (n: NotificationOutputDto) => {
    if (!n.isRead) markAsRead(n.id);

  switch (n.type) {
    case 0: // BookingRequest — öğretmen ders isteklerini görür
    case 1: // BookingAccepted
    case 2: // BookingRejected
    case 3: // BookingCancelled
      router.push(`/${locale}/dashboard/teacher/lessons`);
      break;
    case 4: // SubscriptionRequest — öğretmen sub isteklerini görür
    case 5: // SubscriptionAccepted
    case 6: // SubscriptionRejected
      router.push(`/${locale}/dashboard/teacher/students`);
      break;
    default:
      break;
  }

  setOpen(false);
  };

  return (
    <div ref={panelRef} style={styles.wrapper}>
      {/* Zil ikonu */}
      <button
        style={styles.bellBtn}
        onClick={() => setOpen((o) => !o)}
        title={t("title")}
      >
        <Bell size={20} color="#64748b" />
        {unreadCount > 0 && (
          <span style={styles.badge}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div style={styles.panel}>
          {/* Panel başlık */}
          <div style={styles.panelHeader}>
            <p style={styles.panelTitle}>{t("title")}</p>
            {unreadCount > 0 && (
              <button style={styles.readAllBtn} onClick={markAllAsRead}>
                <Check size={13} />
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={styles.list}>
            {loading && (
              <div style={styles.centered}>
                <Loader2 size={22} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}

            {!loading && notifications.length === 0 && (
              <div style={styles.empty}>
                <Bell size={28} color="#cbd5e1" />
                <p style={styles.emptyText}>{t("empty")}</p>
              </div>
            )}

            {!loading && notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  ...styles.item,
                  ...(n.isRead ? {} : styles.itemUnread),
                }}
                onClick={() => handleItemClick(n)}
              >
                {/* İkon */}
                <div style={styles.itemIcon}>
                  {TYPE_ICONS[n.type]}
                </div>

                {/* İçerik */}
                <div style={styles.itemContent}>
                  <p style={styles.itemTitle}>{n.title}</p>
                  <p style={styles.itemMessage}>{n.message}</p>
                  <p style={styles.itemTime}>{timeAgo(n.createdAt, locale)}</p>
                </div>

                {/* Okunmamış nokta */}
                {!n.isRead && <span style={styles.unreadDot} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { position: "relative" },
  bellBtn: {
    position: "relative", background: "#f8fafc",
    border: "1px solid #e2e8f0", borderRadius: "10px",
    padding: "8px", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  badge: {
    position: "absolute", top: "-6px", right: "-6px",
    background: "#ef4444", color: "#ffffff",
    fontSize: "10px", fontWeight: "700",
    borderRadius: "20px", padding: "1px 5px",
    minWidth: "18px", textAlign: "center",
    fontFamily: "'DM Sans', sans-serif",
    border: "2px solid #f8f7f4",
  },
  panel: {
    position: "absolute", top: "calc(100% + 8px)", right: 0,
    width: "360px", background: "#ffffff",
    border: "1px solid #e2e8f0", borderRadius: "16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
    zIndex: 1000, overflow: "hidden",
  },
  panelHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 20px", borderBottom: "1px solid #f1f5f9",
  },
  panelTitle: {
    fontSize: "15px", fontWeight: "600", color: "#1a1a2e",
    fontFamily: "'DM Sans', sans-serif",
  },
  readAllBtn: {
    display: "flex", alignItems: "center", gap: "4px",
    background: "none", border: "none", cursor: "pointer",
    fontSize: "12px", color: "#2563eb", fontWeight: "500",
    fontFamily: "'DM Sans', sans-serif",
  },
  list: { maxHeight: "420px", overflowY: "auto" },
  centered: { display: "flex", justifyContent: "center", padding: "32px" },
  empty: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "10px", padding: "40px 20px",
  },
  emptyText: { fontSize: "13px", color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" },
  item: {
    display: "flex", alignItems: "flex-start", gap: "12px",
    padding: "14px 20px", cursor: "pointer",
    borderBottom: "1px solid #f8fafc",
    transition: "background 0.15s",
  },
  itemUnread: { background: "#fafbff" },
  itemIcon: {
    width: "32px", height: "32px", borderRadius: "8px",
    background: "#f1f5f9", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, marginTop: "2px",
  },
  itemContent: { flex: 1, minWidth: 0 },
  itemTitle: {
    fontSize: "13px", fontWeight: "600", color: "#1a1a2e",
    fontFamily: "'DM Sans', sans-serif",
  },
  itemMessage: {
    fontSize: "12px", color: "#64748b", marginTop: "2px",
    lineHeight: "1.5", fontFamily: "'DM Sans', sans-serif",
  },
  itemTime: {
    fontSize: "11px", color: "#94a3b8", marginTop: "4px",
    fontFamily: "'DM Sans', sans-serif",
  },
  unreadDot: {
    width: "8px", height: "8px", borderRadius: "50%",
    background: "#2563eb", flexShrink: 0, marginTop: "6px",
  },
};