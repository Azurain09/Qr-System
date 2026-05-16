import React, { useEffect, useState } from "react";
import { Bed, ChefHat, Utensils } from "lucide-react";
import { api, SLUGS, socketUrl } from "../api/client";
import { CANCELLATION_REASONS, STATUS_FLOW } from "../constants/app";
import { useCatalog } from "../hooks/useCatalog";
import { DashboardShell, Field, ServiceClosed } from "../components/ui";
import { OrderSummary } from "../components/OrderSummary";
import { StaffDashboard } from "../components/StaffDashboard";

export function KitchenPanel() {
  const { catalog, setCatalog, reload } = useCatalog();
  const [orders, setOrders] = useState([]);
  const [dashboardReport, setDashboardReport] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isOpen, setIsOpen] = useState(true);
  const [reasonByOrder, setReasonByOrder] = useState({});
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    try {
      const data = await api.kitchenOrders();
      setIsOpen(data.is_open);
      setOrders(data.orders || []);
      setDashboardReport(await api.dashboardReport(SLUGS.cook, date));
    } catch (err) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    loadOrders();
    const socket = new WebSocket(socketUrl(`/ws/kitchen/${SLUGS.cook}`));
    socket.onmessage = () => {
      loadOrders();
      reload();
    };
    return () => socket.close();
  }, [date]);

  if (!isOpen) return <ServiceClosed />;
  if (!catalog) return <main className="dashboard">Cargando...</main>;

  const updateAvailability = async (kind, id, isActive) => {
    try {
      const next = await api.availability(kind, id, isActive);
      setCatalog(next);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const updateOrder = async (order, status) => {
    try {
      await api.updateStatus(order.id, { status, reason: status === "Cancelado" ? reasonByOrder[order.id] : null });
      await loadOrders();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const cancelExtra = async (detailId, reason) => {
    try {
      await api.cancelExtra(detailId, { reason });
      await loadOrders();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <DashboardShell title="Cocina" icon={<ChefHat />} subtitle="Pedidos confirmados en tiempo real">
      {message && <div className="alert">{message}</div>}
      <section className="reportToolbar">
        <Field label="Fecha">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
      </section>
      {dashboardReport && <StaffDashboard report={dashboardReport} />}
      <section className="dashboardGrid">
        <div>
          <h2>Pedidos activos</h2>
          <div className="orderList">
            {orders.map((order) => (
              <article className="orderCard" key={order.id}>
                <div className="orderTop">
                  <div>
                    <h3>{order.guest_name}</h3>
                    <p>{order.document} - {order.delivery_location} - {order.table_number ? `Mesa ${order.table_number}` : `Hab. ${order.room_number}`}</p>
                  </div>
                  {order.claimed_included && <span className="included">DESAYUNO INCLUIDO</span>}
                </div>
                <OrderSummary order={order} />
                <p className="muted">Confirmado: {order.confirmed_at ? new Date(order.confirmed_at).toLocaleTimeString("es-PE") : "-"}</p>
                <div className="statusButtons">
                  {STATUS_FLOW.map((status) => (
                    <button key={status} className={order.status === status ? "active" : ""} onClick={() => updateOrder(order, status)}>
                      {status}
                    </button>
                  ))}
                </div>
                {order.status === "Pendiente" && (
                  <>
                    <div className="cancelLine">
                      <select value={reasonByOrder[order.id] || ""} onChange={(event) => setReasonByOrder({ ...reasonByOrder, [order.id]: event.target.value })}>
                        <option value="">Motivo de cancelacion</option>
                        {CANCELLATION_REASONS.map((reason) => <option key={reason}>{reason}</option>)}
                      </select>
                      <button className="danger" onClick={() => updateOrder(order, "Cancelado")}>Cancelar pedido</button>
                    </div>
                    {order.extras.filter((extra) => !extra.is_cancelled).map((extra) => (
                      <div className="cancelLine compact" key={extra.id}>
                        <span>{extra.quantity} x {extra.name}</span>
                        <select onChange={(event) => event.target.value && cancelExtra(extra.id, event.target.value)} defaultValue="">
                          <option value="">Cancelar adicional</option>
                          {CANCELLATION_REASONS.map((reason) => <option key={reason}>{reason}</option>)}
                        </select>
                      </div>
                    ))}
                  </>
                )}
              </article>
            ))}
            {!orders.length && <div className="emptyState">No hay pedidos confirmados.</div>}
          </div>
        </div>

        <aside className="availability">
          <h2>Disponibilidad</h2>
          <ToggleList title="Desayunos" kind="breakfast" items={catalog.breakfast_types} onToggle={updateAvailability} />
          <ToggleList title="Huevos" kind="egg" items={catalog.egg_prep_types} onToggle={updateAvailability} />
          <ToggleList title="Ingredientes" kind="ingredient" items={catalog.ingredients} onToggle={updateAvailability} />
          {catalog.extra_categories.map((category) => (
            <ToggleList key={category.id} title={category.name} kind="extra" items={category.extras} onToggle={updateAvailability} />
          ))}
        </aside>
      </section>
    </DashboardShell>
  );
}

function ToggleList({ title, items, kind, onToggle }) {
  return (
    <div className="toggleGroup">
      <h3>{title}</h3>
      {items.map((item) => (
        <label key={`${kind}-${item.id}`} className="toggleRow">
          <span>{item.name}</span>
          <input type="checkbox" checked={item.is_active} onChange={(event) => onToggle(kind, item.id, event.target.checked)} />
        </label>
      ))}
    </div>
  );
}
