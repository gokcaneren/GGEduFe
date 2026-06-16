"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { authService } from "@/lib/auth";
import { User } from "@/types";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const locale = useLocale();
  const pathname = usePathname();

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      router.push(`/${locale}/login`);
      return;
    }
    setUser(currentUser);
  }, [pathname]);

  if (!user) return null;

  return (
    <div style={styles.container}>
      <Sidebar
        role={user.role}
        firstName={user.firstName}
        lastName={user.lastName}
      />
      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    minHeight: "100vh",
    background: "#f8f7f4",
    fontFamily: "'DM Sans', sans-serif",
  },
  main: {
    flex: 1,
    padding: "32px 40px",
    overflowY: "auto",
  },
};