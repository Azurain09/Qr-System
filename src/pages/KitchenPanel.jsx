import React, { useEffect, useState } from "react";
import { ArrowLeft, CalendarClock, ChefHat, Circle, Info, X, XCircle } from "lucide-react";
import { api, SLUGS, socketUrl } from "../api/client";
import { CANCELLATION_REASONS, STATUS_FLOW, displayName } from "../constants/app";
import { useCatalog } from "../hooks/useCatalog";
import { DashboardShell, Field, ServiceClosed } from "../components/ui";
import { OrderSummary } from "../components/OrderSummary";

export function KitchenPanel() {
  const { catalog, setCatalog, error, reload } = useCatalog();
  const [orders, setOrders] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [isOpen, setIsOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [updatedOrders, setUpdatedOrders] = useState({});

  const loadOrders = async () => {
    try {
      const data = await api.kitchenOrders();
      setIsOpen(data.is_open);
      const selectedDate = date;
      const visibleOrders = (data.orders || [])
        .filter((order) => {
          const eventDate = (order.confirmed_at || order.created_at || "").slice(0, 10);
          return !selectedDate || eventDate === selectedDate;
        })
        .sort((first, second) => {
          const firstTime = new Date(first.confirmed_at || first.created_at || 0).getTime();
          const secondTime = new Date(second.confirmed_at || second.created_at || 0).getTime();
          return secondTime - firstTime;
        });
      setOrders(visibleOrders);
    } catch (err) {
      setMessage(err.message);
    }
  };

  useEffect(() => {
    loadOrders();
    const socket = new WebSocket(socketUrl(`/ws/kitchen/${SLUGS.cook}`));
    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.order?.id) {
          setUpdatedOrders((current) => ({ ...current, [payload.order.id]: Date.now() }));
        }
      } catch {
        // Ignore malformed socket payloads.
      }
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
      if (status === "Entregado") {
        setTimeout(loadOrders, 21000);
      }
      await loadOrders();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const confirmCancellation = async () => {
    if (!cancelReason) {
      setMessage("Seleccione un motivo de cancelación");
      return;
    }
    try {
      await api.updateStatus(cancellingOrder.id, { status: "Cancelado", reason: cancelReason });
      setCancellingOrder(null);
      setCancelReason("");
      await loadOrders();
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (cancellingOrder) {
    return (
      <DashboardShell title="Motivo de cancelación" icon={<X />} subtitle="Seleccione el motivo antes de cancelar el pedido">
        {message && <div className="alert">{message}</div>}
        <section className="cancelContext">
          <InfoItem label="Huésped" value={cancellingOrder.guest_name} />
          <InfoItem label="Habitación" value={cancellingOrder.room_number || "-"} />
          <InfoItem label="Personas registradas" value="2" />
          <InfoItem label="Mesa" value={cancellingOrder.table_number || "-"} />
          <InfoItem label="Horario" value={cancellingOrder.confirmed_at ? new Date(cancellingOrder.confirmed_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : "-"} />
        </section>
        <section className="cancelLayout">
          <aside className="cancelSummaryCard">
            <h2>Resumen del pedido a cancelar</h2>
            <div className="cancelOrderMeta">
              <span><CalendarClock size={22} /></span>
              <div>
                <b>Pedido #CQC-202-{String(cancellingOrder.id).padStart(5, "0")}</b>
                <p>{cancellingOrder.confirmed_at ? new Date(cancellingOrder.confirmed_at).toLocaleString("es-PE") : "-"}</p>
                <p>Desayuno</p>
              </div>
              <strong>{cancellingOrder.status}</strong>
            </div>
            <OrderSummary order={cancellingOrder} compact />
          </aside>
          <div className="cancelReasonPanel">
            <h2>¿Por qué desea cancelar este pedido?</h2>
            <p>Selecciona el motivo que mejor describe tu cancelación.</p>
            <div className="cancelReasons">
              {CANCELLATION_REASONS.map((reason) => (
                <button key={reason.title} className={cancelReason === reason.title ? "selected" : ""} onClick={() => setCancelReason(reason.title)}>
                  <Circle size={18} />
                  <span>
                    <b>{reason.title}</b>
                    <small>{reason.description}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="cancelWarning">
              <Info size={19} />
              <span>Tu pedido será cancelado y se notificará al huésped en su pantalla.</span>
            </div>
            <div className="cancelActions">
              <button className="secondary" onClick={() => { setCancellingOrder(null); setCancelReason(""); }}>
                No cancelar
              </button>
              <button className="cancelConfirmButton" onClick={confirmCancellation}>Confirmar cancelación</button>
            </div>
          </div>
        </section>
        <div className="cancelBottomNav">
          <button className="portalBack" onClick={() => { setCancellingOrder(null); setCancelReason(""); }}>
            <ArrowLeft size={18} /> Volver
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Cocina" icon={<ChefHat />} subtitle="Pedidos realizados durante el día">
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
              <article className={`orderCard ${updatedOrders[order.id] ? "updatedOrderCard" : ""}`} key={order.id}>
                <div className="orderTop">
                  <div>
                    <h3>{order.guest_name}</h3>
                    <p>{order.document} - {order.delivery_location} - {order.table_number ? `Mesa ${order.table_number}` : `Hab. ${order.room_number}`}</p>
                  </div>
                  <div className="orderBadges">
                    {updatedOrders[order.id] && <span className="updateBadge">Pedido actualizado</span>}
                    <span className="included">{order.status}</span>
                  </div>
                </div>
                <OrderSummary order={order} />
                <p className="muted">Confirmado: {order.confirmed_at ? new Date(order.confirmed_at).toLocaleTimeString("es-PE") : "-"}</p>
                <div className="statusButtons">
                  {STATUS_FLOW.map((status) => (
                    <button key={status} className={order.status === status ? "active" : ""} disabled={order.status === "Cancelado"} onClick={() => updateOrder(order, status)}>
                      {status}
                    </button>
                  ))}
                  {order.status !== "Entregado" && (
                    <button className="cancelOrderButton" disabled={order.status === "Cancelado"} onClick={() => setCancellingOrder(order)}>
                      <XCircle size={16} /> Cancelar
                    </button>
                  )}
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
          <ToggleList title="Ingredientes" kind="ingredient" items={catalog.ingredients} onToggle={updateAvailability} collapsible />
          <h3 className="availabilitySectionTitle">Adicionales</h3>
          {catalog.extra_categories.map((category) => (
            <ToggleList key={category.id} title={category.name} kind="extra" items={category.extras} onToggle={updateAvailability} collapsible />
          ))}
        </aside>
      </section>
    </DashboardShell>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="cancelContextItem">
      <b>{label}:</b>
      <span>{value}</span>
    </div>
  );
}

function ToggleList({ title, items, kind, onToggle, collapsible = false }) {
  const rows = (
    <>
      {items.map((item) => (
        <label key={`${kind}-${item.id}`} className="toggleRow">
          <span>{displayName(item.name)}</span>
          <input type="checkbox" checked={item.is_active} onChange={(event) => onToggle(kind, item.id, event.target.checked)} />
        </label>
      ))}
    </>
  );

  if (collapsible) {
    const activeCount = items.filter((item) => item.is_active).length;
    return (
      <details className="toggleGroup toggleDropdown">
        <summary>
          <span>{displayName(title)}</span>
          <small>{activeCount}/{items.length} disponibles</small>
        </summary>
        {rows}
      </details>
    );
  }

  return (
    <div className="toggleGroup">
      <h3>{displayName(title)}</h3>
      {rows}
    </div>
  );
}
