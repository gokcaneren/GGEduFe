"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations, useLocale } from "next-intl";
import { Eye, EyeOff, BookOpen, ArrowRight, Loader2, GraduationCap, Users, CheckCircle2 } from "lucide-react";
import { authService } from "@/lib/auth";
import { UserRole } from "@/types";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function RegisterPage() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [selectedRole, setSelectedRole] = useState<boolean>(false); // false = Student

  const registerSchema = z
  .object({
    firstName: z.string().min(2, t("validation.firstNameMin")),
    lastName: z.string().min(2, t("validation.lastNameMin")),
    email: z.string().email(t("validation.emailInvalid")),
    password: z.string()
      .min(8, t("validation.passwordMin8"))
      .regex(/[A-Z]/, t("validation.passwordUppercase"))
      .regex(/[0-9]/, t("validation.passwordNumber")),
    confirmPassword: z.string(),
    isTeacher: z.boolean(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: t("validation.passwordsNoMatch"),
    path: ["confirmPassword"],
  });

  type RegisterForm = z.infer<typeof registerSchema>;

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<RegisterForm>({
  resolver: zodResolver(registerSchema),
  defaultValues: { isTeacher: false },
});

  const password = watch("password", "");
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const handleRoleSelect = (isTeacher: boolean) => {
  setSelectedRole(isTeacher);
  setValue("isTeacher", isTeacher);
};

  const onSubmit = async (data: RegisterForm) => {
  setIsLoading(true);
  setApiError("");
  try {
    await authService.register({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      gender: true, // TODO: forma gender seçimi eklenecek
      isTeacher: data.isTeacher,
    });
    // Backend token döndürmüyor, login'e yönlendir
    router.push(`/${locale}/login?registered=true`);
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    setApiError(err.response?.data?.message || t("register.errorDefault"));
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
              {t("hero.register.titleLine1")}
              <br />
              <em>{t("hero.register.titleLine2")}</em>
              <br />
              {t("hero.register.titleLine3")}
              <br />
              {t("hero.register.titleLine4")}
            </h1>
            <p style={styles.heroSubtitle}>{t("hero.register.subtitle")}</p>
          </div>

          <div style={styles.featureList}>
            {(["feature1", "feature2", "feature3"] as const).map((key) => (
              <div key={key} style={styles.featureItem}>
                <CheckCircle2 size={16} color="rgba(255,255,255,0.9)" />
                <span style={styles.featureText}>{t(`hero.register.${key}`)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.circle1} />
        <div style={styles.circle2} />
      </div>

      {/* Sağ panel */}
      <div style={styles.rightPanel}>
        <div style={styles.formWrapper}>
          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>{t("register.title")}</h2>
            <p style={styles.formSubtitle}>{t("register.subtitle")}</p>
          </div>

          {/* Rol seçimi */}
          <div style={styles.roleRow}>
  {[false, true].map((isTeacher) => (
    <button
      key={String(isTeacher)}
      type="button"
      onClick={() => handleRoleSelect(isTeacher)}
      style={{ ...styles.roleBtn, ...(selectedRole === isTeacher ? styles.roleBtnActive : {}) }}
    >
      {isTeacher
        ? <Users size={20} color={selectedRole === isTeacher ? "#2563eb" : "#94a3b8"} />
        : <GraduationCap size={20} color={selectedRole === isTeacher ? "#2563eb" : "#94a3b8"} />
      }
      <span style={{
        ...styles.roleBtnLabel,
        color: selectedRole === isTeacher ? "#1d4ed8" : "#64748b",
      }}>
        {isTeacher ? t("register.roleTeacher") : t("register.roleStudent")}
      </span>
    </button>
  ))}
</div>

          <form onSubmit={handleSubmit(onSubmit)} style={styles.form} noValidate>
            {/* Ad Soyad */}
            <div style={styles.nameRow}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t("register.firstName")}</label>
                <input
                  type="text"
                  placeholder={t("register.firstNamePlaceholder")}
                  style={{ ...styles.input, ...(errors.firstName ? styles.inputError : {}) }}
                  {...register("firstName")}
                  autoComplete="given-name"
                />
                {errors.firstName && <span style={styles.errorMsg}>{errors.firstName.message}</span>}
              </div>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>{t("register.lastName")}</label>
                <input
                  type="text"
                  placeholder={t("register.lastNamePlaceholder")}
                  style={{ ...styles.input, ...(errors.lastName ? styles.inputError : {}) }}
                  {...register("lastName")}
                  autoComplete="family-name"
                />
                {errors.lastName && <span style={styles.errorMsg}>{errors.lastName.message}</span>}
              </div>
            </div>

            {/* Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>{t("register.email")}</label>
              <input
                type="email"
                placeholder={t("register.emailPlaceholder")}
                style={{ ...styles.input, ...(errors.email ? styles.inputError : {}) }}
                {...register("email")}
                autoComplete="email"
              />
              {errors.email && <span style={styles.errorMsg}>{errors.email.message}</span>}
            </div>

            {/* Şifre */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>{t("register.password")}</label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={t("register.passwordPlaceholder")}
                  style={{ ...styles.input, paddingRight: "48px", ...(errors.password ? styles.inputError : {}) }}
                  {...register("password")}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.eyeBtn} tabIndex={-1}>
                  {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </button>
              </div>
              {password.length > 0 && (
                <div style={styles.passwordChecks}>
                  {(["length", "uppercase", "number"] as const).map((key) => (
                    <span key={key} style={{ ...styles.checkItem, color: passwordChecks[key] ? "#16a34a" : "#94a3b8" }}>
                      <CheckCircle2 size={12} color={passwordChecks[key] ? "#16a34a" : "#cbd5e1"} />
                      {t(`register.passwordCheck_${key}`)}
                    </span>
                  ))}
                </div>
              )}
              {errors.password && <span style={styles.errorMsg}>{errors.password.message}</span>}
            </div>

            {/* Şifre tekrar */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>{t("register.confirmPassword")}</label>
              <div style={styles.passwordWrapper}>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder={t("register.confirmPasswordPlaceholder")}
                  style={{ ...styles.input, paddingRight: "48px", ...(errors.confirmPassword ? styles.inputError : {}) }}
                  {...register("confirmPassword")}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={styles.eyeBtn} tabIndex={-1}>
                  {showConfirm ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </button>
              </div>
              {errors.confirmPassword && <span style={styles.errorMsg}>{errors.confirmPassword.message}</span>}
            </div>

            {apiError && <div style={styles.alertError}><span>{apiError}</span></div>}

            <button
              type="submit"
              disabled={isLoading}
              style={{ ...styles.submitBtn, ...(isLoading ? styles.submitBtnDisabled : {}) }}
            >
              {isLoading
                ? <><Loader2 size={18} style={styles.spinner} />{t("register.submitting")}</>
                : <>{t("register.submit")}<ArrowRight size={18} /></>
              }
            </button>
          </form>

          <p style={styles.switchText}>
            {t("register.hasAccount")}{" "}
            <Link href={`/${locale}/login`} style={styles.switchLink}>{t("register.loginLink")}</Link>
          </p>

          <p style={styles.termsText}>
            {t("register.terms")}{" "}
            <Link href={`/${locale}/terms`} style={styles.termsLink}>{t("register.termsLink")}</Link>
            {" "}{t("register.and")}{" "}
            <Link href={`/${locale}/privacy`} style={styles.termsLink}>{t("register.privacyLink")}</Link>
            {t("register.termsAccept")}
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
  featureList: { display: "flex", flexDirection: "column", gap: "12px" },
  featureItem: { display: "flex", alignItems: "center", gap: "10px" },
  featureText: { fontSize: "15px", color: "rgba(255,255,255,0.85)" },
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
    width: "520px", display: "flex", alignItems: "center",
    justifyContent: "center", background: "#f8f7f4", padding: "40px", overflowY: "auto",
  },
  formWrapper: {
    width: "100%", maxWidth: "420px", display: "flex", flexDirection: "column",
    gap: "24px", paddingTop: "20px", paddingBottom: "20px",
  },
  formHeader: { display: "flex", flexDirection: "column", gap: "8px" },
  formTitle: { fontSize: "28px", fontWeight: "400", color: "#1a1a2e", fontFamily: "'DM Serif Display', serif" },
  formSubtitle: { fontSize: "14px", color: "#64748b" },
  roleRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  roleBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
    padding: "12px", border: "1.5px solid #e2e8f0", borderRadius: "10px",
    background: "#ffffff", cursor: "pointer", transition: "all 0.2s", fontFamily: "'DM Sans', sans-serif",
  },
  roleBtnActive: { border: "1.5px solid #2563eb", background: "#eff6ff" },
  roleBtnLabel: { fontSize: "14px", fontWeight: "500" },
  form: { display: "flex", flexDirection: "column", gap: "16px" },
  nameRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: "7px" },
  label: { fontSize: "14px", fontWeight: "500", color: "#374151" },
  input: {
    width: "100%", padding: "11px 16px", border: "1.5px solid #e2e8f0",
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
  passwordChecks: { display: "flex", gap: "12px", flexWrap: "wrap" },
  checkItem: { display: "flex", alignItems: "center", gap: "4px", fontSize: "12px" },
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
  switchText: { textAlign: "center", fontSize: "14px", color: "#64748b" },
  switchLink: { color: "#2563eb", fontWeight: "600", textDecoration: "none" },
  termsText: { textAlign: "center", fontSize: "12px", color: "#94a3b8", lineHeight: "1.5" },
  termsLink: { color: "#64748b", textDecoration: "underline" },
};
