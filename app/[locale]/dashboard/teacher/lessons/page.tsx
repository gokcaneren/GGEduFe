"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Calendar, Clock, BookOpen, Loader2,
  AlertCircle, Mail, Check, X,
} from "lucide-react";
import api from "@/lib/api";
import { ApiResponse, PagedResponse, BookingRequestOutputDto } from "@/types";

const PAGE_SIZE = 10;
type Tab = "scheduled" | "requests";

interface DecideState {
  loading: boolean;
  result: "accepted" | "rejected" | null;
}

export default function TeacherLessonsPage() {
  const t = useTranslations("teacherLessons");
  const tCourse = useTranslations("courseCodes");
  const locale = useLocale();

  const [activeTab, setActiveTab] = useState<Tab>("scheduled");

  // ── Scheduled state ──
  const [lessons, setLessons] = useState<BookingRequestOutputDto[]>([]);
  const [lessonPage, setLessonPage] = useState(1);
  const [lessonTotalPages, setLessonTotalPages] = useState(1);
  const [lessonHasNext, setLessonHasNext] = useState(false);
  const [lessonHasPrev, setLessonHasPrev] = useState(false);
  const [lessonLoading, setLessonLoading] = useState(true);
  const [lessonError, setLessonError] = useState("");

  // ── Requests state ──
  const [requests, setRequests] = useState<BookingRequestOutputDto[]>([]);
  const [reqPage, setReqPage] = useState(1);
  const [reqTotalPages, setReqTotalPages] = useState(1);
  const [reqTotalCount, setReqTotalCount] = useState(0);
  const [reqHasNext, setReqHasNext] = useState(false);
  const [reqHasPrev, setReqHasPrev] = useState(false);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqError, setReqError] = useState("");

  // ── Decide state ──
  const [decideStates, setDecideStates] = useState<Record<string, DecideState>>({});

  // ── Fetch scheduled (status=2) ──
  const fetchLessons = useCallback(async (page: number) => {
    setLessonLoading(true);
    setLessonError("");
    try {
      const res = await api.get<ApiResponse<PagedResponse<BookingRequestOutputDto>>>(
        "/api/Booking",
        { params: { bookingStatus: 2, nextDays: 10, page, pageSize: PAGE_SIZE } }
      );
      if (!res.data.success || !res.data.data) {
        setLessons([]);
        return;
      }
      const paged = res.data.data;
      setLessons(paged.items);
      setLessonTotalPages(paged.totalPages);
      setLessonHasNext(paged.hasNext);
      setLessonHasPrev(paged.hasPrevious);
    } catch {
      setLessonError(t("errorDefault"));
    } finally {
      setLessonLoading(false);
    }
  }, [t]);

  // ── Fetch pending requests (status=0) ──
  const fetchRequests = useCallback(async (page: number) => {
    setReqLoading(true);
    setReqError("");
    try {
      const res = await api.get<ApiResponse<PagedResponse<BookingRequestOutputDto>>>(
        "/api/Booking",
        { params: { bookingStatus: 0, page, pageSize: PAGE_SIZE } }
      );
      if (!res.data.success || !res.data.data) {
        setRequests([]);
        setReqTotalCount(0);
        return;
      }
      const paged = res.data.data;
      setRequests(paged.items);
      setReqTotalCount(paged.totalCount);
      setReqTotalPages(paged.totalPages);
      setReqHasNext(paged.hasNext);
      setReqHasPrev(paged.hasPrevious);
    } catch {
      setReqError(t("errorDefault"));
    } finally {
      setReqLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchLessons(lessonPage); }, [lessonPage]);
  useEffect(() => { fetchRequests(reqPage); }, [reqPage]);

  // ── Decide ──
  const handleDecide = async (booking: BookingRequestOutputDto, isAccepted: boolean) => {
    setDecideStates((prev) => ({
      ...prev,
      [booking.id]: { loading: true, result: null },
    }));

    try {
      const res = await api.post<ApiResponse<boolean>>("/api/Booking/decide", {
        id: booking.id,
        studentId: booking.studentId,
        isAccepted,
      });

      if (!res.data.success) {
        setDecideStates((prev) => ({
          ...prev,
          [booking.id]: { loading: false, result: null },
        }));
        return;
      }

      setDecideStates((prev) => ({
        ...prev,
        [booking.id]: { loading: false, result: isAccepted ? "accepted" : "rejected" },
      }));

      setTimeout(() => {
        setRequests((prev) => prev.filter((r) => r.id !== booking.id));
        setReqTotalCount((c) => c - 1);
        setDecideStates((prev) => {
          const next = { ...prev };
          delete next[booking.id];
          return next;
        });
        if (isAccepted) fetchLessons(lessonPage);
      }, 1500);

    } catch {
      setDecideStates((prev) => ({
        ...prev,
        [booking.id]: { loading: false, result: null },
      }));
    }
  };

  // ── Helpers ──
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString(
      locale === "tr" ? "tr-TR" : "en-GB",
      { day: "numeric", month: "long", year: "numeric" }
    );
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleTimeString(
      locale === "tr" ? "tr-TR" : "en-GB",
      { hour: "2-digit", minute: "2-digit" }
    );
  };

  const getDuration = (start: string | null, end: string | null) => {
    if (!start || !end) return null;
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / 60000;
    return `${diff} ${t("minutes")}`;
  };

  const grouped = lessons.reduce<Record<string, BookingRequestOutputDto[]>>((acc, lesson) => {
    const key = lesson.courseStartDate
      ? new Date(lesson.courseStartDate).toDateString()
      : "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(lesson);
    return acc;
  }, {});

  const initials = (f: string, l: string) =>
    `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

  // ════════════════════════════════════════════════════════
  return (
    <div style={styles.page}>
      {/* Başlık */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t("title")}</h1>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === "scheduled" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("scheduled")}
        >
          <Calendar size={15} />
          {t("tabScheduled")}
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "requests" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("requests")}
        >
          <BookOpen size={15} />
          {t("tabRequests")}
          {reqTotalCount > 0 && (
            <span style={{
              ...styles.tabBadge,
              ...(activeTab === "requests" ? styles.tabBadgeActive : styles.tabBadgeWarning),
            }}>
              {reqTotalCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Scheduled Tab ── */}
      {activeTab === "scheduled" && (
        <div style={styles.tabContent}>
          {lessonLoading && (
            <div style={styles.centered}>
              <Loader2 size={28} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}

          {!lessonLoading && lessonError && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} color="#dc2626" />
              <span>{lessonError}</span>
            </div>
          )}

          {!lessonLoading && !lessonError && lessons.length === 0 && (
            <div style={styles.emptyBox}>
              <BookOpen size={40} color="#cbd5e1" />
              <p style={styles.emptyText}>{t("empty")}</p>
            </div>
          )}

          {!lessonLoading && !lessonError && Object.entries(grouped).map(([dateKey, items]) => (
            <div key={dateKey} style={styles.group}>
              <div style={styles.dateHeader}>
                <Calendar size={14} color="#64748b" />
                <span style={styles.dateLabel}>
                  {new Date(dateKey).toLocaleDateString(
                    locale === "tr" ? "tr-TR" : "en-GB",
                    { weekday: "long", day: "numeric", month: "long" }
                  )}
                </span>
                <span style={styles.dateCount}>{items.length} {t("lesson")}</span>
              </div>

              <div style={styles.cards}>
                {items.map((lesson) => (
                  <div key={lesson.availabilityCourseSlotId} style={styles.card}>
                    {/* Sol: ders */}
                    <div style={styles.cardLeft}>
                      <div style={styles.courseIconWrap}>
                        <BookOpen size={19} color="#2563eb" />
                      </div>
                      <p style={styles.courseName}>
                        {tCourse.has(lesson.courseCode) ? tCourse(lesson.courseCode) : lesson.courseName}
                      </p>
                    </div>

                    {/* Orta: saat */}
                    <div style={styles.cardMid}>
                      <div style={styles.timeRow}>
                        <Clock size={13} color="#64748b" />
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
                              {initials(lesson.firstName, lesson.lastName)}
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

                    {/* Status */}
                    <div style={styles.statusChip}>
                      <span style={styles.statusDot} />
                      <span style={styles.statusText}>{t("scheduled")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {!lessonLoading && lessonTotalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setLessonPage((p) => p - 1)}
                disabled={!lessonHasPrev}
                style={{ ...styles.pageBtn, ...(!lessonHasPrev ? styles.pageBtnDisabled : {}) }}
              >
                ← {t("prev")}
              </button>
              <span style={styles.pageInfo}>{lessonPage} / {lessonTotalPages}</span>
              <button
                onClick={() => setLessonPage((p) => p + 1)}
                disabled={!lessonHasNext}
                style={{ ...styles.pageBtn, ...(!lessonHasNext ? styles.pageBtnDisabled : {}) }}
              >
                {t("next")} →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Requests Tab ── */}
      {activeTab === "requests" && (
        <div style={styles.tabContent}>
          {reqLoading && (
            <div style={styles.centered}>
              <Loader2 size={28} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}

          {!reqLoading && reqError && (
            <div style={styles.errorBox}>
              <AlertCircle size={16} color="#dc2626" />
              <span>{reqError}</span>
            </div>
          )}

          {!reqLoading && !reqError && requests.length === 0 && (
            <div style={styles.emptyBox}>
              <BookOpen size={40} color="#cbd5e1" />
              <p style={styles.emptyText}>{t("emptyRequests")}</p>
            </div>
          )}

          {!reqLoading && !reqError && requests.length > 0 && (
            <div style={styles.cards}>
              {requests.map((req) => {
                const decide = decideStates[req.id];
                const isDeciding = decide?.loading;
                const result = decide?.result;

                return (
                  <div key={req.id} style={{
                    ...styles.card,
                    ...(result === "accepted" ? styles.cardAccepted : {}),
                    ...(result === "rejected" ? styles.cardRejected : {}),
                  }}>
                    {/* Sol: ders */}
                    <div style={styles.cardLeft}>
                      <div style={styles.courseIconWrap}>
                        <BookOpen size={19} color="#2563eb" />
                      </div>
                      <div>
                        <p style={styles.courseName}>
                          {tCourse.has(req.courseCode) ? tCourse(req.courseCode) : req.courseName}
                        </p>
                        <div style={styles.timeRow}>
                          <Clock size={12} color="#94a3b8" />
                          <span style={{ ...styles.duration, marginTop: 0 }}>
                            {formatDate(req.courseStartDate)} · {formatTime(req.courseStartDate)} – {formatTime(req.courseEndDate)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Orta: öğrenci */}
                    <div style={styles.cardRight}>
                      <div style={styles.studentAvatar}>
                        {req.photo
                          ? <img src={req.photo} alt="" style={styles.avatarImg} />
                          : <span style={styles.avatarInitials}>
                              {initials(req.firstName, req.lastName)}
                            </span>
                        }
                      </div>
                      <div>
                        <p style={styles.studentName}>{req.firstName} {req.lastName}</p>
                        <div style={styles.emailRow}>
                          <Mail size={12} color="#94a3b8" />
                          <span style={styles.emailText}>{req.email}</span>
                        </div>
                      </div>
                    </div>

                    {/* Sağ: karar veya sonuç */}
                    {result ? (
                      <div style={{
                        ...styles.resultChip,
                        ...(result === "accepted" ? styles.resultAccepted : styles.resultRejected),
                      }}>
                        {result === "accepted"
                          ? <><Check size={13} />{t("accepted")}</>
                          : <><X size={13} />{t("rejected")}</>
                        }
                      </div>
                    ) : (
                      <div style={styles.decideRow}>
                        <button
                          style={styles.acceptBtn}
                          disabled={isDeciding}
                          onClick={() => handleDecide(req, true)}
                        >
                          {isDeciding
                            ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
                            : <Check size={14} />
                          }
                          {t("accept")}
                        </button>
                        <button
                          style={styles.rejectBtn}
                          disabled={isDeciding}
                          onClick={() => handleDecide(req, false)}
                        >
                          <X size={14} />
                          {t("reject")}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!reqLoading && reqTotalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setReqPage((p) => p - 1)}
                disabled={!reqHasPrev}
                style={{ ...styles.pageBtn, ...(!reqHasPrev ? styles.pageBtnDisabled : {}) }}
              >
                ← {t("prev")}
              </button>
              <span style={styles.pageInfo}>{reqPage} / {reqTotalPages}</span>
              <button
                onClick={() => setReqPage((p) => p + 1)}
                disabled={!reqHasNext}
                style={{ ...styles.pageBtn, ...(!reqHasNext ? styles.pageBtnDisabled : {}) }}
              >
                {t("next")} →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: "20px", maxWidth: "900px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: "26px", fontWeight: "400", color: "#1a1a2e", fontFamily: "'DM Serif Display', serif" },
  tabs: {
    display: "flex", gap: "4px",
    background: "#f1f5f9", borderRadius: "12px", padding: "4px", width: "fit-content",
  },
  tab: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "8px 18px", borderRadius: "9px", border: "none",
    background: "transparent", color: "#64748b", fontSize: "14px",
    fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
  tabActive: { background: "#ffffff", color: "#1a1a2e", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  tabBadge: { background: "#e2e8f0", color: "#64748b", borderRadius: "20px", padding: "1px 8px", fontSize: "12px", fontWeight: "600" },
  tabBadgeActive: { background: "#dbeafe", color: "#2563eb" },
  tabBadgeWarning: { background: "#fef3c7", color: "#d97706" },
  tabContent: { display: "flex", flexDirection: "column", gap: "20px" },
  centered: { display: "flex", justifyContent: "center", padding: "60px 0" },
  errorBox: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "14px 18px", color: "#dc2626", fontSize: "14px",
  },
  emptyBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "60px 0" },
  emptyText: { fontSize: "15px", color: "#94a3b8" },
  group: { display: "flex", flexDirection: "column", gap: "10px" },
  dateHeader: { display: "flex", alignItems: "center", gap: "8px" },
  dateLabel: { fontSize: "14px", fontWeight: "600", color: "#374151", textTransform: "capitalize", fontFamily: "'DM Sans', sans-serif" },
  dateCount: { fontSize: "12px", color: "#94a3b8", background: "#f1f5f9", borderRadius: "20px", padding: "2px 10px" },
  cards: { display: "flex", flexDirection: "column", gap: "8px" },
  card: {
    display: "flex", alignItems: "center", gap: "20px",
    background: "#ffffff", border: "1px solid #e2e8f0",
    borderRadius: "14px", padding: "16px 20px",
    transition: "border-color 0.2s",
  },
  cardAccepted: { border: "1px solid #bbf7d0", background: "#f0fdf4" },
  cardRejected: { border: "1px solid #fecaca", background: "#fef2f2" },
  cardLeft: { display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 },
  courseIconWrap: {
    width: "38px", height: "38px", background: "#eff6ff", borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  courseName: { fontSize: "14px", fontWeight: "600", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" },
  cardMid: { display: "flex", flexDirection: "column", gap: "4px", minWidth: "150px" },
  timeRow: { display: "flex", alignItems: "center", gap: "5px" },
  timeText: { fontSize: "13px", fontWeight: "500", color: "#374151", fontFamily: "'DM Sans', sans-serif" },
  duration: { fontSize: "12px", color: "#94a3b8", marginTop: "2px" },
  cardRight: { display: "flex", alignItems: "center", gap: "10px", minWidth: "160px" },
  studentAvatar: {
    width: "34px", height: "34px", borderRadius: "50%", background: "#dbeafe",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitials: { fontSize: "11px", fontWeight: "700", color: "#1d4ed8", fontFamily: "'DM Sans', sans-serif" },
  studentName: { fontSize: "13px", fontWeight: "500", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" },
  emailRow: { display: "flex", alignItems: "center", gap: "4px", marginTop: "2px" },
  emailText: { fontSize: "11px", color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" },
  statusChip: {
    display: "flex", alignItems: "center", gap: "5px",
    background: "#f0fdf4", border: "1px solid #bbf7d0",
    borderRadius: "20px", padding: "4px 12px", flexShrink: 0,
  },
  statusDot: { width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a" },
  statusText: { fontSize: "12px", fontWeight: "500", color: "#16a34a", fontFamily: "'DM Sans', sans-serif" },
  decideRow: { display: "flex", gap: "8px", flexShrink: 0 },
  acceptBtn: {
    display: "flex", alignItems: "center", gap: "5px",
    padding: "7px 14px", background: "#2563eb", color: "#ffffff",
    border: "none", borderRadius: "8px", fontSize: "13px",
    fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  rejectBtn: {
    display: "flex", alignItems: "center", gap: "5px",
    padding: "7px 14px", background: "#ffffff", color: "#ef4444",
    border: "1px solid #fecaca", borderRadius: "8px", fontSize: "13px",
    fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  resultChip: {
    display: "flex", alignItems: "center", gap: "5px",
    borderRadius: "20px", padding: "5px 12px", fontSize: "12px",
    fontWeight: "500", flexShrink: 0, fontFamily: "'DM Sans', sans-serif",
  },
  resultAccepted: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
  resultRejected: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" },
  pageBtn: {
    padding: "8px 20px", borderRadius: "8px", border: "1px solid #e2e8f0",
    background: "#ffffff", fontSize: "14px", fontWeight: "500",
    color: "#374151", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  pageBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  pageInfo: { fontSize: "14px", color: "#64748b", fontFamily: "'DM Sans', sans-serif" },
};