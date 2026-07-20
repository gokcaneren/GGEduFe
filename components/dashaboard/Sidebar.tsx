"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  CalendarCheck,
  GraduationCap,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpenCheck,
  UserCircle,
  Layout,
  Search
} from "lucide-react";
import { authService } from "@/lib/auth";
import { UserRole } from "@/types";
import { useRouter } from "next/navigation";

interface NavItem {
  key: string;
  href: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  role: UserRole;
  firstName: string;
  lastName: string;
}

export default function Sidebar({ role, firstName, lastName }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("sidebar");

  const isTeacher = role === 0;
  const base = `/${locale}/dashboard`;

  const teacherLinks: NavItem[] = [
    { key: "overview",  href: `${base}/teacher`,           icon: <LayoutDashboard size={20} /> },
    { key: "lessons",   href: `${base}/teacher/lessons`,   icon: <BookOpen size={20} /> },
    { key: "students",  href: `${base}/teacher/students`,  icon: <Users size={20} /> },
    { key: "bookings",  href: `${base}/teacher/bookings`,  icon: <CalendarCheck size={20} /> },
    { key: "courseTemplates",href: `${base}/teacher/course-templates`,  icon: <Layout size={20} /> },
    { key: "profile",   href: `${base}/teacher/profile`,   icon: <UserCircle size={20} /> },
    { key: "settings",  href: `${base}/teacher/settings`,  icon: <Settings size={20} /> },
  ];

  const studentLinks: NavItem[] = [
  { key: "overview",   href: `${base}/student`,           icon: <LayoutDashboard size={20} /> },
  { key: "search",     href: `${base}/student/search`,    icon: <Search size={20} /> }, 
  { key: "teachers",   href: `${base}/student/teachers`,  icon: <GraduationCap size={20} /> },
  { key: "mylessons",  href: `${base}/student/lessons`,   icon: <BookOpenCheck size={20} /> },
  { key: "settings",   href: `${base}/student/settings`,  icon: <Settings size={20} /> },
];

  const links = isTeacher ? teacherLinks : studentLinks;

  const handleLogout = () => {
    authService.logout();
    router.push(`/${locale}/login`);
  };

  const initials = firstName && lastName
  ? `${firstName[0]}${lastName[0]}`.toUpperCase()
  : "?";

  return (
    <aside style={{ ...styles.sidebar, width: collapsed ? "72px" : "240px" }}>
      {/* Logo */}
      <div style={styles.logoRow}>
        {!collapsed && (
          <div style={styles.logoText}>
            <BookOpen size={22} color="#2563eb" />
            <span style={styles.logoLabel}>EduFlow</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={styles.collapseBtn}
          title={collapsed ? t("expand") : t("collapse")}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav links */}
      <nav style={styles.nav}>
        {links.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.key}
              href={item.href}
              title={collapsed ? t(item.key) : undefined}
              style={{
                ...styles.navItem,
                ...(isActive ? styles.navItemActive : {}),
                justifyContent: collapsed ? "center" : "flex-start",
              }}
            >
              <span style={{ ...styles.navIcon, color: isActive ? "#2563eb" : "#64748b" }}>
                {item.icon}
              </span>
              {!collapsed && (
                <span style={{ ...styles.navLabel, color: isActive ? "#1e40af" : "#374151" }}>
                  {t(item.key)}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Alt kısım: kullanıcı + logout */}
      <div style={styles.bottom}>
        <div style={{ ...styles.userRow, justifyContent: collapsed ? "center" : "flex-start" }}>
          <div style={styles.avatar}>{initials}</div>
          {!collapsed && (
            <div style={styles.userInfo}>
              <span style={styles.userName}>{firstName} {lastName}</span>
              <span style={styles.userRole}>{isTeacher ? t("roleTeacher") : t("roleStudent")}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          title={collapsed ? t("logout") : undefined}
          style={{
            ...styles.logoutBtn,
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <LogOut size={18} color="#ef4444" />
          {!collapsed && <span style={styles.logoutLabel}>{t("logout")}</span>}
        </button>
      </div>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#ffffff",
    borderRight: "1px solid #e2e8f0",
    padding: "20px 12px",
    transition: "width 0.2s ease",
    position: "sticky",
    top: 0,
    flexShrink: 0,
    overflow: "hidden",
  },
  logoRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "32px",
    minHeight: "36px",
    paddingLeft: "4px",
  },
  logoText: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  logoLabel: {
    fontSize: "17px",
    fontWeight: "700",
    color: "#1e3a8a",
    letterSpacing: "-0.5px",
    fontFamily: "'DM Sans', sans-serif",
  },
  collapseBtn: {
    background: "#f1f5f9",
    border: "none",
    borderRadius: "8px",
    padding: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    color: "#64748b",
    flexShrink: 0,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  navItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "10px",
    textDecoration: "none",
    transition: "background 0.15s",
    whiteSpace: "nowrap",
  },
  navItemActive: {
    background: "#eff6ff",
  },
  navIcon: {
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
  },
  navLabel: {
    fontSize: "14px",
    fontWeight: "500",
    fontFamily: "'DM Sans', sans-serif",
  },
  bottom: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    borderTop: "1px solid #e2e8f0",
    paddingTop: "16px",
  },
  userRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "8px 4px",
  },
  avatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontSize: "13px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  userInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "1px",
    overflow: "hidden",
  },
  userName: {
    fontSize: "13px",
    fontWeight: "600",
    color: "#1a1a2e",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    fontFamily: "'DM Sans', sans-serif",
  },
  userRole: {
    fontSize: "11px",
    color: "#94a3b8",
    fontFamily: "'DM Sans', sans-serif",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "9px 12px",
    background: "none",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    width: "100%",
    transition: "background 0.15s",
    fontFamily: "'DM Sans', sans-serif",
  },
  logoutLabel: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#ef4444",
  },
};