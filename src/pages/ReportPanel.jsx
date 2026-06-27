import React, { useEffect, useState } from "react";
import { ClipboardList, Download, Users } from "lucide-react";
import { api, excelUrl, SLUGS } from "../api/client";
import { DashboardShell, Field } from "../components/ui";
import { DailySnapshot, StaffDashboard } from "../components/StaffDashboard";
import { StaffManagement } from "../components/StaffManagement";

export function ReportPanel({ manager = false }) {
  const slug = manager ? SLUGS.manager : SLUGS.reception;
  const [report, setReport] = useState(null);
  const [dashboardReport, setDashboardReport] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");

  const loadReport = async () => {
    try {
      setReport(await api.report(slug, date));
      if (!manager) setDashboardReport(await api.dashboardReport(slug, date));
    } catch (err) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    loadReport();
  }, [date, manager]);

  return (
    <DashboardShell className="reportDashboard" title={manager ? "Gerencia" : "Recepción"} icon={manager ? <Users /> : <ClipboardList />} subtitle={manager ? "Gestión de usuarios y descarga de reportes" : "Reportes diarios"}>
      {message && <div className="alert">{message}</div>}
      <section className="reportToolbar">
        <Field label="Fecha">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <a className="primary linkButton" href={excelUrl(slug, date)}><Download size={16} /> Excel</a>
      </section>
      {!manager && dashboardReport && <StaffDashboard report={dashboardReport} />}
      {!manager && report && <DailySnapshot report={report} />}
      {manager && <StaffManagement onMessage={setMessage} />}
    </DashboardShell>
  );
}
