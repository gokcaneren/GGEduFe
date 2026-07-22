"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Clock, BadgeDollarSign,
  Loader2, AlertCircle, CheckCircle2, Calendar,
} from "lucide-react";
import api from "@/lib/api";
import {
  ApiResponse, TeacherCourseWithCourseSlotOutputDto,
  AvailabilityCourseSlotOutputDto, TeacherAllDetailsOutputDto,
  PagedResponse,
} from "@/types";

const CURRENCY_LABELS: Record<number, string> = {
  0: "TRY", 1: "USD", 2: "EUR", 3: "CNY", 4: "KRW", 5: "JPY",
};

export default function TeacherDetailPage() {
  const t = useTranslations("teacherDetail");
  const tCourse = useTranslations("courseCodes");
  const tLang = useTranslations("languageCodes");
  const locale = useLocale();
  const router = useRouter();
  const params = useParams();
  const teacherId = params.teacherId as string;

  // ── Teacher info ──
  const [teacherCourses, setTeacherCourses] = useState<{ id: string; code: string }[]>([]);
  const [selectedCourseCode, setSelectedCourseCode] = useState("");
  const [teacherName, setTeacherName] = useState("");

  // ── Slots ──
  const [slotsData, setSlotsData] = useState<TeacherCourseWithCourseSlotOutputDto | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  // ── Selected slot ──
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // ── Booking ──
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");

  // ── Öğretmenin kurslarını çek ──
  useEffect(() => {
    const fetchTeacherCourses = async () => {
      try {
        // Tüm course'ları çek, öğretmenin verdiği kursları bul
        const res = await api.get<ApiResponse<PagedResponse<TeacherAllDetailsOutputDto>>>(
          `/api/Course/teacher/${teacherId}/courses`
        );
        // Eğer bu endpoint yoksa aşağıdaki alternatifi kullan
      } catch {
        // sessiz
      }
    };

    // Alternatif: teacher details endpoint'inden kursları çek
    const fetchFromTeacherDetails = async () => {
      try {
        const res = await api.get<ApiResponse<{ teacherCourses: { id: string; code: string; name: string }[] }>>(
          `/api/Teacher/${teacherId}/details`
        );
        if (res.data.success && res.data.data?.teacherCourses) {
          const courses = res.data.data.teacherCourses;
          setTeacherCourses(courses);
          if (courses.length > 0) setSelectedCourseCode(courses[0].code);
        }
      } catch {
        // sessiz
      }
    };

    fetchFromTeacherDetails();
  }, [teacherId]);

  // ── Slot fetch ──
  const fetchSlots = useCallback(async (courseCode: string) => {
    if (!courseCode) return;
    setSlotsLoading(true);
    setSlotsError("");
    setSelectedSlotId(null);
    setBookingSuccess(false);
    setBookingError("");

    try {
      const res = await api.get<ApiResponse<TeacherCourseWithCourseSlotOutputDto>>(
        `/api/Booking/${teacherId}/slots/${courseCode}`
      );
      if (!res.data.success || !res.data.data) {
        setSlotsError(res.data.message || t("errorDefault"));
        setSlotsData(null);
        return;
      }
      setSlotsData(res.data.data);
    } catch {
      setSlotsError(t("errorDefault"));
    } finally {
      setSlotsLoading(false);
    }
  }, [teacherId, t]);

  useEffect(() => {
    if (selectedCourseCode) fetchSlots(selectedCourseCode);
  }, [selectedCourseCode]);

  // ── Booking gönder ──
  const handleBook = async () => {
    if (!selectedSlotId) return;
    setBookingLoading(true);
    setBookingError("");

    try {
      const res = await api.post<ApiResponse<boolean>>("/api/Booking", {
        teacherId,
        availabilityCourseSlotId: selectedSlotId,
      });

      if (!res.data.success) {
        setBookingError(res.data.message || t("bookError"));
        return;
      }

      setBookingSuccess(true);
      setSelectedSlotId(null);
      // Slotları yenile
      fetchSlots(selectedCourseCode);
    } catch {
      setBookingError(t("bookError"));
    } finally {
      setBookingLoading(false);
    }
  };

  // ── Tarihe göre grupla ──
  const groupSlotsByDate = (slots: AvailabilityCourseSlotOutputDto[]) => {
    return slots
      .filter((s) => s.status === 0) // sadece Available
      .reduce<Record<string, AvailabilityCourseSlotOutputDto[]>>((acc, slot) => {
        const key = new Date(slot.startAtUtc).toDateString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(slot);
        return acc;
      }, {});
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", {
      weekday: "long", day: "numeric", month: "long",
    });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString(locale === "tr" ? "tr-TR" : "en-GB", {
      hour: "2-digit", minute: "2-digit",
    });

  const grouped = slotsData ? groupSlotsByDate(slotsData.courseSlots) : {};

  return (
    <div style={styles.page}>
      {/* Geri butonu */}
      <button style={styles.backBtn} onClick={() => router.back()}>
        <ArrowLeft size={16} />
        {t("back")}
      </button>

      <div style={styles.layout}>
        {/* Sol: kurs seçimi + slot listesi */}
        <div style={styles.leftCol}>

          {/* Kurs seçimi */}
          {teacherCourses.length > 0 && (
            <div style={styles.card}>
              <p style={styles.cardTitle}>{t("selectCourse")}</p>
              <div style={styles.courseButtons}>
                {teacherCourses.map((c) => (
                  <button
                    key={c.id}
                    style={{
                      ...styles.courseBtn,
                      ...(selectedCourseCode === c.code ? styles.courseBtnActive : {}),
                    }}
                    onClick={() => setSelectedCourseCode(c.code)}
                  >
                    <BookOpen size={15} color={selectedCourseCode === c.code ? "#2563eb" : "#94a3b8"} />
                    {tCourse.has(c.code) ? tCourse(c.code) : c.code}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Slot listesi */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>{t("availableSlots")}</p>

            {slotsLoading && (
              <div style={styles.centered}>
                <Loader2 size={24} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
              </div>
            )}

            {!slotsLoading && slotsError && (
              <div style={styles.errorBox}>
                <AlertCircle size={15} color="#dc2626" />
                <span>{slotsError}</span>
              </div>
            )}

            {!slotsLoading && !slotsError && Object.keys(grouped).length === 0 && (
              <div style={styles.emptyBox}>
                <Calendar size={32} color="#cbd5e1" />
                <p style={styles.emptyText}>{t("noSlots")}</p>
              </div>
            )}

            {!slotsLoading && !slotsError && Object.entries(grouped).map(([dateKey, slots]) => (
              <div key={dateKey} style={styles.dateGroup}>
                <p style={styles.dateLabel}>{formatDate(slots[0].startAtUtc)}</p>
                <div style={styles.slotGrid}>
                  {slots.map((slot) => {
                    const isSelected = selectedSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        style={{
                          ...styles.slotBtn,
                          ...(isSelected ? styles.slotBtnSelected : {}),
                        }}
                        onClick={() => {
                          setSelectedSlotId(isSelected ? null : slot.id);
                          setBookingSuccess(false);
                          setBookingError("");
                        }}
                      >
                        <Clock size={13} color={isSelected ? "#2563eb" : "#64748b"} />
                        {formatTime(slot.startAtUtc)} – {formatTime(slot.endAtUtc)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sağ: özet + booking butonu */}
        <div style={styles.rightCol}>
          <div style={styles.card}>
            <p style={styles.cardTitle}>{t("price")}</p>

            {slotsData && (
              <>
                <div style={styles.summaryRow}>
                  <BookOpen size={15} color="#64748b" />
                  <span style={styles.summaryText}>
                    {tCourse.has(slotsData.courseCode)
                      ? tCourse(slotsData.courseCode)
                      : slotsData.courseName}
                  </span>
                </div>

                <div style={styles.summaryRow}>
                  <Clock size={15} color="#64748b" />
                  <span style={styles.summaryText}>
                    {slotsData.durationMinutes} {t("minutes")}
                  </span>
                </div>

                <div style={styles.priceRow}>
                  <BadgeDollarSign size={20} color="#16a34a" />
                  <span style={styles.price}>
                    {slotsData.price.toFixed(2)} {CURRENCY_LABELS[slotsData.currency]}
                  </span>
                </div>

                {/* Seçilen slot */}
                {selectedSlotId && (() => {
                  const slot = slotsData.courseSlots.find((s) => s.id === selectedSlotId);
                  return slot ? (
                    <div style={styles.selectedSlotBox}>
                      <p style={styles.selectedSlotLabel}>Seçilen Saat</p>
                      <p style={styles.selectedSlotTime}>
                        {formatDate(slot.startAtUtc)}
                      </p>
                      <p style={styles.selectedSlotTime}>
                        {formatTime(slot.startAtUtc)} – {formatTime(slot.endAtUtc)}
                      </p>
                    </div>
                  ) : null;
                })()}

                {/* Başarı mesajı */}
                {bookingSuccess && (
                  <div style={styles.successBox}>
                    <CheckCircle2 size={15} color="#16a34a" />
                    <span>{t("bookSuccess")}</span>
                  </div>
                )}

                {/* Hata */}
                {bookingError && (
                  <div style={styles.errorBox}>
                    <AlertCircle size={14} color="#dc2626" />
                    <span>{bookingError}</span>
                  </div>
                )}

                <button
                  style={{
                    ...styles.bookBtn,
                    ...(!selectedSlotId || bookingLoading || bookingSuccess
                      ? styles.bookBtnDisabled : {}),
                  }}
                  disabled={!selectedSlotId || bookingLoading || bookingSuccess}
                  onClick={handleBook}
                >
                  {bookingLoading
                    ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />{t("booking")}</>
                    : <>{t("book")}</>
                  }
                </button>
              </>
            )}

            {!slotsData && !slotsLoading && (
              <p style={styles.emptyText}>{t("selectCourse")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: "20px", maxWidth: "960px" },
  backBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "8px 14px", background: "#f1f5f9", color: "#475569",
    border: "none", borderRadius: "8px", fontSize: "14px",
    fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    width: "fit-content",
  },
  layout: { display: "grid", gridTemplateColumns: "1fr 300px", gap: "20px", alignItems: "start" },
  leftCol: { display: "flex", flexDirection: "column", gap: "16px" },
  rightCol: { display: "flex", flexDirection: "column", gap: "16px" },
  card: {
    background: "#ffffff", border: "1px solid #e2e8f0",
    borderRadius: "16px", padding: "24px",
    display: "flex", flexDirection: "column", gap: "16px",
  },
  cardTitle: {
    fontSize: "15px", fontWeight: "600", color: "#374151",
    fontFamily: "'DM Sans', sans-serif",
  },
  courseButtons: { display: "flex", flexWrap: "wrap", gap: "8px" },
  courseBtn: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "8px 16px", border: "1.5px solid #e2e8f0",
    borderRadius: "10px", background: "#ffffff", color: "#64748b",
    fontSize: "14px", fontWeight: "500", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
  },
  courseBtnActive: {
    border: "1.5px solid #2563eb", background: "#eff6ff", color: "#1d4ed8",
  },
  centered: { display: "flex", justifyContent: "center", padding: "32px 0" },
  errorBox: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "8px", padding: "10px 14px",
    color: "#dc2626", fontSize: "13px",
  },
  successBox: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "#f0fdf4", border: "1px solid #bbf7d0",
    borderRadius: "8px", padding: "10px 14px",
    color: "#16a34a", fontSize: "13px",
  },
  emptyBox: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "10px", padding: "32px 0",
  },
  emptyText: { fontSize: "13px", color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" },
  dateGroup: { display: "flex", flexDirection: "column", gap: "10px" },
  dateLabel: {
    fontSize: "13px", fontWeight: "600", color: "#374151",
    textTransform: "capitalize", fontFamily: "'DM Sans', sans-serif",
  },
  slotGrid: { display: "flex", flexWrap: "wrap", gap: "8px" },
  slotBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "8px 14px", border: "1.5px solid #e2e8f0",
    borderRadius: "8px", background: "#f8fafc", color: "#374151",
    fontSize: "13px", fontWeight: "500", cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif", transition: "all 0.15s",
  },
  slotBtnSelected: {
    border: "1.5px solid #2563eb", background: "#eff6ff", color: "#1d4ed8",
  },
  summaryRow: { display: "flex", alignItems: "center", gap: "8px" },
  summaryText: { fontSize: "14px", color: "#374151", fontFamily: "'DM Sans', sans-serif" },
  priceRow: {
    display: "flex", alignItems: "center", gap: "6px",
    paddingTop: "8px", borderTop: "1px solid #f1f5f9",
  },
  price: { fontSize: "22px", fontWeight: "700", color: "#16a34a", fontFamily: "'DM Sans', sans-serif" },
  selectedSlotBox: {
    background: "#eff6ff", border: "1px solid #bfdbfe",
    borderRadius: "10px", padding: "12px 14px",
    display: "flex", flexDirection: "column", gap: "4px",
  },
  selectedSlotLabel: { fontSize: "11px", color: "#64748b", fontFamily: "'DM Sans', sans-serif" },
  selectedSlotTime: { fontSize: "13px", fontWeight: "600", color: "#1d4ed8", fontFamily: "'DM Sans', sans-serif" },
  bookBtn: {
    width: "100%", padding: "12px",
    background: "#2563eb", color: "#ffffff",
    border: "none", borderRadius: "10px",
    fontSize: "14px", fontWeight: "600",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
  },
  bookBtnDisabled: { background: "#93c5fd", cursor: "not-allowed" },
};