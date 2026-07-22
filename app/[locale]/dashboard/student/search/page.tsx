"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Search, BookOpen, Loader2, AlertCircle,
  Clock, Globe, Languages, BadgeDollarSign,
  UserCircle, ChevronRight, CheckCircle2 
} from "lucide-react";
import api from "@/lib/api";
import {
  ApiResponse, PagedResponse, CourseOutputDto,
  TeacherAllDetailsOutputDto, Currency, TeacherLanguageOutputDto, SubscribeState, SubscriptionStatus
} from "@/types";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

const CURRENCY_LABELS: Record<number, string> = {
  0: "TRY", 1: "USD", 2: "EUR", 3: "CNY", 4: "KRW", 5: "JPY",
};

export default function StudentSearchPage() {
  const t = useTranslations("courseSearch");
  const tCourse = useTranslations("courseCodes");
  const tLang = useTranslations("languageCodes");
  const router = useRouter();
  const locale = useLocale();

  const [courses, setCourses] = useState<CourseOutputDto[]>([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [teachers, setTeachers] = useState<TeacherAllDetailsOutputDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [subscribeStates, setSubscribeStates] = useState<Record<string, SubscribeState>>({});

  // Kurs listesini çek
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get<ApiResponse<CourseOutputDto[]>>("/api/Course/all");
        if (res.data.success && res.data.data) {
          setCourses(res.data.data);
        }
      } catch {
        // sessiz hata
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const fetchTeachers = useCallback(async (code: string, p: number) => {
    if (!code) return;
    setLoading(true);
    setError("");
    try {
      const res = await api.get<ApiResponse<PagedResponse<TeacherAllDetailsOutputDto>>>(
        `/api/Course/${code}/details`,
        { params: { page: p, pageSize: PAGE_SIZE } }
      );
      if (!res.data.success || !res.data.data) {
        setTeachers([]);
        setTotalCount(0);
        return;
      }
      const paged = res.data.data;
      setTeachers(paged.items);
      setTotalCount(paged.totalCount);
      setTotalPages(paged.totalPages);
      setHasNext(paged.hasNext);
      setHasPrev(paged.hasPrevious);
      setSearched(true);
    } catch {
      setError(t("errorDefault"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleSearch = () => {
    setPage(1);
    fetchTeachers(selectedCode, 1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchTeachers(selectedCode, newPage);
  };

  const initials = (f: string, l: string) =>
    `${f?.[0] ?? ""}${l?.[0] ?? ""}`.toUpperCase();

  const renderLanguages = (langs: TeacherLanguageOutputDto[]) =>
    langs.map((l) => (
      <span key={l.id} style={styles.langChip}>
        {tLang.has(l.languageCode) ? tLang(l.languageCode) : l.languageCode}
        <span style={styles.langLevel}>{l.languageLevelName}</span>
      </span>
    ));

    const handleSubscribe = async (teacherId: string) => {
  setSubscribeStates((prev) => ({
    ...prev,
    [teacherId]: { loading: true, success: false, error: "" },
  }));

  try {
    const res = await api.post<ApiResponse<boolean>>("/api/Subscription/request", {
      teacherId,
    });

    if (!res.data.success) {
      setSubscribeStates((prev) => ({
        ...prev,
        [teacherId]: { loading: false, success: false, error: res.data.message },
      }));
      return;
    }

    setSubscribeStates((prev) => ({
      ...prev,
      [teacherId]: { loading: false, success: true, error: "" },
    }));
  } catch {
    setSubscribeStates((prev) => ({
      ...prev,
      [teacherId]: { loading: false, success: false, error: t("subscribeError") },
    }));
  }
};



const getSubscriptionLabel = (
  status: SubscriptionStatus | null,
  localState: SubscribeState | undefined
) => {
  // Local state öncelikli (yeni istek atıldıysa)
  if (localState?.success) return { label: t("requestSent"), disabled: true, variant: "requested" };
  if (localState?.loading) return { label: t("subscribing"), disabled: true, variant: "loading" };

  // Backend'den gelen durum
  switch (status) {
    case 0: return { label: t("requestSent"),  disabled: true,  variant: "requested" };
    case 1: return { label: t("following"),    disabled: true,  variant: "following" };
    case 2: return { label: t("requestRejected"), disabled: false, variant: "rejected" };
    case 3: return { label: t("subscribe"),    disabled: false, variant: "default"   };
    default: return { label: t("subscribe"),   disabled: false, variant: "default"   };
  }
};

  return (
    <div style={styles.page}>
      {/* Başlık */}
      <div>
        <h1 style={styles.title}>{t("title")}</h1>
        <p style={styles.subtitle}>{t("subtitle")}</p>
      </div>

      {/* Arama kutusu */}
      <div style={styles.searchBox}>
        <div style={styles.selectWrap}>
          <BookOpen size={16} color="#94a3b8" style={styles.selectIcon} />
          {coursesLoading ? (
            <div style={styles.selectPlaceholder}>
              <Loader2 size={14} color="#94a3b8" style={{ animation: "spin 1s linear infinite" }} />
            </div>
          ) : (
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              style={styles.select}
            >
              <option value="">{t("selectCoursePlaceholder")}</option>
              {courses.map((c) => (
                <option key={c.id} value={c.code}>
                  {tCourse.has(c.code) ? tCourse(c.code) : c.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          style={{
            ...styles.searchBtn,
            ...(!selectedCode ? styles.searchBtnDisabled : {}),
          }}
          onClick={handleSearch}
          disabled={!selectedCode || loading}
        >
          {loading
            ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            : <Search size={16} />
          }
          {t("search")}
        </button>
      </div>

      {/* Hata */}
      {error && (
        <div style={styles.errorBox}>
          <AlertCircle size={16} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}

      {/* Sonuç sayısı */}
      {searched && !loading && !error && (
        <p style={styles.resultCount}>
          {t("teachersFound", { count: totalCount })}
        </p>
      )}

      {/* Boş */}
      {searched && !loading && !error && teachers.length === 0 && (
        <div style={styles.emptyBox}>
          <UserCircle size={40} color="#cbd5e1" />
          <p style={styles.emptyText}>{t("emptyTeachers")}</p>
        </div>
      )}

      {/* Öğretmen kartları */}
      {!loading && teachers.length > 0 && (
        <div style={styles.list}>
          {teachers.map((teacher) => {
            const user = teacher.userProfileDetail;
            const profile = teacher.teacherProfileDetail;
            const course = teacher.teacherCourseProfileDetail;
            const langs = teacher.teacherLanguageProfileDetails;

            return (
              <div key={profile.id} style={styles.card}>
                {/* Sol: avatar + isim */}
                <div style={styles.cardLeft}>
                  <div style={styles.avatar}>
                    {user.photo
                      ? <img src={user.photo} alt="" style={styles.avatarImg} />
                      : <span style={styles.avatarInitials}>
                          {initials(user.firstName, user.lastName)}
                        </span>
                    }
                  </div>
                  <div>
                    <p style={styles.name}>
                      {`${user.firstName} ${user.lastName}`}
                    </p>
                    <p style={styles.email}>{user.email}</p>
                  </div>
                </div>

                {/* Orta: bilgiler */}
                <div style={styles.cardMid}>
                  {/* Bio */}
                  <p style={styles.bio}>
                    {profile.bio ?? t("noBio")}
                  </p>

                  {/* Diller */}
                  {langs.length > 0 && (
                    <div style={styles.langRow}>
                      <Languages size={13} color="#94a3b8" />
                      <div style={styles.langChips}>
                        {renderLanguages(langs)}
                      </div>
                    </div>
                  )}

                  {/* Meta: süre + timezone */}
                  <div style={styles.metaRow}>
                    <div style={styles.metaItem}>
                      <Clock size={13} color="#94a3b8" />
                      <span style={styles.metaText}>
                        {course.durationMinutes} {t("minutes")}
                      </span>
                    </div>
                    <div style={styles.metaItem}>
                      <Globe size={13} color="#94a3b8" />
                      <span style={styles.metaText}>{profile.timeZoneId}</span>
                    </div>
                  </div>
                </div>

                {/* Sağ: fiyat + buton */}
                <div style={styles.cardRight}>
                  <div style={styles.priceWrap}>
                    <div style={styles.priceChip}>
                      <BadgeDollarSign size={15} color="#16a34a" />
                      <span style={styles.price}>
                        {course.price.toFixed(2)} {CURRENCY_LABELS[course.currency]}
                      </span>
                    </div>
                    <span style={styles.perLesson}>{t("perLesson")}</span>
                  </div>
                  {(() => {
  const state = subscribeStates[profile.id];
  const { label, disabled, variant } = getSubscriptionLabel(
    teacher.subscriptionStatus,
    state
  );

  if (variant === "following") {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
        <button
          style={styles.viewBtn}
          onClick={() => router.push(`/${locale}/dashboard/student/teachers/${profile.id}`)}
        >
          <ChevronRight size={14} />
          {t("goToLesson")}
        </button>
      </div>
    );
  }

  const btnStyle = {
    ...styles.viewBtn,
    ...(variant === "requested" ? styles.viewBtnRequested : {}),
    ...(variant === "rejected" ? styles.viewBtnRejected : {}),
    ...(disabled ? { cursor: "not-allowed" } : {}),
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
      <button
        style={btnStyle}
        disabled={disabled}
        onClick={() => !disabled && handleSubscribe(profile.id)}
      >
        {state?.loading && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
        {variant === "requested" && <CheckCircle2 size={14} />}
        {!state?.loading && variant !== "requested" && <ChevronRight size={14} />}
        {label}
      </button>
      {state?.error && (
        <p style={styles.subscribeError}>{state.error}</p>
      )}
    </div>
  );
})()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={!hasPrev}
            style={{ ...styles.pageBtn, ...(!hasPrev ? styles.pageBtnDisabled : {}) }}
          >
            ← {t("prev")}
          </button>
          <span style={styles.pageInfo}>{page} / {totalPages}</span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={!hasNext}
            style={{ ...styles.pageBtn, ...(!hasNext ? styles.pageBtnDisabled : {}) }}
          >
            {t("next")} →
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: "24px", maxWidth: "920px" },
  title: { fontSize: "26px", fontWeight: "400", color: "#1a1a2e", fontFamily: "'DM Serif Display', serif" },
  subtitle: { fontSize: "14px", color: "#64748b", marginTop: "4px" },
  searchBox: { display: "flex", gap: "12px", alignItems: "center" },
  selectWrap: { position: "relative", flex: 1, maxWidth: "360px" },
  selectIcon: { position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },
  selectPlaceholder: { padding: "10px 14px 10px 38px", border: "1.5px solid #e2e8f0", borderRadius: "10px", display: "flex", alignItems: "center" },
  select: {
    width: "100%", padding: "10px 14px 10px 38px",
    border: "1.5px solid #e2e8f0", borderRadius: "10px",
    fontSize: "14px", color: "#1a1a2e", background: "#ffffff",
    outline: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    appearance: "none",
  },
  searchBtn: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "10px 22px", background: "#2563eb", color: "#ffffff",
    border: "none", borderRadius: "10px", fontSize: "14px",
    fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  searchBtnDisabled: { background: "#93c5fd", cursor: "not-allowed" },
  errorBox: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "14px",
  },
  resultCount: { fontSize: "14px", color: "#64748b", fontFamily: "'DM Sans', sans-serif" },
  emptyBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "48px 0" },
  emptyText: { fontSize: "14px", color: "#94a3b8" },
  list: { display: "flex", flexDirection: "column", gap: "12px" },
  card: {
    display: "flex", alignItems: "flex-start", gap: "20px",
    background: "#ffffff", border: "1px solid #e2e8f0",
    borderRadius: "16px", padding: "20px 24px",
  },
  cardLeft: { display: "flex", alignItems: "center", gap: "12px", minWidth: "180px" },
  avatar: {
    width: "48px", height: "48px", borderRadius: "50%",
    background: "#dbeafe", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitials: { fontSize: "15px", fontWeight: "700", color: "#1d4ed8", fontFamily: "'DM Sans', sans-serif" },
  name: { fontSize: "15px", fontWeight: "600", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" },
  email: { fontSize: "12px", color: "#94a3b8", marginTop: "2px", fontFamily: "'DM Sans', sans-serif" },
  cardMid: { flex: 1, display: "flex", flexDirection: "column", gap: "10px" },
  bio: { fontSize: "13px", color: "#64748b", lineHeight: "1.5", fontFamily: "'DM Sans', sans-serif" },
  langRow: { display: "flex", alignItems: "center", gap: "8px" },
  langChips: { display: "flex", flexWrap: "wrap", gap: "6px" },
  langChip: {
    display: "flex", alignItems: "center", gap: "4px",
    background: "#f1f5f9", borderRadius: "20px",
    padding: "3px 10px", fontSize: "12px", color: "#475569",
    fontFamily: "'DM Sans', sans-serif",
  },
  langLevel: { color: "#94a3b8", fontSize: "11px" },
  metaRow: { display: "flex", gap: "16px" },
  metaItem: { display: "flex", alignItems: "center", gap: "5px" },
  metaText: { fontSize: "12px", color: "#64748b", fontFamily: "'DM Sans', sans-serif" },
  cardRight: {
    display: "flex", flexDirection: "column", alignItems: "flex-end",
    gap: "12px", minWidth: "140px", flexShrink: 0,
  },
  priceWrap: { display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" },
  priceChip: { display: "flex", alignItems: "center", gap: "5px" },
  price: { fontSize: "18px", fontWeight: "700", color: "#16a34a", fontFamily: "'DM Sans', sans-serif" },
  perLesson: { fontSize: "11px", color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" },
  viewBtn: {
    display: "flex", alignItems: "center", gap: "5px",
    padding: "8px 16px", background: "#2563eb", color: "#ffffff",
    border: "none", borderRadius: "8px", fontSize: "13px",
    fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  viewBtnRequested: {
  background: "#f59e0b",
  cursor: "not-allowed",
},
viewBtnRejected: {
  background: "#ffffff",
  color: "#ef4444",
  border: "1px solid #fecaca",
},
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" },
  pageBtn: {
    padding: "8px 20px", borderRadius: "8px", border: "1px solid #e2e8f0",
    background: "#ffffff", fontSize: "14px", fontWeight: "500",
    color: "#374151", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  pageBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  pageInfo: { fontSize: "14px", color: "#64748b", fontFamily: "'DM Sans', sans-serif" },
};