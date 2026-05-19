import React, { useEffect, useState } from "react";
import { ChefHat } from "lucide-react";
import { api, SLUGS, socketUrl } from "../api/client";
import { STATUS_FLOW } from "../constants/app";
import { useCatalog } from "../hooks/useCatalog";
import { DashboardShell, Field, ServiceClosed } from "../components/ui";
import { OrderSummary } from "../components/OrderSummary";

export function KitchenPanel() {
  const { catalog, setCatalog, error, reload } = useCatalog();
  const [orders, setOrders] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");

  const loadOrders = async () => {
    try {
      const data = await api.kitchenOrders();
      setIsOpen(data.is_open);
      const selectedDate = date;
      setOrders((data.orders || []).filter((order) => {
        const eventDate = (order.confirmed_at || order.created_at || "").slice(0, 10);
        return !selectedDate || eventDate === selectedDate;
      }));
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
    const poll = setInterval(loadOrders, 8000);
    return () => {
      socket.close();
      clearInterval(poll);
    };
  }, [date]);

  if (!isOpen) return <ServiceClosed />;
  if (!catalog) return <main className="dashboard">{error || "Cargando..."}</main>;

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
      await api.updateStatus(order.id, { status });
      await loadOrders();
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <DashboardShell title="Cocina" icon={<ChefHat />} subtitle="Pedidos realizados durante el dia">
      {message && <div className="alert">{message}</div>}
      <section className="reportToolbar">
        <Field label="Fecha">
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </Field>
      </section>
      <section className="kitchenOrdersLayout">
        <div>
          <h2>Pedidos de hoy</h2>
          <div className="orderList">
            {orders.map((order) => (
              <article className="orderCard" key={order.id}>
                <div className="orderTop">
                  <div>
                    <h3>{order.guest_name}</h3>
                    <p>{order.document} - {order.delivery_location} - {order.table_number ? `Mesa ${order.table_number}` : `Hab. ${order.room_number}`}</p>
                  </div>
                  <span className="included">{order.status}</span>
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
              </article>
            ))}
            {!orders.length && <div className="emptyState">No hay pedidos confirmados para esta fecha.</div>}
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
