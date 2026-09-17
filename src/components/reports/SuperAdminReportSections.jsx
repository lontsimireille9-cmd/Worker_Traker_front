import { FaArrowDown, FaArrowUp, FaMinus } from "react-icons/fa";
import { EmployeeTaskChart, GlobalTaskChart, ParticipationDonut } from "./ReportCharts";
import { getParticipation } from "../../utils/reportCalculations";
import Card from "../ui/card";

const PERIODS = ["DM", "WW", "MM", "MY", "YY"];
const PERIOD_LABELS = { DM: "D&M", WW: "W&W", MM: "M&M", MY: "M&Y", YY: "Y&Y" };

function comparisonValue(current, previous) {
  const difference = current - previous;
  return { difference, tone: difference > 0 ? "up" : difference < 0 ? "down" : "stable", icon: difference > 0 ? <FaArrowUp /> : difference < 0 ? <FaArrowDown /> : <FaMinus /> };
}

function Metric({ label, current, previous, suffix = "%" }) {
  const result = comparisonValue(current, previous);
  return <div className="flex items-center justify-between gap-3 rounded-lg border border-[#DCE7F5] bg-white px-3 py-2"><span className="text-xs font-semibold text-slate-600">{label}</span><span className="flex items-center gap-2"><strong className="text-sm text-[#12345F]">{current}{suffix}</strong><span className={`flex h-6 w-6 items-center justify-center rounded-full ${result.tone === "up" ? "bg-emerald-50 text-emerald-600" : result.tone === "down" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>{result.icon}</span></span></div>;
}

function employeeMap(report) { return Object.fromEntries((report?.employees || []).map((employee) => [employee.uid, employee])); }
function reportEmployee(report, uid) { return employeeMap(report)[uid] || { completed: 0, total: 0, completionRate: 0, participation: 0 }; }

export default function SuperAdminReportSections({ report, comparisons, reportRoot }) {
  const employees = report.employees || [];
  const chartEmployees = employees.slice(0, 8);
  const total = report.completedTasks || 0;
  const contributionLabel = "C&T";

  return <div ref={reportRoot} className="space-y-5">
    <section className="report-page rounded-xl bg-[#F5F8FC] p-4 sm:p-5">
      <h2 className="mb-1 text-2xl font-bold text-[#12345F]">1. Graphiques d'activité</h2>
      <p className="mb-5 text-sm text-slate-500">Évolution globale et performance des employés sur la période sélectionnée.</p>
      <div className="grid gap-4 lg:grid-cols-2"><Card><h3 className="mb-1 font-bold text-[#12345F]">Tâches par employé</h3><p className="mb-3 text-xs text-slate-500">Les dates sont affichées au format jour et mois.</p><EmployeeTaskChart daily={report.daily || []} employees={chartEmployees} /></Card><Card><h3 className="mb-1 font-bold text-[#12345F]">Tâches globales</h3><p className="mb-3 text-xs text-slate-500">Évolution de l'activité de l'entreprise.</p><GlobalTaskChart daily={report.daily || []} /></Card></div>
      <Card className="mt-4"><h3 className="mb-1 font-bold text-[#12345F]">Participation globale</h3><p className="mb-4 text-xs text-slate-500">Part moyenne de chaque employé dans les tâches réalisées.</p><ParticipationDonut employees={employees} total={total} /></Card>
    </section>

    <section className="report-page rounded-xl bg-[#F5F8FC] p-4 sm:p-5">
      <h2 className="mb-1 text-2xl font-bold text-[#12345F]">2. Indicateurs par employé</h2>
      <p className="mb-5 text-sm text-slate-500">Chaque ligne compare les performances aux périodes de référence.</p>
      <div className="grid gap-4 md:grid-cols-2">{employees.map((employee) => { const current = reportEmployee(report, employee.uid); return <Card key={employee.uid} className="bg-white"><div className="mb-3 flex items-center gap-3"><span className="h-10 w-10 shrink-0 rounded-full" style={{ backgroundColor: employee.color }} /><div className="min-w-0"><h3 className="truncate font-bold text-[#12345F]">{employee.name}</h3><p className="text-xs text-slate-500">Performance et contribution</p></div></div><div className="space-y-2">{PERIODS.map((period) => { const previous = reportEmployee(comparisons?.[period], employee.uid); return <Metric key={period} label={PERIOD_LABELS[period]} current={current.completionRate || 0} previous={previous.completionRate || 0} />; })}<Metric label={contributionLabel} current={current.participation ?? getParticipation(current, total)} previous={current.participation ?? getParticipation(current, total)} /></div></Card>; })}</div>
    </section>

    <section className="report-page rounded-xl bg-[#F5F8FC] p-4 sm:p-5">
      <h2 className="mb-1 text-2xl font-bold text-[#12345F]">3. Tableau comparatif</h2>
      <p className="mb-5 text-sm text-slate-500">Performance et contribution moyenne de chaque employé.</p>
      <div className="overflow-x-auto rounded-xl border border-[#DCE7F5] bg-white"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#EAF2FC] text-[#12345F]"><tr><th className="px-4 py-3">Employé</th>{PERIODS.map((period) => <th key={period} className="px-4 py-3 text-center">{PERIOD_LABELS[period]}</th>)}<th className="px-4 py-3 text-right">{contributionLabel}</th></tr></thead><tbody>{employees.map((employee) => { const current = reportEmployee(report, employee.uid); return <tr key={employee.uid} className="border-t border-[#E8EEF6]"><td className="px-4 py-3 font-semibold text-slate-700"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: employee.color }} />{employee.name}</td>{PERIODS.map((period) => { const previous = reportEmployee(comparisons?.[period], employee.uid); const result = comparisonValue(current.completionRate || 0, previous.completionRate || 0); return <td key={period} className="px-4 py-3"><span className="flex items-center justify-center gap-2"><strong>{current.completionRate || 0}%</strong><span className={result.tone === "up" ? "text-emerald-600" : result.tone === "down" ? "text-red-600" : "text-amber-600"}>{result.icon}</span></span></td>; })}<td className="px-4 py-3 text-right font-bold text-[#12345F]">{current.participation ?? getParticipation(current, total)}%</td></tr>; })}</tbody></table></div>
    </section>
  </div>;
}
