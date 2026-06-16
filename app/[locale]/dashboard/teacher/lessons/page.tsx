"use client";

import { useEffect, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Calendar, Clock, User, BookOpen, Loader2, AlertCircle, Mail } from "lucide-react";
import api from "@/lib/api";
import { ApiResponse, PagedResponse, BookingRequestOutputDto } from "@/types";
import { BookingApi } from "@/constants/api-constants";

export default function TeacherLessonsPage() {
  const t = useTranslations("teacherLessons");
  const tCourse = useTranslations("courseCodes");
  const locale = useLocale();
  const [lessons, setLessons] = useState<BookingRequestOutputDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const PAGE_SIZE = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLessons = async (currentPage: number) => {
      try {
        const response = await api.get<ApiResponse<PagedResponse<BookingRequestOutputDto>>>(
          "api/Booking",
          { params: { bookingStatus: 2, nextDays: 10, page: currentPage, pagesize: PAGE_SIZE } }
        );
        if (!response.data.success || !response.data.data) {
          setError(response.data.message);
          return;
        }
        const paged = response.data.data;
        setLessons(paged.items);
        setTotalPages(paged.totalPages);
        setHasNext(paged.hasNext);
        setHasPrevious(paged.hasPrevious);
      } catch {
        setError(t("errorDefault"));
      } finally {
        setLoading(false);
      }
    };

    fetchLessons(page);
  }, [page]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-GB", {
      hour: "2-digit", minute: "2-digit",
    });
  };

  const getDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
    return `${diff} ${t("minutes")}`;
  };

  // Tarihe göre grupla
  const grouped = lessons.reduce<Record<string, BookingRequestOutputDto[]>>((acc, lesson) => {
    const key = lesson.courseStartDate
      ? new Date(lesson.courseStartDate).toDateString()
      : "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(lesson);
    return acc;
  }, {});

  return (
    <div style={styles.page}>
      {/* Başlık */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t("title")}</h1>
          <p style={styles.subtitle}>{t("subtitle")}</p>
        </div>
        <div style={styles.badge}>
          <Calendar size={15} color="#2563eb" />
          <span style={styles.badgeText}>{t("next10days")}</span>
        </div>
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
      {!loading && !error && lessons.length === 0 && (
        <div style={styles.emptyBox}>
          <BookOpen size={40} color="#cbd5e1" />
          <p style={styles.emptyText}>{t("empty")}</p>
        </div>
      )}

      {/* Ders listesi — tarihe göre gruplu */}
      {!loading && !error && Object.entries(grouped).map(([dateKey, items]) => (
        <div key={dateKey} style={styles.group}>
          <div style={styles.dateHeader}>
            <Calendar size={15} color="#64748b" />
            <span style={styles.dateLabel}>
              {new Date(dateKey).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </span>
            <span style={styles.dateCount}>{items.length} {t("lesson")}</span>
          </div>

          <div style={styles.cards}>
            {items.map((lesson) => (
              <div key={lesson.availabilityCourseSlotId} style={styles.card}>
                {/* Sol: ders bilgisi */}
                <div style={styles.cardLeft}>
                  <div style={styles.courseIconWrap}>
                    <BookOpen size={20} color="#2563eb" />
                  </div>
                  <div>
                    <p style={styles.courseName}>
                        {tCourse.has(lesson.courseCode) ? tCourse(lesson.courseCode) : lesson.courseName}
                    </p>
                  </div>
                </div>

                {/* Orta: saat & süre */}
                <div style={styles.cardMid}>
                  <div style={styles.timeRow}>
                    <Clock size={14} color="#64748b" />
                    <span style={styles.timeText}>
                      {formatTime(lesson.courseStartDate)} – {formatTime(lesson.courseEndDate)}
                    </span>
                  </div>
                  {getDuration(lesson.courseStartDate, lesson.courseEndDate) && (
                    <span style={styles.duration}>
                      {getDuration(lesson.courseStartDate, lesson.courseEndDate)}
                    </span>
                  )}
                </div>

                {/* Sağ: öğrenci */}
                <div style={styles.cardRight}>
                  <div style={styles.studentAvatar}>
                    {lesson.photo
                      ? <img src={lesson.photo} alt="" style={styles.avatarImg} />
                      : <span style={styles.avatarInitials}>
                          {lesson.firstName[0]}{lesson.lastName[0]}
                        </span>
                    }
                  </div>
                  <div>
                    <p style={styles.studentName}>{lesson.firstName} {lesson.lastName}</p>
                    <div style={styles.emailRow}>
                      <Mail size={12} color="#94a3b8" />
                      <span style={styles.emailText}>{lesson.email}</span>
                    </div>
                  </div>
                </div>

                {/* Status chip */}
                <div style={styles.statusChip}>
                  <span style={styles.statusDot} />
                  <span style={styles.statusText}>{t("scheduled")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {!loading && !error && totalPages > 1 && (
  <div style={styles.pagination}>
    <button
      onClick={() => setPage((p) => p - 1)}
      disabled={!hasPrevious}
      style={{ ...styles.pageBtn, ...(hasPrevious ? {} : styles.pageBtnDisabled) }}
    >
      ← {t("prev")}
    </button>
    <span style={styles.pageInfo}>
      {page} / {totalPages}
    </span>
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
  page: {
    display: "flex",
    flexDirection: "column",
    gap: "28px",
    maxWidth: "900px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: "26px",
    fontWeight: "400",
    color: "#1a1a2e",
    fontFamily: "'DM Serif Display', serif",
  },
  subtitle: {
    fontSize: "14px",
    color: "#64748b",
    marginTop: "4px",
  },
  badge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#eff6ff",
    border: "1px solid #bfdbfe",
    borderRadius: "20px",
    padding: "6px 14px",
  },
  badgeText: {
    fontSize: "13px",
    fontWeight: "500",
    color: "#2563eb",
  },
  centered: {
    display: "flex",
    justifyContent: "center",
    padding: "60px 0",
  },
  errorBox: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#fef2f2",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    padding: "14px 18px",
    color: "#dc2626",
    fontSize: "14px",
  },
  emptyBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "60px 0",
    color: "#94a3b8",
  },
  emptyText: {
    fontSize: "15px",
    color: "#94a3b8",
  },
  group: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  dateHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  dateLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
    textTransform: "capitalize",
    fontFamily: "'DM Sans', sans-serif",
  },
  dateCount: {
    fontSize: "12px",
    color: "#94a3b8",
    background: "#f1f5f9",
    borderRadius: "20px",
    padding: "2px 10px",
  },
  cards: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "14px",
    padding: "18px 24px",
  },
  cardLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flex: 1,
    minWidth: 0,
  },
  courseIconWrap: {
    width: "40px",
    height: "40px",
    background: "#eff6ff",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  courseName: {
    fontSize: "15px",
    fontWeight: "600",
    color: "#1a1a2e",
    fontFamily: "'DM Sans', sans-serif",
  },
  courseCode: {
    fontSize: "12px",
    color: "#94a3b8",
    marginTop: "2px",
    fontFamily: "'DM Sans', sans-serif",
  },
  cardMid: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    minWidth: "140px",
  },
  timeRow: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  timeText: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#374151",
    fontFamily: "'DM Sans', sans-serif",
  },
  duration: {
    fontSize: "12px",
    color: "#94a3b8",
  },
  cardRight: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    minWidth: "180px",
  },
  studentAvatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#dbeafe",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarInitials: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#1d4ed8",
    fontFamily: "'DM Sans', sans-serif",
  },
  studentName: {
    fontSize: "14px",
    fontWeight: "500",
    color: "#1a1a2e",
    fontFamily: "'DM Sans', sans-serif",
  },
  emailRow: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    marginTop: "2px",
  },
  emailText: {
    fontSize: "12px",
    color: "#94a3b8",
    fontFamily: "'DM Sans', sans-serif",
  },
  statusChip: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#f0fdf4",
    border: "1px solid #bbf7d0",
    borderRadius: "20px",
    padding: "4px 12px",
    flexShrink: 0,
  },
  statusDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#16a34a",
  },
  statusText: {
    fontSize: "12px",
    fontWeight: "500",
    color: "#16a34a",
    fontFamily: "'DM Sans', sans-serif",
  },
  pagination: {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  paddingTop: "8px",
},
pageBtn: {
  padding: "8px 20px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "#ffffff",
  fontSize: "14px",
  fontWeight: "500",
  color: "#374151",
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
},
pageBtnDisabled: {
  opacity: 0.4,
  cursor: "not-allowed",
},
pageInfo: {
  fontSize: "14px",
  color: "#64748b",
  fontFamily: "'DM Sans', sans-serif",
},
};