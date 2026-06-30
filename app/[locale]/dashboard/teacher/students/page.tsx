"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Users, Search, Loader2, AlertCircle,
  UserCircle2, Check, X, Clock,
} from "lucide-react";
import api from "@/lib/api";
import { ApiResponse, PagedResponse, SubscriberOutputDto } from "@/types";

const PAGE_SIZE = 10;
type Tab = "subscribers" | "requests";

interface DecideState {
  studentId: string;
  loading: boolean;
  result: "accepted" | "rejected" | null;
}

export default function TeacherStudentsPage() {
  const t = useTranslations("teacherStudents");

  const [activeTab, setActiveTab] = useState<Tab>("subscribers");

  // ── Subscribers state ──
  const [subscribers, setSubscribers] = useState<SubscriberOutputDto[]>([]);
  const [subPage, setSubPage] = useState(1);
  const [subTotalCount, setSubTotalCount] = useState(0);
  const [subTotalPages, setSubTotalPages] = useState(1);
  const [subHasNext, setSubHasNext] = useState(false);
  const [subHasPrev, setSubHasPrev] = useState(false);
  const [subLoading, setSubLoading] = useState(true);
  const [subError, setSubError] = useState("");
  const [subSearch, setSubSearch] = useState("");

  // ── Requests state ──
  const [requests, setRequests] = useState<SubscriberOutputDto[]>([]);
  const [reqPage, setReqPage] = useState(1);
  const [reqTotalCount, setReqTotalCount] = useState(0);
  const [reqTotalPages, setReqTotalPages] = useState(1);
  const [reqHasNext, setReqHasNext] = useState(false);
  const [reqHasPrev, setReqHasPrev] = useState(false);
  const [reqLoading, setReqLoading] = useState(true);
  const [reqError, setReqError] = useState("");

  // ── Decide state ──
  const [decideStates, setDecideStates] = useState<Record<string, DecideState>>({});

  // ── Fetch subscribers (status=1 Accepted) ──
  const fetchSubscribers = useCallback(async (page: number) => {
    setSubLoading(true);
    setSubError("");
    try {
      const res = await api.get<ApiResponse<PagedResponse<SubscriberOutputDto>>>(
        "/api/Subscription/1/subscribers",
        { params: { page, pageSize: PAGE_SIZE } }
      );
      if (!res.data.success || !res.data.data) {
        setSubscribers([]);
        setSubTotalCount(0);
        return;
      }
      const paged = res.data.data;
      setSubscribers(paged.items);
      setSubTotalCount(paged.totalCount);
      setSubTotalPages(paged.totalPages);
      setSubHasNext(paged.hasNext);
      setSubHasPrev(paged.hasPrevious);
    } catch {
      setSubError(t("errorDefault"));
    } finally {
      setSubLoading(false);
    }
  }, [t]);

  // ── Fetch requests (status=0 Requested) ──
  const fetchRequests = useCallback(async (page: number) => {
    setReqLoading(true);
    setReqError("");
    try {
      const res = await api.get<ApiResponse<PagedResponse<SubscriberOutputDto>>>(
        "/api/Subscription/0/subscribers",
        { params: { page, pageSize: PAGE_SIZE } }
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

  useEffect(() => { fetchSubscribers(subPage); }, [subPage]);
  useEffect(() => { fetchRequests(reqPage); }, [reqPage]);

  // ── Decide (onayla / reddet) ──
  const handleDecide = async (studentId: string, isAccepted: boolean) => {
    setDecideStates((prev) => ({
      ...prev,
      [studentId]: { studentId, loading: true, result: null },
    }));

    try {
      const res = await api.post<ApiResponse<boolean>>("/api/Subscription/decide", {
        studentId,
        isAccepted,
      });

      if (!res.data.success) {
        setDecideStates((prev) => ({
          ...prev,
          [studentId]: { studentId, loading: false, result: null },
        }));
        return;
      }

      setDecideStates((prev) => ({
        ...prev,
        [studentId]: {
          studentId,
          loading: false,
          result: isAccepted ? "accepted" : "rejected",
        },
      }));

      // 1.5sn sonra listeden kaldır
      setTimeout(() => {
        setRequests((prev) => prev.filter((r) => r.studentId !== studentId));
        setReqTotalCount((c) => c - 1);
        setDecideStates((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
        // Kabul edildiyse subscriber listesini yenile
        if (isAccepted) fetchSubscribers(subPage);
      }, 1500);

    } catch {
      setDecideStates((prev) => ({
        ...prev,
        [studentId]: { studentId, loading: false, result: null },
      }));
    }
  };

  const initials = (f: string, l: string) =>
    `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase();

  const filteredSubscribers = subscribers.filter((s) => {
    const full = `${s.firstName} ${s.lastName} ${s.displayName ?? ""}`.toLowerCase();
    return full.includes(subSearch.toLowerCase());
  });

  // ════════════════════════════════════════════════════════
  return (
    <div style={styles.page}>
      {/* Başlık */}
      <div style={styles.header}>
        <h1 style={styles.title}>{t("title")}</h1>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          style={{ ...styles.tab, ...(activeTab === "subscribers" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("subscribers")}
        >
          <Users size={16} />
          {t("tabSubscribers")}
          {subTotalCount > 0 && (
            <span style={{
              ...styles.tabBadge,
              ...(activeTab === "subscribers" ? styles.tabBadgeActive : {}),
            }}>
              {subTotalCount}
            </span>
          )}
        </button>
        <button
          style={{ ...styles.tab, ...(activeTab === "requests" ? styles.tabActive : {}) }}
          onClick={() => setActiveTab("requests")}
        >
          <Clock size={16} />
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

      {/* ── Subscribers Tab ── */}
      {activeTab === "subscribers" && (
        <div style={styles.tabContent}>
          {/* Arama */}
          <div style={styles.searchWrap}>
            <Search size={15} color="#94a3b8" style={styles.searchIcon} />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={subSearch}
              onChange={(e) => setSubSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {subLoading && <div style={styles.centered}><Loader2 size={26} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} /></div>}

          {!subLoading && subError && (
            <div style={styles.errorBox}><AlertCircle size={16} color="#dc2626" /><span>{subError}</span></div>
          )}

          {!subLoading && !subError && subscribers.length === 0 && (
            <div style={styles.emptyBox}><Users size={38} color="#cbd5e1" /><p style={styles.emptyText}>{t("empty")}</p></div>
          )}

          {!subLoading && !subError && filteredSubscribers.length > 0 && (
            <div style={styles.list}>
              {filteredSubscribers.map((s) => (
                <div key={s.studentId} style={styles.card}>
                  <div style={styles.avatar}>
                    {s.photo
                      ? <img src={s.photo} alt="" style={styles.avatarImg} />
                      : <span style={styles.avatarInitials}>{initials(s.firstName, s.lastName)}</span>
                    }
                  </div>
                  <div style={styles.info}>
                    <p style={styles.name}>{s.firstName} {s.lastName}</p>
                    {s.displayName && <p style={styles.displayName}>@{s.displayName}</p>}
                  </div>
                  <button style={styles.profileBtn} title={t("viewProfile")}>
                    <UserCircle2 size={17} color="#64748b" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {!subLoading && !subError && subscribers.length > 0 && filteredSubscribers.length === 0 && (
            <div style={styles.emptyBox}><Search size={30} color="#cbd5e1" /><p style={styles.emptyText}>{t("noResults")}</p></div>
          )}

          {!subLoading && subTotalPages > 1 && (
            <div style={styles.pagination}>
              <button onClick={() => setSubPage((p) => p - 1)} disabled={!subHasPrev}
                style={{ ...styles.pageBtn, ...(!subHasPrev ? styles.pageBtnDisabled : {}) }}>
                ← {t("prev")}
              </button>
              <span style={styles.pageInfo}>{subPage} / {subTotalPages}</span>
              <button onClick={() => setSubPage((p) => p + 1)} disabled={!subHasNext}
                style={{ ...styles.pageBtn, ...(!subHasNext ? styles.pageBtnDisabled : {}) }}>
                {t("next")} →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Requests Tab ── */}
      {activeTab === "requests" && (
        <div style={styles.tabContent}>
          {reqLoading && <div style={styles.centered}><Loader2 size={26} color="#2563eb" style={{ animation: "spin 1s linear infinite" }} /></div>}

          {!reqLoading && reqError && (
            <div style={styles.errorBox}><AlertCircle size={16} color="#dc2626" /><span>{reqError}</span></div>
          )}

          {!reqLoading && !reqError && requests.length === 0 && (
            <div style={styles.emptyBox}><Clock size={38} color="#cbd5e1" /><p style={styles.emptyText}>{t("emptyRequests")}</p></div>
          )}

          {!reqLoading && !reqError && requests.length > 0 && (
            <div style={styles.list}>
              {requests.map((r) => {
                const decide = decideStates[r.studentId];
                const isDeciding = decide?.loading;
                const result = decide?.result;

                return (
                  <div key={r.studentId} style={{
                    ...styles.card,
                    ...(result === "accepted" ? styles.cardAccepted : {}),
                    ...(result === "rejected" ? styles.cardRejected : {}),
                  }}>
                    <div style={styles.avatar}>
                      {r.photo
                        ? <img src={r.photo} alt="" style={styles.avatarImg} />
                        : <span style={styles.avatarInitials}>{initials(r.firstName, r.lastName)}</span>
                      }
                    </div>

                    <div style={styles.info}>
                      <p style={styles.name}>{r.firstName} {r.lastName}</p>
                      {r.displayName && <p style={styles.displayName}>@{r.displayName}</p>}
                    </div>

                    {/* Sonuç göster */}
                    {result && (
                      <div style={{
                        ...styles.resultChip,
                        ...(result === "accepted" ? styles.resultAccepted : styles.resultRejected),
                      }}>
                        {result === "accepted"
                          ? <><Check size={13} />{t("accepted")}</>
                          : <><X size={13} />{t("rejected")}</>
                        }
                      </div>
                    )}

                    {/* Karar butonları */}
                    {!result && (
                      <div style={styles.decideRow}>
                        <button
                          style={styles.acceptBtn}
                          disabled={isDeciding}
                          onClick={() => handleDecide(r.studentId, true)}
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
                          onClick={() => handleDecide(r.studentId, false)}
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
              <button onClick={() => setReqPage((p) => p - 1)} disabled={!reqHasPrev}
                style={{ ...styles.pageBtn, ...(!reqHasPrev ? styles.pageBtnDisabled : {}) }}>
                ← {t("prev")}
              </button>
              <span style={styles.pageInfo}>{reqPage} / {reqTotalPages}</span>
              <button onClick={() => setReqPage((p) => p + 1)} disabled={!reqHasNext}
                style={{ ...styles.pageBtn, ...(!reqHasNext ? styles.pageBtnDisabled : {}) }}>
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
  page: { display: "flex", flexDirection: "column", gap: "20px", maxWidth: "860px" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: "26px", fontWeight: "400", color: "#1a1a2e", fontFamily: "'DM Serif Display', serif" },
  tabs: {
    display: "flex", gap: "4px",
    background: "#f1f5f9", borderRadius: "12px", padding: "4px",
    width: "fit-content",
  },
  tab: {
    display: "flex", alignItems: "center", gap: "7px",
    padding: "8px 18px", borderRadius: "9px", border: "none",
    background: "transparent", color: "#64748b", fontSize: "14px",
    fontWeight: "500", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
    transition: "all 0.15s",
  },
  tabActive: {
    background: "#ffffff", color: "#1a1a2e",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  tabBadge: {
    background: "#e2e8f0", color: "#64748b",
    borderRadius: "20px", padding: "1px 8px",
    fontSize: "12px", fontWeight: "600",
  },
  tabBadgeActive: { background: "#dbeafe", color: "#2563eb" },
  tabBadgeWarning: { background: "#fef3c7", color: "#d97706" },
  tabContent: { display: "flex", flexDirection: "column", gap: "16px" },
  searchWrap: { position: "relative", maxWidth: "340px" },
  searchIcon: { position: "absolute", left: "13px", top: "50%", transform: "translateY(-50%)" },
  searchInput: {
    width: "100%", padding: "9px 14px 9px 38px",
    border: "1.5px solid #e2e8f0", borderRadius: "10px",
    fontSize: "14px", color: "#1a1a2e", background: "#ffffff",
    outline: "none", fontFamily: "'DM Sans', sans-serif",
  },
  centered: { display: "flex", justifyContent: "center", padding: "48px 0" },
  errorBox: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "10px", padding: "12px 16px", color: "#dc2626", fontSize: "14px",
  },
  emptyBox: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "48px 0" },
  emptyText: { fontSize: "14px", color: "#94a3b8" },
  list: { display: "flex", flexDirection: "column", gap: "8px" },
  card: {
    display: "flex", alignItems: "center", gap: "14px",
    background: "#ffffff", border: "1px solid #e2e8f0",
    borderRadius: "14px", padding: "14px 18px",
    transition: "border-color 0.2s",
  },
  cardAccepted: { border: "1px solid #bbf7d0", background: "#f0fdf4" },
  cardRejected: { border: "1px solid #fecaca", background: "#fef2f2" },
  avatar: {
    width: "42px", height: "42px", borderRadius: "50%",
    background: "#dbeafe", display: "flex", alignItems: "center",
    justifyContent: "center", flexShrink: 0, overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  avatarInitials: { fontSize: "14px", fontWeight: "700", color: "#1d4ed8", fontFamily: "'DM Sans', sans-serif" },
  info: { flex: 1 },
  name: { fontSize: "14px", fontWeight: "600", color: "#1a1a2e", fontFamily: "'DM Sans', sans-serif" },
  displayName: { fontSize: "12px", color: "#94a3b8", marginTop: "2px", fontFamily: "'DM Sans', sans-serif" },
  profileBtn: {
    background: "#f8fafc", border: "1px solid #e2e8f0",
    borderRadius: "8px", padding: "7px", cursor: "pointer",
    display: "flex", alignItems: "center",
  },
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
    borderRadius: "20px", padding: "5px 12px",
    fontSize: "12px", fontWeight: "500", flexShrink: 0,
    fontFamily: "'DM Sans', sans-serif",
  },
  resultAccepted: { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a" },
  resultRejected: { background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" },
  pagination: { display: "flex", alignItems: "center", justifyContent: "center", gap: "16px" },
  pageBtn: {
    padding: "7px 18px", borderRadius: "8px", border: "1px solid #e2e8f0",
    background: "#ffffff", fontSize: "14px", fontWeight: "500",
    color: "#374151", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
  },
  pageBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  pageInfo: { fontSize: "14px", color: "#64748b", fontFamily: "'DM Sans', sans-serif" },
};