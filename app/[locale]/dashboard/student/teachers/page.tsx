"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import {
  GraduationCap, Loader2, AlertCircle,
  ChevronRight, Clock, Users, BookOpen,
  BadgeDollarSign,
} from "lucide-react";
import api from "@/lib/api";
import { ApiResponse, PagedResponse, SubbedTeacherDetailOutputDto } from "@/types";

const PAGE_SIZE = 10;
type Tab = "following" | "pending";

const CURRENCY_LABELS: Record<number, string> = {
  0: "TRY", 1: "USD", 2: "EUR", 3: "CNY", 4: "KRW", 5: "JPY",
};

export default function StudentTeachersPage() {
  const t = useTranslations("studentTeachers");
  const tCourse = useTranslations("courseCodes");
  const locale = useLocale();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("following");

  // ── Following state (status=1) ──
  const [following, setFollowing] = useState<SubbedTeacherDetailOutputDto[]>([]);
  const [followPage, setFollowPage] = useState(1);
  const [followTotalPages, setFollowTotalPages] = useState(1);
  const [followTotalCount, setFollowTotalCount] = useState(0);
  const [followHasNext, setFollowHasNext] = useState(false);
  const [followHasPrev, setFollowHasPrev] = useState(false);
  const [followLoading, setFollowLoading] = useState(true);
  const [followError, setFollowError] = useState("");

  // ── Pending state (status=0) ──
  const [pending, setPending] = useState<SubbedTeacherDetailOutputDto[]>([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [pendingTotalCount, setPendingTotalCount] = useState(0);
  const [pendingHasNext, setPendingHasNext] = useState(false);
  const [pendingHasPrev, setPendingHasPrev] = useState(false);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState("");

  const fetchTeachers = useCallback(async (
    status: 0 | 1,
    page: number,
  ) => {
    const isFollowing = status === 1;
    if (isFollowing) {
      setFollowLoading(true);
      setFollowError("");
    } else {
      setPendingLoading(true);
      setPendingError("");
    }

    try {
      const res = await api.get<ApiResponse<PagedResponse<SubbedTeacherDetailOutputDto>>>(
        `/api/Subscription/subbed/${status}/teachers`,
        { params: { page, pageSize: PAGE_SIZE } }
      );

      if (!res.data.success || !res.data.data) {
        if (isFollowing) { setFollowing([]); setFollowTotalCount(0); }
        else { setPending([]); setPendingTotalCount(0); }
        return;
      }

      const paged = res.data.data;

      if (isFollowing) {
        setFollowing(paged.items);
        setFollowTotalCount(paged.totalCount);
        setFollowTotalPages(paged.totalPages);
        setFollowHasNext(paged.hasNext);
        setFollowHasPrev(paged.hasPrevious);
      } else {
        setPending(paged.items);
        setPendingTotalCount(paged.totalCount);
        setPendingTotalPages(paged.totalPages);
        setPendingHasNext(paged.hasNext);
        setPendingHasPrev(paged.hasPrevious);
      }
    } catch {
      if (isFollowing) setFollowError(t("errorDefault"));
      else setPendingError(t("errorDefault"));
    } finally {
      if (isFollowing) setFollowLoading(false);
      else setPendingLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchTeachers(1, followPage); }, [followPage]);
  useEffect(() => { fetchTeachers(0, pendingPage); }, [pendingPage]);

  const initials = (f: string, l: string) =>
    `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

  const renderTeacherCard = (
    teacher: SubbedTeacherDetailOutputDto,
    showGoToLesson: boolean
  ) => (
    <div key={teacher.teacherId} style={styles.card}>
      {/* Sol: profil */}
      <div style={styles.cardLeft}>
        <div style={styles.avatar}>
          {teacher.photo
            ? <img src={teacher.photo} alt="" style={styles.avatarImg} />
            : <span style={styles.avatarInitials}>
                {initials(teacher.firstName, teacher.lastName)}
              </span>
          }
        </div>
        <div>
          <p style={styles.name}>
            {teacher.displayName ?? `${teacher.firstName} ${teacher.lastName}`}
          </p>
          {teacher.displayName && (
            <p style={styles.subName}>
              {teacher.firstName} {teacher.lastName}
            </p>
          )}
        </div>
      </div>

      {/* Orta: kurslar */}
      <div style={styles.cardMid}>
        <p style={styles.coursesLabel}>{t("courses")}</p>
        {!teacher.teacherCourses || teacher.teacherCourses.length === 0 ? (
          <p style={styles.emptyText}>{t("noCourses")}</p>
        ) : (
          <div style={styles.courseChips}>
            {teacher.teacherCourses.map((c) => (
              <div key={c.id} style={styles.courseChip}>
                <BookOpen size={12} color="#2563eb" />
                <span style={styles.courseChipName}>
                  {tCourse.has(c.code) ? tCourse(c.code) : c.name}
                </span>
                <div style={styles.courseChipPrice}>
                  <BadgeDollarSign size={11} color="#16a34a" />
                  <span style={styles.priceText}>
                    {c.price.toFixed(2)} {CURRENCY_LABELS[c.currency]}
                  </span>
                </div>
                <div style={styles.courseChipDuration}>
                  <Clock size={11} color="#94a3b8" />
                  <span style={styles.durationText}>
                    {c.durationMinutes} {t("minutes")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sağ: aksiyon */}
      <div style={styles.cardRight}>
        {showGoToLesson ? (
          <button
            style={styles.goBtn}
            onClick={() => router.push(
              `/${locale}/dashboard/student/teachers/${teacher.teacherId}`
            )}
          >
            {t("goToLesson")}
            <ChevronRight size={15} />
          </button>
        ) : (
          <div style={styles.pendingChip}>
            <Clock size={13} color="#d97706" />
            <span style={styles.pendingText}>
              {t("tabPending")}
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={styles.page}>
      {/* Başlık */}
      <h1 style={styles.title}>{t("title")}</h1>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === "following" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("following")}
        >
          <GraduationCap size={15} />
          {t("tabFollowing")}
          {followTotalCount > 0 && (
            <span style={{
              ...styles.tabBadge,
              ...(activeTab === "following" ? styles.tabBadgeActive : {}),
            }}>
              {followTotalCount}
            </span>
          )}
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "pending" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("pending")}
        >
          <Users size={15} />
          {t("tabPending")}
          {pendingTotalCount > 0 && (
            <span style={{
              ...styles.tabBadge,
              ...(activeTab === "pending" ? styles.tabBadgeActive : styles.tabBadgeWarning),
            }}>
              {pendingTotalCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Following Tab ── */}
      {activeTab === "following" && (
        <div style={styles.tabContent}>
          {followLoading && (
            <div style={styles.centered}>
              <Loader2 size={26} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}
          {!followLoading && followError && (
            <div style={styles.errorBox}>
              <AlertCircle size={15} color="#dc2626" />
              <span>{followError}</span>
            </div>
          )}
          {!followLoading && !followError && following.length === 0 && (
            <div style={styles.emptyBox}>
              <GraduationCap size={38} color="#cbd5e1" />
              <p style={styles.emptyText}>{t("emptyFollowing")}</p>
            </div>
          )}
          {!followLoading && !followError && following.length > 0 && (
            <div style={styles.list}>
              {following.map((teacher) => renderTeacherCard(teacher, true))}
            </div>
          )}
          {!followLoading && followTotalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setFollowPage((p) => p - 1)}
                disabled={!followHasPrev}
                style={{ ...styles.pageBtn, ...(!followHasPrev ? styles.pageBtnDisabled : {}) }}
              >
                ← {t("prev")}
              </button>
              <span style={styles.pageInfo}>{followPage} / {followTotalPages}</span>
              <button
                onClick={() => setFollowPage((p) => p + 1)}
                disabled={!followHasNext}
                style={{ ...styles.pageBtn, ...(!followHasNext ? styles.pageBtnDisabled : {}) }}
              >
                {t("next")} →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Pending Tab ── */}
      {activeTab === "pending" && (
        <div style={styles.tabContent}>
          {pendingLoading && (
            <div style={styles.centered}>
              <Loader2 size={26} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          )}
          {!pendingLoading && pendingError && (
            <div style={styles.errorBox}>
              <AlertCircle size={15} color="#dc2626" />
              <span>{pendingError}</span>
            </div>
          )}
          {!pendingLoading && !pendingError && pending.length === 0 && (
            <div style={styles.emptyBox}>
              <Users size={38} color="#cbd5e1" />
              <p style={styles.emptyText}>{t("emptyPending")}</p>
            </div>
          )}
          {!pendingLoading && !pendingError && pending.length > 0 && (
            <div style={styles.list}>
              {pending.map((teacher) => renderTeacherCard(teacher, false))}
            </div>
          )}
          {!pendingLoading && pendingTotalPages > 1 && (
            <div style={styles.pagination}>
              <button
                onClick={() => setPendingPage((p) => p - 1)}
                disabled={!pendingHasPrev}
                style={{ ...styles.pageBtn, ...(!pendingHasPrev ? styles.pageBtnDisabled : {}) }}
              >
                ← {t("prev")}
              </button>
              <span style={styles.pageInfo}>{pendingPage} / {pendingTotalPages}</span>
              <button
                onClick={() => setPendingPage((p) => p + 1)}
                disabled={!pendingHasNext}
                style={{ ...styles.pageBtn, ...(!pendingHasNext ? styles.pageBtnDisabled : {}) }}
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
  title: { fontSize: "26px", fontWeight: "400", color: "#1a1a2e", fontFamily: "'DM Serif Display', serif" },
  tabs: {
    display: "flex", gap: "4px",
    background: "#f1f5f9", borderRadius: "12px",
    padding: "4px", width: "fit-content",
  },
  tab: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "8px 18px", borderRadius: "9px", border: "none",
    background: "transparent", color: "#64748b", fontSize: "14px",
    fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
  tabActive: { background: "#ffffff", color: "#1a1a2e", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" },
  tabBadge: {
    background: "#e2e8f0", color: "#64748b",
    borderRadius: "20px", padding: "1px 8px",
    fontSize: "12px", fontWeight: "600",
  },
  tabBadgeActive: { background: "#dbeafe", color: "#2563eb" },
  tabBadgeWarning: { background: "#fef3c7", color: "#d97706" },
  tabContent: { display: "flex", flexDirection: "column", gap: "12px" },
  centered: { display: "flex", justifyContent: "center", padding: "48px 0" },
  errorBox: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "14px",
  },
  emptyBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "48px 0" },
  emptyText: { fontSize: "14px", color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" },
  list: { display: "flex", flexDirection: "column", gap: "10px" },
  card: {
    display: "flex", alignItems: "flex-start", gap: "20px",
    background: "#ffffff", border: "1px solid #e2e8f0",
    borderRadius: "14px", padding: "18px 22px",
  },
  cardLeft: { display: "flex", alignItems: "center", gap: "12px", minWidth: "160px", flexShrink: 0 },
  avatar: {
    width: "44px", height: "44px", borderRadius: "50%",
    background: "#dbeafe", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitials: { fontSize: "14px", fontWeight: "700", color: "#1d4ed8", fontFamily: "'DM Sans', sans-serif" },
  name: { fontSize: "15px", fontWeight: "600", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" },
  subName: { fontSize: "12px", color: "#94a3b8", marginTop: "2px", fontFamily: "'DM Sans', sans-serif" },
  cardMid: { flex: 1, display: "flex", flexDirection: "column", gap: "8px" },
  coursesLabel: { fontSize: "12px", fontWeight: "500", color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" },
  courseChips: { display: "flex", flexDirection: "column", gap: "6px" },
  courseChip: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "#f8fafc", border: "1px solid #f1f5f9",
    borderRadius: "8px", padding: "6px 10px", flexWrap: "wrap",
  },
  courseChipName: { fontSize: "13px", fontWeight: "500", color: "#374151", fontFamily: "'DM Sans', sans-serif", flex: 1 },
  courseChipPrice: { display: "flex", alignItems: "center", gap: "3px" },
  priceText: { fontSize: "12px", fontWeight: "600", color: "#16a34a", fontFamily: "'DM Sans', sans-serif" },
  courseChipDuration: { display: "flex", alignItems: "center", gap: "3px" },
  durationText: { fontSize: "12px", color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" },
  cardRight: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px", flexShrink: 0 },
  goBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "8px 16px", background: "#2563eb", color: "#ffffff",
    border: "none", borderRadius: "8px", fontSize: "13px",
    fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  pendingChip: {
    display: "flex", alignItems: "center", gap: "5px",
    background: "#fffbeb", border: "1px solid #fde68a",
    borderRadius: "20px", padding: "5px 12px",
  },
  pendingText: { fontSize: "12px", fontWeight: "500", color: "#d97706", fontFamily: "'DM Sans', sans-serif" },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" },
  pageBtn: {
    padding: "8px 20px", borderRadius: "8px", border: "1px solid #e2e8f0",
    background: "#ffffff", fontSize: "14px", fontWeight: "500",
    color: "#374151", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  pageBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  pageInfo: { fontSize: "14px", color: "#64748b", fontFamily: "'DM Sans', sans-serif" },
};