import React from "react";
import { EXTRA_PRICES, INCLUDED_ITEMS } from "../constants/app";

export function OrderSummary({ order }) {
  const activeExtras = order.extras?.filter((extra) => !extra.is_cancelled) || [];
  const extraTotal = activeExtras.reduce((total, extra) => total + (EXTRA_PRICES[extra.name] || 0) * extra.quantity, 0);

  return (
    <div className="summary">
      {order.claimed_included && <strong className="included">DESAYUNO INCLUIDO</strong>}
      <p><b>{order.guest_name}</b> - {order.document}</p>
      <p>{order.delivery_location} - {order.table_number ? `Mesa ${order.table_number}` : `Habitacion ${order.room_number}`}</p>
      <p><b>Desayuno:</b> {order.breakfast_type}</p>
      {order.egg_prep && <p><b>Huevo:</b> {order.egg_prep}</p>}
      <div className="summaryBlock">
        <b>Incluido sin costo adicional</b>
        <ul>
          {INCLUDED_ITEMS.map((item) => <li key={item.name}>{item.quantity} x {item.name}</li>)}
        </ul>
      </div>
      {activeExtras.length > 0 && (
        <div className="summaryBlock">
          <b>Adicionales</b>
          <ul>
            {activeExtras.map((extra) => {
              const unitPrice = EXTRA_PRICES[extra.name] || 0;
              return (
                <li key={extra.id}>
                  <span>{extra.quantity} x {extra.category_name} - {extra.name}{extra.egg_prep ? ` (${extra.egg_prep})` : ""}</span>
                  <strong>S/ {(unitPrice * extra.quantity).toFixed(2)}</strong>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p><b>Subtotal adicionales:</b> S/ {extraTotal.toFixed(2)}</p>
      {order.status && <p><b>Estado:</b> {order.status}</p>}
    </div>
  );
}
