import React from "react";
import { BarChart3, CheckCircle2, ClipboardList, Clock3 } from "lucide-react";
import { displayName } from "../constants/app";

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
        <PiePanel
          title="Pedidos por categoría"
          data={report.category_mix || {}}
          description="Distribución de pedidos y adicionales agrupados por categoría para identificar qué tipo de producto tiene mayor demanda."
        />
        <GroupedBars
          title="Pedidos por estado"
          data={report.status_by_category || {}}
          description="Comparación de pedidos completados y en preparación por categoría, con eje de cantidad como referencia."
        />
        <LinePanel
          title="Pedidos por hora"
          data={report.orders_by_hour || {}}
          description="Cantidad de pedidos registrados a lo largo del día según el horario en que fueron realizados."
        />
        <RankTable title="Productos más solicitados" columns={["#", "Producto", "Cantidad"]} rows={(report.top_products || []).map((item, index) => [index + 1, displayName(item.name), item.quantity])} />
        <RankTable title="Mesas más activas" columns={["#", "Mesa", "Pedidos"]} rows={(report.active_tables || []).map((item, index) => [index + 1, item.name, item.orders])} />
      </div>
    </section>
  );
}

export function DailySnapshot({ report }) {
  return (
    <section className="dailySnapshot">
      <h2>Resumen del día seleccionado</h2>
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

function PiePanel({ title, data, description }) {
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
      {description && <p className="chartDescription">{description}</p>}
      <div className="pieWrap">
        <div className="pieChart" style={{ background: `conic-gradient(${gradient})` }} />
        <div className="pieLegend">
          {entries.map(([label, value], index) => (
            <span key={label}><i style={{ background: colors[index % colors.length] }} /> {displayName(label)} <b>{Math.round((value / total) * 100)}%</b></span>
          ))}
        </div>
      </div>
    </article>
  );
}

function GroupedBars({ title, data, description }) {
  const categories = Object.keys(data);
  const max = Math.max(1, ...categories.flatMap((category) => Object.values(data[category] || {})));
  const mid = Math.ceil(max / 2);
  const statuses = ["Completados", "En preparación"];
  return (
    <article className="staffPanelCard">
      <h2>{title}</h2>
      {description && <p className="chartDescription">{description}</p>}
      <div className="groupLegend">
        <span><i className="greenDot" /> Completados</span>
        <span><i className="blueDot" /> En preparación</span>
      </div>
      <div className="groupedChart">
        <div className="barAxis">
          <span>{max}</span>
          <span>{mid}</span>
          <span>0</span>
        </div>
        <div className="groupedBars">
          {categories.map((category) => (
            <div className="groupedBar" key={category}>
              <div>
                {statuses.map((status) => (
                  <i key={status} className={status === "Completados" ? "greenBar" : "blueBar"} style={{ height: `${((data[category]?.[status] || 0) / max) * 100}%` }} />
                ))}
              </div>
              <span>{displayName(category)}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function LinePanel({ title, data, description }) {
  const entries = Object.entries(data);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  const points = entries.map(([label, value], index) => ({
    label,
    value,
    x: entries.length === 1 ? 50 : 8 + (index / (entries.length - 1)) * 84,
    y: 18 + (1 - value / max) * 58,
  }));
  return (
    <article className="staffPanelCard">
      <h2>{title}</h2>
      {description && <p className="chartDescription">{description}</p>}
      <div className="lineChart lineChartConnected">
        <svg className="lineChartPath" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
        </svg>
        {points.map((point) => (
          <div key={point.label} className="linePoint" style={{ "--x": `${point.x}%`, "--y": `${point.y}%` }}>
            <b>{point.value}</b>
            <i />
            <span>{point.label}</span>
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
