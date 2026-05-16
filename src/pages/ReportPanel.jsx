import React, { useEffect, useState } from "react";
import { ClipboardList, Download, Trash2, Users } from "lucide-react";
import { api, excelUrl, SLUGS } from "../api/client";
import { PURGE_CONFIRMATION } from "../constants/app";
import { DashboardShell, Field } from "../components/ui";
import { DailySnapshot, StaffDashboard } from "../components/StaffDashboard";

export function ReportPanel({ manager = false }) {
  const slug = manager ? SLUGS.manager : SLUGS.reception;
  const [report, setReport] = useState(null);
  const [dashboardReport, setDashboardReport] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [message, setMessage] = useState("");
  const [purgeText, setPurgeText] = useState("");
  const [purging, setPurging] = useState(false);

  const loadReport = async () => {
    try {
      setReport(await api.report(slug, date));
      setDashboardReport(await api.dashboardReport(slug, date));
    } catch (err) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    loadReport();
  }, [date, manager]);

  const purgeOrders = async () => {
    if (purgeText !== PURGE_CONFIRMATION) return;
    setPurging(true);
    try {
      const result = await api.purgeOrders(purgeText);
      setMessage(`Datos purgados. Pedidos eliminados: ${result.deleted.orders}.`);
      setPurgeText("");
      await loadReport();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setPurging(false);
    }
  };

  return (
    <DashboardShell title={manager ? "Gerencia" : "Recepcion"} icon={manager ? <Users /> : <ClipboardList />} subtitle={manager ? "Reportes historicos y personal" : "Reportes diarios"}>
      {message && <div className="alert">{message}</div>}
      <section className="reportToolbar">
        <Field label="Fecha">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
        <a className="primary linkButton" href={excelUrl(slug, date)}><Download size={16} /> Excel</a>
      </section>
      {dashboardReport && <StaffDashboard report={dashboardReport} />}
      {report && <DailySnapshot report={report} />}
      {manager && (
        <section className="purgePanel">
          <div>
            <h2>Purgar datos</h2>
            <p>Estás seguro de que deseas eliminar todos los pedidos, detalles, historial y cancelaciones? Esta acción no se puede deshacer.</p>
          </div>
          <Field label="Escriba ELIMINAR PEDIDOS para confirmar">
            <input value={purgeText} onChange={(event) => setPurgeText(event.target.value)} />
          </Field>
          <button className="danger purgeButton" disabled={purgeText !== PURGE_CONFIRMATION || purging} onClick={purgeOrders}>
            <Trash2 size={16} /> {purging ? "Purgando..." : "Purgar pedidos"}
          </button>
        </section>
      )}
    </DashboardShell>
  );
}
