"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Users, Search, Loader2, AlertCircle, UserCircle2 } from "lucide-react";
import api from "@/lib/api";
import { ApiResponse, PagedResponse, SubscriberOutputDto } from "@/types";

const PAGE_SIZE = 10;

export default function TeacherStudentsPage() {
  const t = useTranslations("teacherStudents");
  const [students, setStudents] = useState<SubscriberOutputDto[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get<ApiResponse<PagedResponse<SubscriberOutputDto>>>(
          "/api/Subscription/1/subscribers",
          { params: { page, pageSize: PAGE_SIZE } }
        );
        if (!response.data.success || !response.data.data) {
          setStudents([]);
          return;
        }
        const paged = response.data.data;
        setStudents(paged.items);
        setTotalCount(paged.totalCount);
        setTotalPages(paged.totalPages);
        setHasNext(paged.hasNext);
        setHasPrevious(paged.hasPrevious);
      } catch {
        setError(t("errorDefault"));
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [page]);

  const filtered = students.filter((s) => {
    const full = `${s.firstName} ${s.lastName} ${s.displayName ?? ""}`.toLowerCase();
    return full.includes(search.toLowerCase());
  });

  const initials = (f: string, l: string) => `${f[0]}${l[0]}`.toUpperCase();

  return (
    <div style={styles.page}>
      {/* Başlık */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t("title")}</h1>
          <p style={styles.subtitle}>
            {t("totalStudents", { count: totalCount })}
          </p>
        </div>
      </div>

      {/* Arama */}
      <div style={styles.searchWrap}>
        <Search size={16} color="#94a3b8" style={styles.searchIcon} />
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Loading */}
      {loading && (
        <div style={styles.centered}>
          <Loader2 size={28} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* Hata */}
      {!loading && error && (
        <div style={styles.errorBox}>
          <AlertCircle size={18} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}

      {/* Boş */}
      {!loading && !error && students.length === 0 && (
        <div style={styles.emptyBox}>
          <Users size={40} color="#cbd5e1" />
          <p style={styles.emptyText}>{t("empty")}</p>
        </div>
      )}

      {/* Liste */}
      {!loading && !error && filtered.length > 0 && (
        <div style={styles.grid}>
          {filtered.map((student) => (
            <div key={student.studentId} style={styles.card}>
              {/* Avatar */}
              <div style={styles.avatarWrap}>
                {student.photo ? (
                  <img src={student.photo} alt="" style={styles.avatarImg} />
                ) : (
                  <span style={styles.avatarInitials}>
                    {initials(student.firstName, student.lastName)}
                  </span>
                )}
              </div>

              {/* Bilgi */}
              <div style={styles.info}>
                <p style={styles.name}>
                  {student.firstName} {student.lastName}
                </p>
                {student.displayName && (
                  <p style={styles.displayName}>@{student.displayName}</p>
                )}
              </div>

              {/* Profil butonu */}
              <button style={styles.profileBtn} title={t("viewProfile")}>
                <UserCircle2 size={18} color="#64748b" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Arama sonucu boş ama liste doluysa */}
      {!loading && !error && students.length > 0 && filtered.length === 0 && (
        <div style={styles.emptyBox}>
          <Search size={32} color="#cbd5e1" />
          <p style={styles.emptyText}>{t("noResults")}</p>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrevious}
            style={{ ...styles.pageBtn, ...(hasPrevious ? {} : styles.pageBtnDisabled) }}
          >
            ← {t("prev")}
          </button>
          <span style={styles.pageInfo}>{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext}
            style={{ ...styles.pageBtn, ...(hasNext ? {} : styles.pageBtnDisabled) }}
          >
            {t("next")} →
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: "24px", maxWidth: "900px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: "26px", fontWeight: "400", color: "#1a1a2e", fontFamily: "'DM Serif Display', serif" },
  subtitle: { fontSize: "14px", color: "#64748b", marginTop: "4px" },
  searchWrap: {
    position: "relative",
    maxWidth: "360px",
  },
  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
  },
  searchInput: {
    width: "100%",
    padding: "10px 16px 10px 40px",
    border: "1.5px solid #e2e8f0",
    borderRadius: "10px",
    fontSize: "14px",
    color: "#1a1a2e",
    background: "#ffffff",
    outline: "none",
    fontFamily: "'DM Sans', sans-serif",
  },
  centered: { display: "flex", justifyContent: "center", padding: "60px 0" },
  errorBox: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "14px 18px", color: "#dc2626", fontSize: "14px",
  },
  emptyBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "60px 0" },
  emptyText: { fontSize: "15px", color: "#94a3b8" },
  grid: { display: "flex", flexDirection: "column", gap: "8px" },
  card: {
    display: "flex", alignItems: "center", gap: "16px",
    background: "#ffffff", border: "1px solid #e2e8f0",
    borderRadius: "14px", padding: "16px 20px",
  },
  avatarWrap: {
    width: "44px", height: "44px", borderRadius: "50%",
    background: "#dbeafe", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitials: { fontSize: "14px", fontWeight: "700", color: "#1d4ed8", fontFamily: "'DM Sans', sans-serif" },
  info: { flex: 1 },
  name: { fontSize: "15px", fontWeight: "600", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" },
  displayName: { fontSize: "13px", color: "#94a3b8", marginTop: "2px", fontFamily: "'DM Sans', sans-serif" },
  profileBtn: {
    background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px",
    padding: "8px", cursor: "pointer", display: "flex", alignItems: "center",
  },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", paddingTop: "8px" },
  pageBtn: {
    padding: "8px 20px", borderRadius: "8px", border: "1px solid #e2e8f0",
    background: "#ffffff", fontSize: "14px", fontWeight: "500", color: "#374151",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  pageBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  pageInfo: { fontSize: "14px", color: "#64748b", fontFamily: "'DM Sans', sans-serif" },
};