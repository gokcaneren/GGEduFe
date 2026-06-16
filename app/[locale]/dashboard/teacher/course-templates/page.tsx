"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Layout, Plus, Loader2, AlertCircle, Clock, Calendar,
  ChevronRight, CheckCircle2, XCircle, ArrowLeft, Check, X,
} from "lucide-react";
import api from "@/lib/api";
import {
  ApiResponse, PagedResponse,
  CourseTemplateSimpleOutputDto, CourseTemplateWithCourseOutputDto,
  CourseTemplateInputDto, TeacherCourseOutputDto, DayOfWeek,
} from "@/types";

const PAGE_SIZE = 10;

type View = "list" | "detail" | "create";

// "HH:mm:ss" → "HH:mm"
const fmtTime = (ts: string) => ts.slice(0, 5);

// "YYYY-MM-DD" → locale date
const fmtDate = (d: string | null, locale: string) => {
  if (!d) return null;
  return new Date(d).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
};

export default function CourseTemplatesPage() {
  const t = useTranslations("courseTemplates");
  const tCourse = useTranslations("courseCodes");

  // ── List state ──
  const [view, setView] = useState<View>("list");
  const [templates, setTemplates] = useState<CourseTemplateSimpleOutputDto[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ── Detail state ──
  const [detail, setDetail] = useState<CourseTemplateWithCourseOutputDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // ── Create state ──
  const [teacherCourses, setTeacherCourses] = useState<TeacherCourseOutputDto[]>([]);
  const [form, setForm] = useState<CourseTemplateInputDto>({
    teacherCourseId: "",
    name: "",
    dayOfWeek: 1,
    startLocalTime: "09:00:00",
    endLocalTime: "10:00:00",
    timeZoneId: "UTC",
    autoGenerateSlots: true,
    generateDaysAhead: 30,
    isActive: true,
    effectiveFrom: null,
    effectiveTo: null,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState(false);

  useEffect(() => {
    fetchTemplates(page);
  }, [page]);

  const fetchTemplates = async (p: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<ApiResponse<PagedResponse<CourseTemplateSimpleOutputDto>>>(
        "/api/CourseTemplate/all",
        { params: { page: p, pageSize: PAGE_SIZE } }
      );
      if (!res.data.success || !res.data.data) {
        setTemplates([]);
        setTotalPages(1);
        return;
      }
      const paged = res.data.data;
      setTemplates(paged.items);
      setTotalPages(paged.totalPages);
      setHasNext(paged.hasNext);
      setHasPrevious(paged.hasPrevious);
    } catch {
      setError(t("errorDefault"));
    } finally {
      setLoading(false);
    }
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetailError("");
    setDetail(null);
    setView("detail");
    try {
      const res = await api.get<ApiResponse<CourseTemplateWithCourseOutputDto>>(
        `/api/CourseTemplate/${id}`
      );
      if (!res.data.success || !res.data.data) {
        setDetailError(res.data.message);
        return;
      }
      setDetail(res.data.data);
    } catch {
      setDetailError(t("detailError"));
    } finally {
      setDetailLoading(false);
    }
  };

  const openCreate = async () => {
    setCreateError("");
    setCreateSuccess(false);
    // Teacher courses'ları çek
    try {
      const res = await api.get<ApiResponse<{ teacherCourses: TeacherCourseOutputDto[] }>>(
        "/api/Teacher/details"
      );
      if (res.data.success && res.data.data?.teacherCourses?.length) {
        setTeacherCourses(res.data.data.teacherCourses);
        setForm((f) => ({ ...f, teacherCourseId: res.data.data!.teacherCourses[0].id }));
      }
    } catch { /* sessiz hata */ }
    setView("create");
  };

  const handleCreate = async () => {
    setCreating(true);
    setCreateError("");
    try {
      const payload = {
        ...form,
        startLocalTime: form.startLocalTime.length === 5
          ? form.startLocalTime + ":00"
          : form.startLocalTime,
        endLocalTime: form.endLocalTime.length === 5
          ? form.endLocalTime + ":00"
          : form.endLocalTime,
      };
      const res = await api.post<ApiResponse<string>>("/api/CourseTemplate", payload);
      if (!res.data.success) {
        setCreateError(res.data.message || t("createError"));
        return;
      }
      setCreateSuccess(true);
      fetchTemplates(1);
      setPage(1);
      setTimeout(() => setView("list"), 1200);
    } catch {
      setCreateError(t("createError"));
    } finally {
      setCreating(false);
    }
  };

  const updateForm = (field: keyof CourseTemplateInputDto, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  const dayOptions = ([0,1,2,3,4,5,6] as DayOfWeek[]).map((d) => ({
    value: d,
    label: t(`days.${d}`),
  }));

  // ─────────────── RENDER ───────────────

  // Detail view
  if (view === "detail") {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => setView("list")}>
            <ArrowLeft size={16} />
            {t("back")}
          </button>
        </div>

        {detailLoading && (
          <div style={styles.centered}>
            <Loader2 size={28} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
          </div>
        )}

        {detailError && (
          <div style={styles.errorBox}>
            <AlertCircle size={16} color="#dc2626" />
            <span>{detailError}</span>
          </div>
        )}

        {detail && !detailLoading && (
          <div style={styles.detailCard}>
            {/* Başlık satırı */}
            <div style={styles.detailHeader}>
              <div style={styles.detailIconWrap}>
                <Layout size={22} color="#2563eb" />
              </div>
              <div>
                <p style={styles.detailName}>{detail.name}</p>
                <p style={styles.detailCourse}>
                  {tCourse.has(detail.courseCode) ? tCourse(detail.courseCode) : detail.courseCode}
                </p>
              </div>
              <div style={{
                ...styles.statusChip,
                ...(detail.isActive ? styles.statusActive : styles.statusInactive),
              }}>
                {detail.isActive
                  ? <><CheckCircle2 size={13} />{t("active")}</>
                  : <><XCircle size={13} />{t("passive")}</>
                }
              </div>
            </div>

            <div style={styles.detailGrid}>
              {/* Gün & Saat */}
              <div style={styles.detailSection}>
                <p style={styles.sectionLabel}>{t("fieldDay")}</p>
                <p style={styles.sectionValue}>{t(`days.${detail.dayOfWeek}`)}</p>
              </div>
              <div style={styles.detailSection}>
                <p style={styles.sectionLabel}>{t("fieldStartTime")} – {t("fieldEndTime")}</p>
                <p style={styles.sectionValue}>
                  {fmtTime(detail.startLocalTime)} – {fmtTime(detail.endLocalTime)}
                </p>
              </div>
              <div style={styles.detailSection}>
                <p style={styles.sectionLabel}>{t("fieldTimezone")}</p>
                <p style={styles.sectionValue}>{detail.timeZoneId}</p>
              </div>
              <div style={styles.detailSection}>
                <p style={styles.sectionLabel}>{t("fieldAutoGenerate")}</p>
                <p style={styles.sectionValue}>
                  {detail.autoGenerateSlots
                    ? `✓  ${detail.generateDaysAhead} ${t("daysAhead")}`
                    : "—"}
                </p>
              </div>
              <div style={styles.detailSection}>
                <p style={styles.sectionLabel}>{t("fieldEffectiveFrom")}</p>
                <p style={styles.sectionValue}>
                  {fmtDate(detail.effectiveFrom, "tr") ?? t("notSet")}
                </p>
              </div>
              <div style={styles.detailSection}>
                <p style={styles.sectionLabel}>{t("fieldEffectiveTo")}</p>
                <p style={styles.sectionValue}>
                  {fmtDate(detail.effectiveTo, "tr") ?? t("notSet")}
                </p>
              </div>
            </div>

            {/* Update henüz hazır değil notu */}
            <div style={styles.updateNote}>
              <AlertCircle size={14} color="#92400e" />
              <span>Güncelleme özelliği yakında eklenecek.</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Create view
  if (view === "create") {
    return (
      <div style={styles.page}>
        <div style={styles.header}>
          <button style={styles.backBtn} onClick={() => setView("list")}>
            <ArrowLeft size={16} />
            {t("back")}
          </button>
        </div>

        <div style={styles.createCard}>
          <p style={styles.createTitle}>{t("createTitle")}</p>
          <p style={styles.createSubtitle}>{t("createSubtitle")}</p>

          <div style={styles.formGrid}>
            {/* Şablon adı */}
            <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1" }}>
              <label style={styles.fieldLabel}>{t("fieldName")}</label>
              <input
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder={t("fieldNamePlaceholder")}
                style={styles.input}
              />
            </div>

            {/* Kurs seçimi */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>{t("fieldCourse")}</label>
              <select
                value={form.teacherCourseId}
                onChange={(e) => updateForm("teacherCourseId", e.target.value)}
                style={styles.select}
              >
                {teacherCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {tCourse.has(c.code) ? tCourse(c.code) : c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Gün */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>{t("fieldDay")}</label>
              <select
                value={form.dayOfWeek}
                onChange={(e) => updateForm("dayOfWeek", Number(e.target.value) as DayOfWeek)}
                style={styles.select}
              >
                {dayOptions.map((d) => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            {/* Başlangıç saati */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>{t("fieldStartTime")}</label>
              <input
                type="time"
                value={form.startLocalTime.slice(0, 5)}
                onChange={(e) => updateForm("startLocalTime", e.target.value + ":00")}
                style={styles.input}
              />
            </div>

            {/* Bitiş saati */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>{t("fieldEndTime")}</label>
              <input
                type="time"
                value={form.endLocalTime.slice(0, 5)}
                onChange={(e) => updateForm("endLocalTime", e.target.value + ":00")}
                style={styles.input}
              />
            </div>

            {/* Timezone */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>{t("fieldTimezone")}</label>
              <input
                value={form.timeZoneId}
                onChange={(e) => updateForm("timeZoneId", e.target.value)}
                placeholder="UTC"
                style={styles.input}
              />
            </div>

            {/* Geçerlilik başlangıcı */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>{t("fieldEffectiveFrom")}</label>
              <input
                type="date"
                value={form.effectiveFrom ?? ""}
                onChange={(e) => updateForm("effectiveFrom", e.target.value || null)}
                style={styles.input}
              />
            </div>

            {/* Geçerlilik bitişi */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>{t("fieldEffectiveTo")}</label>
              <input
                type="date"
                value={form.effectiveTo ?? ""}
                onChange={(e) => updateForm("effectiveTo", e.target.value || null)}
                style={styles.input}
              />
            </div>

            {/* Kaç gün önceden */}
            <div style={styles.fieldGroup}>
              <label style={styles.fieldLabel}>{t("fieldDaysAhead")}</label>
              <input
                type="number"
                min={1}
                value={form.generateDaysAhead}
                onChange={(e) => updateForm("generateDaysAhead", Number(e.target.value))}
                style={styles.input}
              />
            </div>

            {/* Toggle'lar */}
            <div style={{ ...styles.fieldGroup, gridColumn: "1 / -1", flexDirection: "row", gap: "24px" }}>
              <label style={styles.toggleRow}>
                <input
                  type="checkbox"
                  checked={form.autoGenerateSlots}
                  onChange={(e) => updateForm("autoGenerateSlots", e.target.checked)}
                  style={styles.checkbox}
                />
                <span style={styles.fieldLabel}>{t("fieldAutoGenerate")}</span>
              </label>
              <label style={styles.toggleRow}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => updateForm("isActive", e.target.checked)}
                  style={styles.checkbox}
                />
                <span style={styles.fieldLabel}>{t("fieldIsActive")}</span>
              </label>
            </div>
          </div>

          {createError && (
            <div style={styles.errorBox}>
              <AlertCircle size={14} color="#dc2626" />
              <span>{createError}</span>
            </div>
          )}

          {createSuccess && (
            <div style={styles.successBox}>
              <Check size={14} color="#16a34a" />
              <span>{t("createSuccess")}</span>
            </div>
          )}

          <div style={styles.createActions}>
            <button style={styles.cancelBtn} onClick={() => setView("list")} disabled={creating}>
              <X size={15} />
              {t("back")}
            </button>
            <button style={styles.createBtn} onClick={handleCreate} disabled={creating || createSuccess}>
              {creating
                ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />{t("creating")}</>
                : <><Plus size={15} />{t("create")}</>
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>{t("title")}</h1>
          <p style={styles.subtitle}>{t("subtitle")}</p>
        </div>
        <button style={styles.newBtn} onClick={openCreate}>
          <Plus size={16} />
          {t("newTemplate")}
        </button>
      </div>

      {loading && (
        <div style={styles.centered}>
          <Loader2 size={28} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {!loading && error && (
        <div style={styles.errorBox}>
          <AlertCircle size={16} color="#dc2626" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && templates.length === 0 && (
        <div style={styles.emptyBox}>
          <Layout size={40} color="#cbd5e1" />
          <p style={styles.emptyText}>{t("empty")}</p>
          <button style={styles.newBtn} onClick={openCreate}>
            <Plus size={15} />
            {t("newTemplate")}
          </button>
        </div>
      )}

      {!loading && !error && templates.length > 0 && (
        <div style={styles.list}>
          {templates.map((tpl) => (
            <div key={tpl.id} style={styles.listRow} onClick={() => openDetail(tpl.id)}>
              <div style={styles.listIconWrap}>
                <Layout size={18} color="#2563eb" />
              </div>

              <div style={styles.listInfo}>
                <p style={styles.listName}>{tpl.name}</p>
                <p style={styles.listCourse}>
                  {tCourse.has(tpl.courseCode) ? tCourse(tpl.courseCode) : tpl.courseCode}
                </p>
              </div>

              <div style={styles.listMeta}>
                <div style={styles.metaItem}>
                  <Calendar size={13} color="#94a3b8" />
                  <span style={styles.metaText}>{t(`days.${tpl.dayOfWeek}`)}</span>
                </div>
                <div style={styles.metaItem}>
                  <Clock size={13} color="#94a3b8" />
                  <span style={styles.metaText}>
                    {fmtTime(tpl.startLocalTime)} – {fmtTime(tpl.endLocalTime)}
                  </span>
                </div>
              </div>

              <ChevronRight size={18} color="#cbd5e1" />
            </div>
          ))}
        </div>
      )}

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
  page: { display: "flex", flexDirection: "column", gap: "24px", maxWidth: "860px" },
  centered: { display: "flex", justifyContent: "center", padding: "60px 0" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: "26px", fontWeight: "400", color: "#1a1a2e", fontFamily: "'DM Serif Display', serif" },
  subtitle: { fontSize: "14px", color: "#64748b", marginTop: "4px" },
  newBtn: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "9px 18px", background: "#2563eb", color: "#ffffff",
    border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "500",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif", flexShrink: 0,
  },
  backBtn: {
    display: "flex", alignItems: "center", gap: "6px",
    padding: "8px 14px", background: "#f1f5f9", color: "#475569",
    border: "none", borderRadius: "8px", fontSize: "14px", fontWeight: "500",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  errorBox: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "14px",
  },
  successBox: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "#f0fdf4", border: "1px solid #bbf7d0",
    borderRadius: "10px", padding: "12px 16px", color: "#16a34a", fontSize: "14px",
  },
  emptyBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    gap: "16px", padding: "60px 0",
  },
  emptyText: { fontSize: "15px", color: "#94a3b8" },
  list: { display: "flex", flexDirection: "column", gap: "8px" },
  listRow: {
    display: "flex", alignItems: "center", gap: "16px",
    background: "#ffffff", border: "1px solid #e2e8f0",
    borderRadius: "14px", padding: "16px 20px",
    cursor: "pointer", transition: "border-color 0.15s",
  },
  listIconWrap: {
    width: "40px", height: "40px", background: "#eff6ff",
    borderRadius: "10px", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  listInfo: { flex: 1, minWidth: 0 },
  listName: { fontSize: "15px", fontWeight: "600", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" },
  listCourse: { fontSize: "13px", color: "#64748b", marginTop: "2px", fontFamily: "'DM Sans', sans-serif" },
  listMeta: { display: "flex", flexDirection: "column", gap: "4px", alignItems: "flex-end" },
  metaItem: { display: "flex", alignItems: "center", gap: "5px" },
  metaText: { fontSize: "13px", color: "#64748b", fontFamily: "'DM Sans', sans-serif" },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" },
  pageBtn: {
    padding: "8px 20px", borderRadius: "8px", border: "1px solid #e2e8f0",
    background: "#ffffff", fontSize: "14px", fontWeight: "500",
    color: "#374151", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  pageBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  pageInfo: { fontSize: "14px", color: "#64748b" },

  // Detail
  detailCard: {
    background: "#ffffff", border: "1px solid #e2e8f0",
    borderRadius: "16px", padding: "28px", display: "flex",
    flexDirection: "column", gap: "24px",
  },
  detailHeader: { display: "flex", alignItems: "center", gap: "14px" },
  detailIconWrap: {
    width: "48px", height: "48px", background: "#eff6ff",
    borderRadius: "12px", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0,
  },
  detailName: { fontSize: "18px", fontWeight: "600", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" },
  detailCourse: { fontSize: "13px", color: "#64748b", marginTop: "2px", fontFamily: "'DM Sans', sans-serif" },
  statusChip: {
    display: "flex", alignItems: "center", gap: "5px",
    borderRadius: "20px", padding: "4px 12px", fontSize: "12px",
    fontWeight: "500", marginLeft: "auto", fontFamily: "'DM Sans', sans-serif",
  },
  statusActive: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
  statusInactive: { background: "#f8fafc", border: "1px solid #e2e8f0", color: "#94a3b8" },
  detailGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px",
  },
  detailSection: {
    background: "#f8fafc", borderRadius: "10px", padding: "14px 16px",
  },
  sectionLabel: { fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px", fontFamily: "'DM Sans', sans-serif" },
  sectionValue: { fontSize: "14px", fontWeight: "500", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" },
  updateNote: {
    display: "flex", alignItems: "center", gap: "8px",
    background: "#fffbeb", border: "1px solid #fde68a",
    borderRadius: "8px", padding: "10px 14px",
    fontSize: "13px", color: "#92400e",
  },

  // Create
  createCard: {
    background: "#ffffff", border: "1px solid #e2e8f0",
    borderRadius: "16px", padding: "28px", display: "flex",
    flexDirection: "column", gap: "20px",
  },
  createTitle: { fontSize: "18px", fontWeight: "600", color: "#1a1a2e", fontFamily: "'DM Serif Display', serif" },
  createSubtitle: { fontSize: "14px", color: "#64748b", marginTop: "-12px" },
  formGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px",
  },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "7px" },
  fieldLabel: { fontSize: "13px", fontWeight: "500", color: "#374151", fontFamily: "'DM Sans', sans-serif" },
  input: {
    padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px",
    fontSize: "14px", color: "#1a1a2e", background: "#ffffff", outline: "none",
    fontFamily: "'DM Sans', sans-serif", width: "100%",
  },
  select: {
    padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px",
    fontSize: "14px", color: "#1a1a2e", background: "#ffffff", outline: "none",
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer", width: "100%",
  },
  toggleRow: {
    display: "flex", alignItems: "center", gap: "8px", cursor: "pointer",
  },
  checkbox: { width: "16px", height: "16px", cursor: "pointer", accentColor: "#2563eb" },
  createActions: { display: "flex", justifyContent: "flex-end", gap: "10px" },
  cancelBtn: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "9px 18px", background: "#ffffff", color: "#64748b",
    border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px",
    fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  createBtn: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "9px 20px", background: "#2563eb", color: "#ffffff",
    border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "500",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
};