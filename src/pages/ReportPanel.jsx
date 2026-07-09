import React, { useEffect, useState } from "react";
import { ClipboardList, Download, Users } from "lucide-react";
import { api, excelUrl, SLUGS } from "../api/client";
import { DashboardShell, Field } from "../components/ui";
import { DailySnapshot, StaffDashboard } from "../components/StaffDashboard";
import { StaffManagement } from "../components/StaffManagement";

const PERIOD_OPTIONS = [
  { value: "daily", label: "Diario" },
  { value: "weekly", label: "Semanal" },
  { value: "biweekly", label: "Quincenal" },
  { value: "monthly", label: "Mensual" },
  { value: "quarterly", label: "Trimestral" },
];

const CONSUMPTION_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "included", label: "Desayunos de cortesía" },
  { value: "extras", label: "Adicionales" },
];

export function ReportPanel({ manager = false }) {
  const slug = manager ? SLUGS.manager : SLUGS.reception;
  const [report, setReport] = useState(null);
  const [dashboardReport, setDashboardReport] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [period, setPeriod] = useState("daily");
  const [consumptionType, setConsumptionType] = useState("all");
  const [message, setMessage] = useState("");
  const reportFilters = manager ? {} : { period, consumptionType };

  const loadReport = async () => {
    try {
      setReport(await api.report(slug, date, reportFilters));
      if (!manager) setDashboardReport(await api.dashboardReport(slug, date, reportFilters));
    } catch (err) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    loadReport();
  }, [date, manager, period, consumptionType]);

  return (
    <DashboardShell className="reportDashboard" title={manager ? "Gerencia" : "Recepción"} icon={manager ? <Users /> : <ClipboardList />} subtitle={manager ? "Gestión de usuarios y descarga de reportes" : "Reportes diarios"}>
      {message && <div className="alert">{message}</div>}
      <section className="reportToolbar">
        <Field label="Fecha">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        {!manager && (
          <>
            <Field label="Periodo">
              <select value={period} onChange={(event) => setPeriod(event.target.value)}>
                {PERIOD_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
            <Field label="Tipo de consumo">
              <select value={consumptionType} onChange={(event) => setConsumptionType(event.target.value)}>
                {CONSUMPTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </Field>
          </>
        )}
        <a className="primary linkButton" href={excelUrl(slug, date, reportFilters)}><Download size={16} /> Excel</a>
      </section>
      {!manager && dashboardReport && <StaffDashboard report={dashboardReport} />}
      {!manager && report && <DailySnapshot report={report} />}
      {manager && <StaffManagement onMessage={setMessage} />}
    </DashboardShell>
  );
}
