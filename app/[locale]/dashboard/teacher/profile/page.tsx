"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  UserCircle, Clock, Globe, BookOpen, Loader2, AlertCircle,
  Pencil, BadgeDollarSign, X, Plus, Check, Trash2,
} from "lucide-react";
import api from "@/lib/api";
import {
  ApiResponse, TeacherDetailOutputDto, TeacherProfileUpdateInputDto,
  TeacherCourseInputDto, CourseOutputDto, Currency,
  TeacherLanguageOutputDto, TeacherLanguageInputDto,
  LanguageOutputDto, LanguageLevelOutputDto,
} from "@/types";
import { Languages } from "lucide-react";
import { CourseApi, TeacherApi } from "@/constants/api-constants";

const CURRENCY_LABELS: Record<number, string> = {
  0: "TRY", 1: "USD", 2: "EUR", 3: "CNY", 4: "KRW", 5: "JPY",
};

const CURRENCY_OPTIONS = Object.entries(CURRENCY_LABELS).map(([value, label]) => ({
  value: Number(value) as Currency, label,
}));

export default function TeacherProfilePage() {
  const t = useTranslations("teacherProfile");
  const tCourse = useTranslations("courseCodes");
  const tLang = useTranslations("languageCodes");

  const [detail, setDetail] = useState<TeacherDetailOutputDto | null>(null);
  const [allCourses, setAllCourses] = useState<CourseOutputDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [formCourses, setFormCourses] = useState<TeacherCourseInputDto[]>([]);

  const [languages, setLanguages] = useState<TeacherLanguageOutputDto[]>([]);
  const [allLanguages, setAllLanguages] = useState<LanguageOutputDto[]>([]);
  const [languageLevels, setLanguageLevels] = useState<LanguageLevelOutputDto[]>([]);
  const [formLanguages, setFormLanguages] = useState<TeacherLanguageInputDto[]>([]);
  const [savingLanguages, setSavingLanguages] = useState(false);
  const [languageSaveError, setLanguageSaveError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [detailRes, coursesRes, languagesRes, allLanguagesRes, levelsRes] = await Promise.all([
          api.get<ApiResponse<TeacherDetailOutputDto>>("api/Teacher/details"),
          api.get<ApiResponse<CourseOutputDto[]>>("api/Course/all"),
          api.get<ApiResponse<TeacherLanguageOutputDto[]>>("/api/Teacher/languages"),
          api.get<ApiResponse<LanguageOutputDto[]>>("/api/Language/all"),
          api.get<ApiResponse<LanguageLevelOutputDto[]>>("/api/Language/levels"),
        ]);
        if (!detailRes.data.success || !detailRes.data.data) {
          setError(detailRes.data.message);
          return;
        }
        if (coursesRes.data.success && coursesRes.data.data) {
          setAllCourses(coursesRes.data.data);
        }
        setDetail(detailRes.data.data);

        if (languagesRes.data.success && languagesRes.data.data)
              setLanguages(languagesRes.data.data);
        if (allLanguagesRes.data.success && allLanguagesRes.data.data)
              setAllLanguages(allLanguagesRes.data.data);
        if (levelsRes.data.success && levelsRes.data.data)
              setLanguageLevels(levelsRes.data.data);

      } catch {
        setError(t("errorDefault"));
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const openEdit = () => {
    if (!detail) return;
    setDisplayName(detail.displayName ?? "");
    setBio(detail.bio ?? "");
    setFormCourses(
      (detail.teacherCourses ?? []).map((c) => ({
        id: c.id,
        courseId: c.courseId,
        price: c.price,
        durationMinutes: c.durationMinutes,
        currency: c.currency,
      }))
    );
    setFormLanguages(
      languages.map((l) => ({
      languageId: l.languageId,
      languageLevel: l.languageLevel,
      }))
    );
    setSaveError("");
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const handleSave = async () => {
  setSaving(true);
  setSaveError("");
  try {
    const [profileRes, langRes] = await Promise.all([
      api.put<ApiResponse<TeacherDetailOutputDto>>("api/Teacher", {
        displayName: displayName || null,
        bio: bio || null,
        teacherCourses: formCourses,
      }),
      api.put<ApiResponse<TeacherLanguageOutputDto[]>>(
        "/api/Teacher/languages",
        formLanguages
      ),
    ]);

    if (!profileRes.data.success || !profileRes.data.data) {
      setSaveError(profileRes.data.message);
      return;
    }
    if (!langRes.data.success || !langRes.data.data) {
      setSaveError(langRes.data.message);
      return;
    }

    setDetail(profileRes.data.data);
    setLanguages(langRes.data.data);
    setIsEditing(false);
  } catch {
    setSaveError(t("saveError"));
  } finally {
    setSaving(false);
  }
};
  // Kurs satırı ekle
  const addCourseRow = () => {
    if (allCourses.length === 0) return;
    const firstAvailable = allCourses.find(
      (c) => !formCourses.some((fc) => fc.courseId === c.id)
    );
    if (!firstAvailable) return;
    setFormCourses((prev) => [
      ...prev,
      { courseId: firstAvailable.id, price: 0, durationMinutes: 60, currency: 1 },
    ]);
  };

  const removeCourseRow = (index: number) => {
    setFormCourses((prev) => prev.filter((_, i) => i !== index));
  };

  const addLanguageRow = () => {
  const firstAvailable = allLanguages.find(
    (l) => !formLanguages.some((fl) => fl.languageId === l.id)
  );
  if (!firstAvailable) return;
  setFormLanguages((prev) => [
    ...prev,
    { languageId: firstAvailable.id, languageLevel: 2 },
  ]);
};

const removeLanguageRow = (index: number) => {
  setFormLanguages((prev) => prev.filter((_, i) => i !== index));
};

const updateLanguageRow = (index: number, field: keyof TeacherLanguageInputDto, value: unknown) => {
  setFormLanguages((prev) =>
    prev.map((l, i) => (i === index ? { ...l, [field]: value } : l))
  );
};

const availableLanguagesFor = (index: number) =>
  allLanguages.filter(
    (l) => !formLanguages.some((fl, i) => i !== index && fl.languageId === l.id)
  );

const handleSaveLanguages = async () => {
  setSavingLanguages(true);
  setLanguageSaveError("");
  try {
    const response = await api.put<ApiResponse<TeacherLanguageOutputDto[]>>(
      "/api/Teacher/languages",
      formLanguages
    );
    if (!response.data.success || !response.data.data) {
      setLanguageSaveError(response.data.message);
      return;
    }
    setLanguages(response.data.data);
    setIsEditing(false);
  } catch {
    setLanguageSaveError(t("languageSaveError"));
  } finally {
    setSavingLanguages(false);
  }
  };

  const updateCourseRow = (index: number, field: keyof TeacherCourseInputDto, value: unknown) => {
    setFormCourses((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  // Zaten eklenmiş kurslar hariç dropdown seçenekleri
  const availableCoursesFor = (index: number) =>
    allCourses.filter(
      (c) => !formCourses.some((fc, i) => i !== index && fc.courseId === c.id)
    );

  if (loading) return (
    <div style={styles.centered}>
      <Loader2 size={28} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (error) return (
    <div style={styles.errorBox}>
      <AlertCircle size={18} color="#dc2626" />
      <span>{error}</span>
    </div>
  );

  if (!detail) return null;

  return (
    <div style={styles.page}>
      {/* Başlık */}
      <div style={styles.header}>
        <h1 style={styles.title}>{t("title")}</h1>
        {!isEditing ? (
          <button style={styles.editBtn} onClick={openEdit}>
            <Pencil size={15} />
            {t("edit")}
          </button>
        ) : (
          <div style={styles.actionRow}>
            <button style={styles.cancelBtn} onClick={cancelEdit} disabled={saving}>
              <X size={15} />
              {t("cancel")}
            </button>
            <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving
                ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                : <Check size={15} />
              }
              {t("save")}
            </button>
          </div>
        )}
      </div>

      {saveError && (
        <div style={styles.errorBox}>
          <AlertCircle size={16} color="#dc2626" />
          <span>{saveError}</span>
        </div>
      )}

      <div style={styles.layout}>
        {/* Sol kolon */}
        <div style={styles.leftCol}>
          {/* Profil kartı */}
          <div style={styles.card}>
            <div style={styles.avatarLarge}>
              <UserCircle size={56} color="#2563eb" />
            </div>

            {isEditing ? (
              <div style={styles.fieldGroup}>
                <label style={styles.fieldLabel}>{t("displayName")}</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={t("displayNamePlaceholder")}
                  style={styles.input}
                />
                <label style={{ ...styles.fieldLabel, marginTop: "12px" }}>{t("bio")}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder={t("bioPlaceholder")}
                  rows={4}
                  style={styles.textarea}
                />
              </div>
            ) : (
              <>
                <p style={styles.displayName}>{detail.displayName ?? t("noDisplayName")}</p>
                <p style={styles.bioText}>{detail.bio ?? t("noBio")}</p>
              </>
            )}
          </div>

          {/* Genel bilgiler */}
          <div style={styles.card}>
            <p style={styles.cardTitle}>{t("generalInfo")}</p>
            <div style={styles.infoList}>
              <div style={styles.infoRow}>
                <div style={styles.infoIcon}><Clock size={16} color="#2563eb" /></div>
                <div>
                  <p style={styles.infoLabel}>{t("lessonDuration")}</p>
                  <p style={styles.infoValue}>{detail.durationMinutes} {t("minutes")}</p>
                </div>
              </div>
              <div style={styles.infoRow}>
                <div style={styles.infoIcon}><Globe size={16} color="#2563eb" /></div>
                <div>
                  <p style={styles.infoLabel}>{t("timezone")}</p>
                  <p style={styles.infoValue}>{detail.timeZoneId}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ kolon — Kurslar */}
        <div style={styles.rightCol}>
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <p style={{ ...styles.cardTitle, marginBottom: 0 }}>{t("courses")}</p>
              <div style={styles.cardHeaderRight}>
                <span style={styles.courseCount}>
                  {(isEditing ? formCourses : detail.teacherCourses ?? []).length} {t("course")}
                </span>
                {isEditing && (
                  <button style={styles.addCourseBtn} onClick={addCourseRow}>
                    <Plus size={14} />
                    {t("addCourse")}
                  </button>
                )}
              </div>
            </div>

            {/* Görüntüleme modu */}
            {!isEditing && (
              <>
                {!detail.teacherCourses || detail.teacherCourses.length === 0 ? (
                  <div style={styles.emptyBox}>
                    <BookOpen size={32} color="#cbd5e1" />
                    <p style={styles.emptyText}>{t("noCourses")}</p>
                  </div>
                ) : (
                  <div style={{ ...styles.courseList, marginTop: "16px" }}>
                    {detail.teacherCourses.map((course) => (
                      <div key={course.id} style={styles.courseRow}>
                        <div style={styles.courseLeft}>
                          <div style={styles.courseIconWrap}>
                            <BookOpen size={18} color="#2563eb" />
                          </div>
                          <div>
                            <p style={styles.courseName}>
                              {tCourse.has(course.code) ? tCourse(course.code) : course.name}
                            </p>
                            <p style={styles.courseCode}>{course.code.toUpperCase()}</p>
                          </div>
                        </div>
                        <div style={styles.courseMeta}>
                          <Clock size={13} color="#94a3b8" />
                          <span style={styles.courseMetaText}>{course.durationMinutes} {t("minutes")}</span>
                        </div>
                        <div style={styles.priceChip}>
                          <BadgeDollarSign size={14} color="#16a34a" />
                          <span style={styles.priceText}>
                            {course.price.toFixed(2)} {CURRENCY_LABELS[course.currency]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Düzenleme modu */}
            {isEditing && (
              <div style={{ ...styles.courseList, marginTop: "16px" }}>
                {formCourses.length === 0 && (
                  <div style={styles.emptyBox}>
                    <BookOpen size={32} color="#cbd5e1" />
                    <p style={styles.emptyText}>{t("noCourses")}</p>
                  </div>
                )}
                {formCourses.map((fc, index) => (
                  <div key={index} style={styles.editCourseRow}>
                    {/* Kurs seçimi */}
                    <select
                      value={fc.courseId}
                      onChange={(e) => updateCourseRow(index, "courseId", e.target.value)}
                      style={styles.select}
                    >
                      {availableCoursesFor(index).map((c) => (
                        <option key={c.id} value={c.id}>
                          {tCourse.has(c.code) ? tCourse(c.code) : c.name}
                        </option>
                      ))}
                      {/* Seçili olan her zaman göster */}
                      {!availableCoursesFor(index).find((c) => c.id === fc.courseId) && (
                        <option value={fc.courseId}>
                          {(() => {
                            const c = allCourses.find((c) => c.id === fc.courseId);
                            return c ? (tCourse.has(c.code) ? tCourse(c.code) : c.name) : fc.courseId;
                          })()}
                        </option>
                      )}
                    </select>

                    {/* Süre */}
                    <input
                      type="number"
                      min={15}
                      value={fc.durationMinutes}
                      onChange={(e) => updateCourseRow(index, "durationMinutes", Number(e.target.value))}
                      style={{ ...styles.input, width: "80px" }}
                      title={t("lessonDuration")}
                    />
                    <span style={styles.inputSuffix}>{t("minutes")}</span>

                    {/* Fiyat */}
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={fc.price}
                      onChange={(e) => updateCourseRow(index, "price", Number(e.target.value))}
                      style={{ ...styles.input, width: "90px" }}
                      title={t("price")}
                    />

                    {/* Para birimi */}
                    <select
                      value={fc.currency}
                      onChange={(e) => updateCourseRow(index, "currency", Number(e.target.value) as Currency)}
                      style={{ ...styles.select, width: "90px" }}
                    >
                      {CURRENCY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    {/* Sil */}
                    <button style={styles.deleteBtn} onClick={() => removeCourseRow(index)}>
                      <Trash2 size={15} color="#ef4444" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* Dil kartı */}
<div style={styles.card}>
  <div style={styles.cardHeader}>
    <p style={{ ...styles.cardTitle, marginBottom: 0 }}>{t("languages")}</p>
    <div style={styles.cardHeaderRight}>
      <span style={styles.courseCount}>
        {(isEditing ? formLanguages : languages).length} {t("language")}
      </span>
      {isEditing && (
        <button style={styles.addCourseBtn} onClick={addLanguageRow}>
          <Plus size={14} />
          {t("addLanguage")}
        </button>
      )}
    </div>
  </div>

  {/* Görüntüleme modu */}
  {!isEditing && (
    <div style={{ ...styles.courseList, marginTop: "16px" }}>
      {languages.length === 0 ? (
        <div style={styles.emptyBox}>
          <Languages size={32} color="#cbd5e1" />
          <p style={styles.emptyText}>{t("noLanguages")}</p>
        </div>
      ) : (
        languages.map((lang) => (
          <div key={lang.id} style={styles.courseRow}>
            <div style={styles.courseLeft}>
              <div style={styles.courseIconWrap}>
                <Languages size={18} color="#2563eb" />
              </div>
              <div>
                <p style={styles.courseName}>
                  {tLang.has(lang.languageCode)
                    ? tLang(lang.languageCode)
                    : lang.languageCode}
                </p>
                <p style={styles.courseCode}>{lang.languageCode.toUpperCase()}</p>
              </div>
            </div>
            <div style={styles.priceChip}>
              <span style={styles.priceText}>{lang.languageLevelName}</span>
            </div>
          </div>
        ))
      )}
    </div>
  )}

  {/* Düzenleme modu */}
  {isEditing && (
    <div style={{ ...styles.courseList, marginTop: "16px" }}>
      {formLanguages.length === 0 && (
        <div style={styles.emptyBox}>
          <Languages size={32} color="#cbd5e1" />
          <p style={styles.emptyText}>{t("noLanguages")}</p>
        </div>
      )}
      {formLanguages.map((fl, index) => (
        <div key={index} style={styles.editCourseRow}>
          {/* Dil seçimi */}
          <select
            value={fl.languageId}
            onChange={(e) => updateLanguageRow(index, "languageId", e.target.value)}
            style={styles.select}
          >
            {availableLanguagesFor(index).map((l) => (
              <option key={l.id} value={l.id}>
                {tLang.has(l.code) ? tLang(l.code) : l.code}
              </option>
            ))}
            {/* Seçili dili her zaman göster */}
            {!availableLanguagesFor(index).find((l) => l.id === fl.languageId) && (
              <option value={fl.languageId}>
                {(() => {
                  const l = allLanguages.find((l) => l.id === fl.languageId);
                  return l
                    ? (tLang.has(l.code) ? tLang(l.code) : l.code)
                    : fl.languageId;
                })()}
              </option>
            )}
          </select>

          {/* Seviye seçimi */}
          <select
            value={fl.languageLevel}
            onChange={(e) => updateLanguageRow(index, "languageLevel", Number(e.target.value))}
            style={{ ...styles.select, flex: "0 0 150px" }}
          >
            {languageLevels.map((lvl) => (
              <option key={lvl.id} value={lvl.id}>{lvl.name}</option>
            ))}
          </select>

          {/* Sil */}
          <button style={styles.deleteBtn} onClick={() => removeLanguageRow(index)}>
            <Trash2 size={15} color="#ef4444" />
          </button>
        </div>
      ))}
    </div>
  )}

  {/* Dil kaydetme hatası */}
  {languageSaveError && (
    <div style={{ ...styles.errorBox, marginTop: "12px" }}>
      <AlertCircle size={14} color="#dc2626" />
      <span>{languageSaveError}</span>
    </div>
  )}
</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", flexDirection: "column", gap: "24px", maxWidth: "960px" },
  centered: { display: "flex", justifyContent: "center", padding: "60px 0" },
  errorBox: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "14px 18px", color: "#dc2626", fontSize: "14px",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: "26px", fontWeight: "400", color: "#1a1a2e", fontFamily: "'DM Serif Display', serif" },
  editBtn: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "9px 18px", background: "#2563eb", color: "#ffffff",
    border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "500",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  actionRow: { display: "flex", gap: "10px" },
  cancelBtn: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "9px 18px", background: "#ffffff", color: "#64748b",
    border: "1px solid #e2e8f0", borderRadius: "10px", fontSize: "14px", fontWeight: "500",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  saveBtn: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "9px 18px", background: "#2563eb", color: "#ffffff",
    border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: "500",
    cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  layout: { display: "grid", gridTemplateColumns: "280px 1fr", gap: "20px", alignItems: "start" },
  leftCol: { display: "flex", flexDirection: "column", gap: "16px" },
  rightCol: { display: "flex", flexDirection: "column", gap: "16px" },
  card: { background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "16px", padding: "24px" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" },
  cardHeaderRight: { display: "flex", alignItems: "center", gap: "10px" },
  cardTitle: { fontSize: "15px", fontWeight: "600", color: "#374151", fontFamily: "'DM Sans', sans-serif", marginBottom: "16px" },
  courseCount: { fontSize: "12px", color: "#64748b", background: "#f1f5f9", borderRadius: "20px", padding: "3px 10px" },
  addCourseBtn: {
    display: "flex", alignItems: "center", gap: "5px",
    padding: "5px 12px", background: "#eff6ff", color: "#2563eb",
    border: "1px solid #bfdbfe", borderRadius: "8px", fontSize: "13px",
    fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  avatarLarge: {
    width: "72px", height: "72px", borderRadius: "50%", background: "#eff6ff",
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px",
  },
  displayName: { fontSize: "17px", fontWeight: "600", color: "#1a1a2e", textAlign: "center", fontFamily: "'DM Sans', sans-serif" },
  bioText: { fontSize: "13px", color: "#64748b", textAlign: "center", lineHeight: "1.6", marginTop: "8px", fontFamily: "'DM Sans', sans-serif" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "6px", width: "100%" },
  fieldLabel: { fontSize: "13px", fontWeight: "500", color: "#374151", fontFamily: "'DM Sans', sans-serif" },
  input: {
    padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px",
    fontSize: "14px", color: "#1a1a2e", background: "#ffffff", outline: "none",
    fontFamily: "'DM Sans', sans-serif", width: "100%",
  },
  textarea: {
    padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px",
    fontSize: "14px", color: "#1a1a2e", background: "#ffffff", outline: "none",
    fontFamily: "'DM Sans', sans-serif", resize: "vertical", width: "100%",
  },
  infoList: { display: "flex", flexDirection: "column", gap: "16px" },
  infoRow: { display: "flex", alignItems: "flex-start", gap: "12px" },
  infoIcon: {
    width: "32px", height: "32px", background: "#eff6ff", borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  infoLabel: { fontSize: "12px", color: "#94a3b8", fontFamily: "'DM Sans', sans-serif" },
  infoValue: { fontSize: "14px", fontWeight: "500", color: "#1a1a2e", marginTop: "2px", fontFamily: "'DM Sans', sans-serif" },
  emptyBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", padding: "32px 0" },
  emptyText: { fontSize: "14px", color: "#94a3b8" },
  courseList: { display: "flex", flexDirection: "column", gap: "10px" },
  courseRow: {
    display: "flex", alignItems: "center", gap: "16px",
    padding: "14px 16px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9",
  },
  editCourseRow: {
    display: "flex", alignItems: "center", gap: "8px",
    padding: "12px 14px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0",
    flexWrap: "wrap",
  },
  courseLeft: { display: "flex", alignItems: "center", gap: "12px", flex: 1 },
  courseIconWrap: {
    width: "36px", height: "36px", background: "#eff6ff", borderRadius: "9px",
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  courseName: { fontSize: "14px", fontWeight: "600", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" },
  courseCode: { fontSize: "11px", color: "#94a3b8", marginTop: "2px", letterSpacing: "0.5px" },
  courseMeta: { display: "flex", alignItems: "center", gap: "5px" },
  courseMetaText: { fontSize: "13px", color: "#64748b", fontFamily: "'DM Sans', sans-serif" },
  priceChip: {
    display: "flex", alignItems: "center", gap: "5px",
    background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "20px", padding: "4px 12px", flexShrink: 0,
  },
  priceText: { fontSize: "13px", fontWeight: "600", color: "#16a34a", fontFamily: "'DM Sans', sans-serif" },
  select: {
    padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: "8px",
    fontSize: "14px", color: "#1a1a2e", background: "#ffffff", outline: "none",
    fontFamily: "'DM Sans', sans-serif", cursor: "pointer", flex: 1,
  },
  inputSuffix: { fontSize: "13px", color: "#94a3b8", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif" },
  deleteBtn: {
    background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px",
    padding: "7px", cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0,
  },
};