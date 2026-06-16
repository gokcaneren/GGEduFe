import { getTranslations } from "next-intl/server";

export default async function StudentDashboard() {
  const t = await getTranslations("dashboard.student");
  return (
    <div style={{ padding: "40px", fontFamily: "'DM Sans', sans-serif" }}>
      <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "32px" }}>{t("title")}</h1>
      <p style={{ color: "#64748b", marginTop: "8px" }}>{t("subtitle")}</p>
    </div>
  );
}
