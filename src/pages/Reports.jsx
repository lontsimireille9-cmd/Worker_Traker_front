import { useEffect, useState } from "react";
import { FaDownload, FaFileAlt, FaPlus } from "react-icons/fa";
import { api } from "../services/api";
import { useLanguage } from "../context/LanguageContext";
import Card from "../components/ui/card";
import Button from "../components/ui/button";
import Select from "../components/ui/select";
import Title from "../components/ui/title";
import Badge from "../components/ui/badge";

const PERIOD_KEYS = [{ value: "30", key: "thisMonth" }, { value: "90", key: "threeMonths" }, { value: "180", key: "sixMonths" }, { value: "365", key: "oneYear" }];

function dateLabel(value, locale = "fr-FR") {
  return value ? new Date(value).toLocaleDateString(locale, { dateStyle: "medium" }) : "Unknown date";
}

export default function Reports() {
  const { t, language } = useLanguage();
  const [reports, setReports] = useState([]);
  const [period, setPeriod] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try { setReports(await api.get("/reports")); } catch (err) { setError(err.message); }
  }

  useEffect(() => { load(); }, []);

  async function generate() {
    setLoading(true); setError("");
    try { await api.post("/reports", { period }); await load(); } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function download(report) {
    try {
      const blob = await api.download(`/reports/${report.id}/pdf`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `rapport-${report.periodDays}j.pdf`; anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) { setError(err.message); }
  }

  const periods = PERIOD_KEYS.map(({ value, key }) => ({ value, label: t(key) }));
  const locale = language === "en" ? "en-US" : "fr-FR";
  return <div className="mx-auto max-w-6xl">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{t("dataAnalysis")}</p><Title as="h1" variant="page" className="mt-1 mb-1">{t("activityReports")}</Title><p className="text-sm text-muted">{t("reportsDescription")}</p></div>
      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"><div className="w-full sm:w-44"><Select value={period} onChange={(event) => setPeriod(event.target.value)} options={periods} /></div><Button onClick={generate} loading={loading}><FaPlus /> {t("generate")}</Button></div>
    </div>
    {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-4 md:grid-cols-2">
      {reports.map((report) => <Card key={report.id} className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><FaFileAlt /></span><div><h2 className="truncate font-semibold text-ink">{t("reportFor")} {report.periodDays} {t("days")}</h2><p className="text-xs text-muted">{t("generatedOn")} {dateLabel(report.createdAt, locale)}</p></div></div><Badge tone="info">{report.completionRate}%</Badge></div>
        <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-xl bg-surface-2 p-3"><p className="text-xl font-bold text-ink">{report.totalTasks}</p><p className="text-[11px] text-muted">Taches</p></div><div className="rounded-xl bg-surface-2 p-3"><p className="text-xl font-bold text-emerald-600">{report.completedTasks}</p><p className="text-[11px] text-muted">Realisees</p></div><div className="rounded-xl bg-surface-2 p-3"><p className="text-xl font-bold text-amber-600">{report.pendingTasks}</p><p className="text-[11px] text-muted">Restantes</p></div></div>
        <Button variant="outline" className="w-full" onClick={() => download(report)}><FaDownload /> {t("downloadPdf")}</Button>
      </Card>)}
    </div>
    {reports.length === 0 && <Card className="py-12 text-center"><p className="font-medium text-ink">{t("noReports")}</p><p className="mt-1 text-sm text-muted">{t("choosePeriodGenerate")}</p></Card>}
  </div>;
}
