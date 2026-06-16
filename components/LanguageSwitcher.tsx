"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { routing } from "@/i18n/routing";

const localeLabels: Record<string, string> = {
  tr: "TR",
  en: "EN",
};

const localeFlags: Record<string, string> = {
  tr: "🇹🇷",
  en: "🇬🇧",
};

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleSwitch = (newLocale: string) => {
    // Mevcut path'teki locale prefix'ini değiştir
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  };

  return (
    <div style={styles.wrapper}>
      {routing.locales.map((loc) => (
        <button
          key={loc}
          onClick={() => handleSwitch(loc)}
          style={{
            ...styles.btn,
            ...(loc === locale ? styles.btnActive : styles.btnInactive),
          }}
          title={loc === "tr" ? "Türkçe" : "English"}
        >
          <span style={styles.flag}>{localeFlags[loc]}</span>
          <span style={styles.label}>{localeLabels[loc]}</span>
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    background: "rgba(255,255,255,0.15)",
    borderRadius: "10px",
    padding: "4px",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    padding: "5px 10px",
    border: "none",
    borderRadius: "7px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
  btnActive: {
    background: "rgba(255,255,255,0.95)",
    color: "#1e3a8a",
  },
  btnInactive: {
    background: "transparent",
    color: "rgba(255,255,255,0.75)",
  },
  flag: {
    fontSize: "14px",
    lineHeight: 1,
  },
  label: {
    letterSpacing: "0.5px",
  },
};
