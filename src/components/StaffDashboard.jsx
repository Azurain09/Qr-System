import React from "react";
import { BarChart3, CheckCircle2, ClipboardList, Clock3 } from "lucide-react";

export function Metric({ title, value }) {
  return (
    <div className="metric">
      <span>{title}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function StaffDashboard({ report }) {
  const metrics = report.metrics || {};
  return (
    <section className="staffDashboard">
      <div className="statCards">
        <StatCard icon={<ClipboardList />} color="purple" title="Pedidos totales" value={metrics.total_orders || 0} caption="Total de pedidos" />
        <StatCard icon={<CheckCircle2 />} color="green" title="Pedidos completados" value={metrics.completed_orders || 0} caption="Total completados" />
        <StatCard icon={<Clock3 />} color="orange" title="Pedidos en preparación" value={metrics.in_preparation_orders || 0} caption="En preparación" />
        <StatCard icon={<Clock3 />} color="blue" title="Tiempo promedio" value={`${metrics.average_minutes || 0} min`} caption="Tiempo de entrega" />
      </div>
      <div className="staffCharts">
        <PiePanel title="Pedidos por categoria" data={report.category_mix || {}} />
        <GroupedBars title="Pedidos por estado" data={report.status_by_category || {}} />
        <LinePanel title="Pedidos por dia" data={report.orders_by_day || {}} />
        <RankTable title="Productos mas solicitados" columns={["#", "Producto", "Cantidad"]} rows={(report.top_products || []).map((item, index) => [index + 1, item.name, item.quantity])} />
        <RankTable title="Mesas mas activas" columns={["#", "Mesa", "Pedidos"]} rows={(report.active_tables || []).map((item, index) => [index + 1, item.name, item.orders])} />
      </div>
    </section>
  );
}

export function DailySnapshot({ report }) {
  return (
    <section className="dailySnapshot">
      <h2>Resumen del dia seleccionado</h2>
      <div className="reportGrid compactReport">
        <Metric title="Pedidos" value={report.total_orders} />
        <Chart title="Origen" data={report.attended_by_origin} />
        <Chart title="Cancelaciones" data={report.cancellation_reasons} />
      </div>
    </section>
  );
}

function StatCard({ icon, color, title, value, caption }) {
  return (
    <article className={`statCard ${color}`}>
      <span>{icon}</span>
      <div>
        <p>{title}</p>
        <strong>{value}</strong>
        <small>{caption}</small>
      </div>
    </article>
  );
}

function PiePanel({ title, data }) {
  const entries = Object.entries(data);
  const total = Math.max(1, entries.reduce((sum, [, value]) => sum + value, 0));
  const colors = ["#5b1fd1", "#1479f6", "#ff9815", "#75b7ff", "#a14ed8"];
  let start = 0;
  const gradient = entries.length
    ? entries.map(([, value], index) => {
        const end = start + (value / total) * 100;
        const segment = `${colors[index % colors.length]} ${start}% ${end}%`;
        start = end;
        return segment;
      }).join(", ")
    : "#edf1ee 0% 100%";
  return (
    <article className="staffPanelCard piePanel">
      <h2>{title}</h2>
      <div className="pieWrap">
        <div className="pieChart" style={{ background: `conic-gradient(${gradient})` }} />
        <div className="pieLegend">
          {entries.map(([label, value], index) => (
            <span key={label}><i style={{ background: colors[index % colors.length] }} /> {label} <b>{Math.round((value / total) * 100)}%</b></span>
          ))}
        </div>
      </div>
    </article>
  );
}

function GroupedBars({ title, data }) {
  const categories = Object.keys(data);
  const max = Math.max(1, ...categories.flatMap((category) => Object.values(data[category] || {})));
  const statuses = ["Completados", "En preparación"];
  return (
    <article className="staffPanelCard">
      <h2>{title}</h2>
      <div className="groupLegend">
        <span><i className="greenDot" /> Completados</span>
        <span><i className="blueDot" /> En preparación</span>
      </div>
      <div className="groupedBars">
        {categories.map((category) => (
          <div className="groupedBar" key={category}>
            <div>
              {statuses.map((status) => (
                <i key={status} className={status === "Completados" ? "greenBar" : "blueBar"} style={{ height: `${((data[category]?.[status] || 0) / max) * 100}%` }} />
              ))}
            </div>
            <span>{category}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function LinePanel({ title, data }) {
  const entries = Object.entries(data);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return (
    <article className="staffPanelCard">
      <h2>{title}</h2>
      <div className="lineChart">
        {entries.map(([label, value]) => (
          <div key={label} className="linePoint" style={{ "--height": `${(value / max) * 78 + 8}%` }}>
            <b>{value}</b>
            <i />
            <span>{label.slice(5)}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function RankTable({ title, columns, rows }) {
  return (
    <article className="staffPanelCard rankTable">
      <h2>{title}</h2>
      <table>
        <thead>
          <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={`${index}-${cellIndex}`}>{cell}</td>)}</tr>
          )) : (
            <tr><td colSpan={columns.length}>Sin datos</td></tr>
          )}
        </tbody>
      </table>
    </article>
  );
}

function Chart({ title, data }) {
  const entries = Object.entries(data || {});
  const max = Math.max(1, ...entries.map(([, value]) => value));
  return (
    <article className="chart">
      <h2><BarChart3 size={18} /> {title}</h2>
      {entries.length ? entries.map(([label, value]) => (
        <div className="barRow" key={label}>
          <span>{label}</span>
          <div><i style={{ width: `${(value / max) * 100}%` }} /></div>
          <b>{value}</b>
        </div>
      )) : <p className="muted">Sin datos</p>}
    </article>
  );
}
