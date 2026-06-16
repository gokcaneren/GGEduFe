"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { Eye, EyeOff, BookOpen, ArrowRight, Loader2 } from "lucide-react";
import { authService } from "@/lib/auth";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const loginSchema = z.object({
    email: z.string().email(t("validation.emailInvalid")),
    password: z.string().min(6, t("validation.passwordMin")),
  });

  type LoginForm = z.infer<typeof loginSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setApiError("");
    try {
      const response = await authService.login(data);
      authService.saveSession(response);
      router.push(
        response.user.role === 0
          ? `/${locale}/dashboard/teacher`
          : `/${locale}/dashboard/student`
      );
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setApiError(err.response?.data?.message || t("login.errorDefault"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Sol panel */}
      <div style={styles.leftPanel}>
        <div style={styles.leftContent}>
          <div style={styles.topBar}>
            <div style={styles.logo}>
              <BookOpen size={28} color="#2563eb" strokeWidth={2.5} />
              <span style={styles.logoText}>{t("common.appName")}</span>
            </div>
            <LanguageSwitcher />
          </div>

          <div style={styles.heroText}>
            <h1 style={styles.heroTitle}>
              {t("hero.login.titleLine1")}
              <br />
              <em>{t("hero.login.titleLine2")}</em>
              <br />
              {t("hero.login.titleLine3")}
              <br />
              {t("hero.login.titleLine4")}
            </h1>
            <p style={styles.heroSubtitle}>{t("hero.login.subtitle")}</p>
          </div>

          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <span style={styles.statNum}>2.4K+</span>
              <span style={styles.statLabel}>{t("hero.login.stat1")}</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.stat}>
              <span style={styles.statNum}>18K+</span>
              <span style={styles.statLabel}>{t("hero.login.stat2")}</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.stat}>
              <span style={styles.statNum}>40+</span>
              <span style={styles.statLabel}>{t("hero.login.stat3")}</span>
            </div>
          </div>
        </div>

        <div style={styles.circle1} />
        <div style={styles.circle2} />
      </div>

      {/* Sağ panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formWrapper}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>{t("login.title")}</h2>
            <p style={styles.formSubtitle}>{t("login.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={styles.form} noValidate>
            <div style={styles.fieldGroup}>
              <label style={styles.label}>{t("login.email")}</label>
              <input
                type="email"
                placeholder={t("login.emailPlaceholder")}
                style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
                {...register("email")}
                autoComplete="email"
              />
              {errors.email && <span style={styles.errorMsg}>{errors.email.message}</span>}
            </div>

            <div style={styles.fieldGroup}>
              <div style={styles.labelRow}>
                <label style={styles.label}>{t("login.password")}</label>
                <Link href={`/${locale}/forgot-password`} style={styles.forgotLink}>
                  {t("login.forgotPassword")}
                </Link>
              </div>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("login.passwordPlaceholder")}
                  style={{
                    ...styles.input,
                    paddingRight: "48px",
                    ...(errors.password ? styles.inputError : {}),
                  }}
                  {...register("password")}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </button>
              </div>
              {errors.password && <span style={styles.errorMsg}>{errors.password.message}</span>}
            </div>

            {apiError && (
              <div style={styles.alertError}><span>{apiError}</span></div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              style={{ ...styles.submitBtn, ...(isLoading ? styles.submitBtnDisabled : {}) }}
            >
              {isLoading ? (
                <><Loader2 size={18} style={styles.spinner} />{t("login.submitting")}</>
              ) : (
                <>{t("login.submit")}<ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div style={styles.divider}>
            <span style={styles.dividerLine} />
            <span style={styles.dividerText}>{t("common.or")}</span>
            <span style={styles.dividerLine} />
          </div>

          <p style={styles.switchText}>
            {t("login.noAccount")}{" "}
            <Link href={`/${locale}/register`} style={styles.switchLink}>
              {t("login.registerLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: "flex", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" },
  leftPanel: {
    flex: 1,
    background: "linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 50%, #2563eb 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "60px", position: "relative", overflow: "hidden",
  },
  leftContent: { position: "relative", zIndex: 10, display: "flex", flexDirection: "column", gap: "48px" },
  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" },
  logo: {
    display: "flex", alignItems: "center", gap: "10px",
    background: "rgba(255,255,255,0.95)", borderRadius: "12px",
    padding: "10px 18px", width: "fit-content",
  },
  logoText: { fontSize: "18px", fontWeight: "700", color: "#1e3a8a", letterSpacing: "-0.5px" },
  heroText: { display: "flex", flexDirection: "column", gap: "16px" },
  heroTitle: {
    fontSize: "52px", fontWeight: "400", color: "#ffffff",
    lineHeight: "1.1", fontFamily: "'DM Serif Display', serif",
  },
  heroSubtitle: { fontSize: "16px", color: "rgba(255,255,255,0.75)", lineHeight: "1.6", maxWidth: "340px" },
  statsRow: { display: "flex", alignItems: "center", gap: "24px" },
  stat: { display: "flex", flexDirection: "column", gap: "2px" },
  statNum: { fontSize: "24px", fontWeight: "700", color: "#ffffff" },
  statLabel: { fontSize: "13px", color: "rgba(255,255,255,0.65)" },
  statDivider: { width: "1px", height: "36px", background: "rgba(255,255,255,0.25)" },
  circle1: {
    position: "absolute", width: "400px", height: "400px",
    borderRadius: "50%", border: "1px solid rgba(255,255,255,0.1)",
    top: "-100px", right: "-100px",
  },
  circle2: {
    position: "absolute", width: "600px", height: "600px",
    borderRadius: "50%", border: "1px solid rgba(255,255,255,0.07)",
    bottom: "-200px", left: "-150px",
  },
  rightPanel: {
    width: "480px", display: "flex", alignItems: "center",
    justifyContent: "center", background: "#f8f7f4", padding: "40px",
  },
  formWrapper: { width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "28px" },
  formHeader: { display: "flex", flexDirection: "column", gap: "8px" },
  formTitle: { fontSize: "28px", fontWeight: "400", color: "#1a1a2e", fontFamily: "'DM Serif Display', serif" },
  formSubtitle: { fontSize: "14px", color: "#64748b" },
  form: { display: "flex", flexDirection: "column", gap: "20px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  labelRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: "14px", fontWeight: "500", color: "#374151" },
  forgotLink: { fontSize: "13px", color: "#2563eb", textDecoration: "none" },
  input: {
    width: "100%", padding: "12px 16px", border: "1.5px solid #e2e8f0",
    borderRadius: "10px", fontSize: "15px", color: "#1a1a2e", background: "#ffffff",
    outline: "none", transition: "border-color 0.2s", fontFamily: "'DM Sans', sans-serif",
  },
  inputError: { borderColor: "#ef4444" },
  passwordWrapper: { position: "relative" },
  eyeBtn: {
    position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", padding: "0",
    display: "flex", alignItems: "center",
  },
  errorMsg: { fontSize: "12px", color: "#ef4444" },
  alertError: {
    background: "#fef2f2", border: "1px solid #fecaca",
    borderRadius: "8px", padding: "12px 16px", fontSize: "14px", color: "#dc2626",
  },
  submitBtn: {
    width: "100%", padding: "13px 20px", background: "#2563eb", color: "#ffffff",
    border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: "600",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    gap: "8px", fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s", marginTop: "4px",
  },
  submitBtnDisabled: { background: "#93c5fd", cursor: "not-allowed" },
  spinner: { animation: "spin 1s linear infinite" },
  divider: { display: "flex", alignItems: "center", gap: "12px" },
  dividerLine: { flex: 1, height: "1px", background: "#e2e8f0" },
  dividerText: { fontSize: "13px", color: "#94a3b8", whiteSpace: "nowrap" },
  switchText: { textAlign: "center", fontSize: "14px", color: "#64748b" },
  switchLink: { color: "#2563eb", fontWeight: "600", textDecoration: "none" },
};
