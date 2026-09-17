import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { FaArrowTrendUp, FaBolt, FaCalendarDays, FaCheck, FaDownload, FaFileLines, FaTrash, FaTriangleExclamation, FaXmark } from "react-icons/fa6";
import { api } from "../services/api";
import { buildReportViewModel, formatReportDate } from "../utils/reportCalculations";
import { EmployeeTaskChart, GlobalTaskChart, ParticipationDonut } from "../components/reports/ReportCharts";
import Button from "../components/ui/Button";
import BrandLogo from "../components/BrandLogo";

const KPI_CONFIG = [
  { key: "totalTasks", label: "Nombre total de tâches", color: "#1769E8", icon: FaFileLines },
  { key: "completedTasks", label: "Tâches terminées", color: "#10B981", icon: FaCheck },
  { key: "inProgressTasks", label: "Tâches en cours", color: "#F59E0B", icon: FaBolt },
  { key: "overdueTasks", label: "Tâches en retard", color: "#EF4444", icon: FaTriangleExclamation },
];

function localDate(value) { return value.toISOString().slice(0, 10); }
function firstDayOfMonth() { const date = new Date(); return localDate(new Date(date.getFullYear(), date.getMonth(), 1)); }
function today() { return localDate(new Date()); }
function Card({ children, className = "" }) { return <section className={`rounded-xl border border-[#DCE7F5] bg-white p-4 shadow-[0_5px_18px_rgba(18,52,95,.04)] ${className}`}>{children}</section>; }
function Header({ report }) { return <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[#DCE7F5] pb-5"><div className="flex min-w-0 items-center gap-3"><div className="w-44 max-w-[55%]"><BrandLogo /></div><div><h2 className="sr-only">SuiviEmployés</h2><p className="text-xs text-slate-500">Plus d'engagement, plus de résultats</p></div></div><div className="min-w-0 text-right"><p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#12345F]">Rapport d'activité des employés</p><p className="mt-1 text-xs text-slate-500">Généré par le Super Admin</p><p className="mt-1 text-[11px] text-slate-400">{formatReportDate(report.endDate)}</p></div></header>; }
function Footer({ report, page }) { return <footer className="mt-auto flex items-center justify-between border-t border-[#DCE7F5] pt-3 text-[10px] text-slate-500"><span className="font-semibold text-[#12345F]">SuiviEmployés <span className="font-normal text-slate-400">- Rapport généré le {new Date().toLocaleString("fr-FR")}</span></span><span>{formatReportDate(report.startDate)} - {formatReportDate(report.endDate)} <strong className="ml-4 text-[#12345F]">Page {page} / 2</strong></span></footer>; }
function ReportPages({ report, reportRoot }) {
  const employees = report.employees || [];
  const daily = report.daily || [];
  const chartEmployees = employees.slice(0, 8);
  const total = report.completedTasks || 0;
  return <div ref={reportRoot} className="space-y-5">
    <div className="report-page flex min-w-0 flex-col gap-5 rounded-xl bg-[#F5F8FC] p-4 sm:p-5">
      <Header report={report} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><h2 className="text-2xl font-bold text-[#12345F]">Rapport des tâches</h2><p className="text-xs text-slate-500">Vue d'ensemble de l'activité des employés sur la période sélectionnée.</p></div><div className="w-full rounded-lg border border-[#DCE7F5] bg-white px-4 py-3 text-left sm:w-auto sm:text-right"><p className="text-[10px] text-slate-500">Période sélectionnée</p><strong className="text-sm text-[#12345F]">{formatReportDate(report.startDate)} → {formatReportDate(report.endDate)}</strong></div></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{KPI_CONFIG.map(({ key, label, color, icon: Icon }) => <div key={key} className="rounded-xl border border-[#DCE7F5] bg-white p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-full text-white" style={{ backgroundColor: color }}><Icon /></span><div><p className="text-[11px] font-semibold text-slate-500">{label}</p><strong className="text-2xl text-[#12345F]">{report[key]}</strong></div></div><p className="mt-3 text-[10px] text-slate-400">Période sélectionnée</p></div>)}</div>
      <div className="grid gap-4 lg:grid-cols-2"><Card><ChartTitle title="Évolution des tâches par employé" text="Nombre de tâches réalisées par employé et par jour." /><EmployeeTaskChart daily={daily} employees={chartEmployees} /><Legend employees={chartEmployees} /></Card><Card><ChartTitle title="Évolution de toutes les tâches" text="Total des tâches créées chaque jour sur la période." /><GlobalTaskChart daily={daily} /><p className="text-center text-xs text-slate-500">{report.totalTasks} tâches au total sur {report.periodDays} jours</p></Card></div>
      <Footer report={report} page={1} />
    </div>
    <div className="report-page flex min-w-0 flex-col gap-5 rounded-xl bg-[#F5F8FC] p-4 sm:p-5">
      <Header report={report} /><div><h2 className="text-2xl font-bold text-[#12345F]">Analyse de participation</h2><p className="text-sm text-slate-500">Participation, moyenne quotidienne et contribution aux tâches réalisées.</p></div>
      <Card><h3 className="font-bold text-[#12345F]">Participation des employés</h3><p className="mb-5 text-xs text-slate-500">Pourcentage de tâches réalisées par chaque employé.</p>{employees.length ? <ParticipationDonut employees={employees} total={total} /> : <p className="py-10 text-center text-sm text-slate-500">Aucune tâche réalisée.</p>}</Card>
      <Card className="flex-1"><h3 className="font-bold text-[#12345F]">Détail par employé</h3><p className="mb-4 text-xs text-slate-500">Nombre de tâches, moyenne quotidienne et participation.</p><div className="hidden overflow-hidden rounded-lg border border-[#DCE7F5] sm:block"><table className="w-full text-left text-xs"><thead className="bg-[#EAF2FC] text-[#12345F]"><tr><th className="px-4 py-3">Employé</th><th className="px-4 py-3 text-right">Tâches</th><th className="px-4 py-3 text-right">Moyenne / jour</th><th className="px-4 py-3 text-right">Participation</th></tr></thead><tbody>{employees.map((employee) => <tr key={employee.uid} className="border-t border-[#E8EEF6]"><td className="px-4 py-3 font-medium text-slate-700"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: employee.color }} />{employee.name}</td><td className="px-4 py-3 text-right">{employee.completed}</td><td className="px-4 py-3 text-right">{employee.dailyAverage}</td><td className="px-4 py-3 text-right font-semibold text-[#12345F]">{employee.participation}%</td></tr>)}</tbody><tfoot className="bg-[#EAF2FC] font-bold text-[#12345F]"><tr><td className="px-4 py-3">Total</td><td className="px-4 py-3 text-right">{total}</td><td className="px-4 py-3 text-right">{employees.reduce((sum, employee) => sum + employee.dailyAverage, 0).toFixed(1)}</td><td className="px-4 py-3 text-right">{report.participationTotal.toFixed(1)}%</td></tr></tfoot></table></div><div className="space-y-2 sm:hidden">{employees.map((employee) => <div key={employee.uid} className="rounded-xl border border-[#DCE7F5] bg-[#F8FAFD] p-3"><div className="flex items-center justify-between gap-3"><div className="min-w-0 flex items-center gap-2"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: employee.color }} /><span className="truncate text-sm font-semibold text-slate-700">{employee.name}</span></div><strong className="text-sm text-[#12345F]">{employee.participation}%</strong></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500"><span>Tâches : <strong className="text-slate-700">{employee.completed}</strong></span><span>Moyenne/jour : <strong className="text-slate-700">{employee.dailyAverage}</strong></span></div></div>)}<div className="rounded-xl bg-[#EAF2FC] p-3 text-xs font-semibold text-[#12345F]">Total : {total} tâches · {report.participationTotal.toFixed(1)}% de participation</div></div></Card>
      <Footer report={report} page={2} />
    </div>
  </div>;
}
function ChartTitle({ title, text }) { return <div className="mb-2 flex items-center gap-2"><FaArrowTrendUp className="text-[#1769E8]" /><div><h3 className="font-bold text-[#12345F]">{title}</h3><p className="text-[11px] text-slate-500">{text}</p></div></div>; }
function Legend({ employees }) { return <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px]">{employees.map((employee) => <span key={employee.uid} className="flex items-center gap-1.5 text-slate-600"><i className="h-2 w-2 rounded-full" style={{ backgroundColor: employee.color }} />{employee.name}</span>)}</div>; }

export default function Reports() {
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState(null);
  const [savedReports, setSavedReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [error, setError] = useState("");
  const reportRoot = useRef(null);

  async function loadReport(event, persist = true) {
    event?.preventDefault(); setLoading(true); setError("");
    try {
      const summary = buildReportViewModel(await api.get(`/reports/summary?startDate=${startDate}&endDate=${endDate}`));
      setReport(summary);
      if (persist) {
        const saved = await api.post("/reports", { startDate, endDate });
        setSavedReports((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
        setSelectedReport(saved);
      }
    } catch (err) { setError(err.message || "Impossible de charger le rapport."); }
    finally { setLoading(false); }
  }
  useEffect(() => { loadReport(undefined, false); api.get("/reports").then(setSavedReports).catch(() => undefined); }, []);
  const chartEmployees = useMemo(() => report?.employees?.slice(0, 8) || [], [report]);

  function openSavedReport(saved) { setSelectedReport(saved); setReport(buildReportViewModel(saved)); }
  async function downloadSavedReport(saved) { try { const blob = await api.download(`/reports/${saved.id}/pdf`); const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `rapport-${saved.startDate || saved.periodDays}-${saved.endDate || "rapport"}.pdf`; anchor.click(); URL.revokeObjectURL(url); } catch (err) { setError(err.message || "Impossible de télécharger le rapport."); } }
  async function deleteSavedReport(saved) { if (!window.confirm("Supprimer définitivement ce rapport ?")) return; try { await api.delete(`/reports/${saved.id}`); setSavedReports((items) => items.filter((item) => item.id !== saved.id)); setSelectedReport(null); } catch (err) { setError(err.message || "Impossible de supprimer le rapport."); } }
  async function generateReportPDF() {
    if (!reportRoot.current) return;
    setPdfLoading(true);
    try {
      const pages = [...reportRoot.current.querySelectorAll(".report-page")];
      let pdf = null;
      for (let index = 0; index < pages.length; index += 1) {
        const canvas = await html2canvas(pages[index], { scale: 2, backgroundColor: "#F5F8FC", useCORS: true, logging: false, windowWidth: Math.max(pages[index].scrollWidth, pages[index].clientWidth) });
        const widthMm = canvas.width * 0.264583;
        const heightMm = canvas.height * 0.264583;
        if (!pdf) pdf = new jsPDF({ orientation: widthMm >= heightMm ? "landscape" : "portrait", unit: "mm", format: [widthMm, heightMm], compress: true });
        else pdf.addPage([widthMm, heightMm], widthMm >= heightMm ? "landscape" : "portrait");
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, widthMm, heightMm, undefined, "FAST");
      }
      pdf?.save(`suivi-employes-${report.startDate}-${report.endDate}.pdf`);
    } catch (err) { setError(err.message || "Impossible de générer le PDF."); } finally { setPdfLoading(false); }
  }

    return <div className="mx-auto max-w-[1420px] pb-10"><div className="mb-5 flex flex-wrap items-end justify-between gap-4 print:hidden"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-[#1769E8]">Super Admin</p><h1 className="mt-1 text-3xl font-bold text-[#12345F]">Rapports</h1><p className="mt-1 text-sm text-slate-500">Analysez l'activité réelle des employés sur une période précise.</p></div><div className="flex flex-wrap items-end gap-2"><label className="text-xs font-semibold text-slate-600">Du<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="mt-1 block h-10 rounded-lg border border-[#DCE7F5] bg-white px-3 text-sm text-[#12345F]" /></label><label className="text-xs font-semibold text-slate-600">Au<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="mt-1 block h-10 rounded-lg border border-[#DCE7F5] bg-white px-3 text-sm text-[#12345F]" /></label><Button onClick={(event) => loadReport(event, true)} loading={loading}><FaCalendarDays /> Générer le rapport</Button></div></div>{error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">{error}</p>}{!savedReports.length && !loading && <div className="rounded-xl border border-[#DCE7F5] bg-white p-12 text-center text-slate-500">Aucun rapport généré.</div>}{savedReports.length > 0 && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:hidden">{savedReports.map((saved) => <Button key={saved.id} type="Button" variant="ghost" onClick={() => openSavedReport(saved)} className="rounded-xl border border-[#DCE7F5] bg-white p-4 text-left text-ink shadow-[0_5px_18px_rgba(18,52,95,.04)] transition hover:border-[#1769E8] hover:bg-white hover:shadow-md"><div className="flex items-start justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F1FF] text-[#1769E8]"><FaFileLines /></span><span className="text-xs font-semibold text-[#1769E8]">Ouvrir</span></div><p className="mt-3 text-sm font-bold text-[#12345F]">Rapport des tâches</p><p className="mt-1 text-xs text-slate-500">{saved.startDate ? `${formatReportDate(saved.startDate)} → ${formatReportDate(saved.endDate)}` : `${saved.periodDays} jours`}</p><p className="mt-2 text-xs text-slate-400">{saved.totalTasks || 0} tâches · {saved.createdAt ? new Date(saved.createdAt).toLocaleDateString("fr-FR") : "—"}</p></Button>)}</div>}{selectedReport && <div className="fixed inset-0 z-[100] overflow-y-auto overflow-x-hidden bg-[#12345F]/30 p-2 backdrop-blur-sm print:hidden sm:p-4"><div className="mx-auto w-full max-w-[1200px] min-w-0 rounded-2xl bg-white p-3 shadow-2xl sm:p-6"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[.14em] text-[#1769E8]">Rapport généré</p><h2 className="mt-1 text-xl font-bold text-[#12345F]">{selectedReport.startDate ? `${formatReportDate(selectedReport.startDate)} → ${formatReportDate(selectedReport.endDate)}` : "Rapport des tâches"}</h2></div><div className="flex flex-wrap items-center gap-2"><Button variant="outline" onClick={() => deleteSavedReport(selectedReport)}><FaTrash /> Supprimer</Button><Button onClick={generateReportPDF} loading={pdfLoading}><FaDownload /> Télécharger</Button><Button type="Button" onClick={() => setSelectedReport(null)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Fermer"><FaXmark /></Button></div></div>{report && <ReportPages report={report} reportRoot={reportRoot} />}</div></div>}</div>;
}
