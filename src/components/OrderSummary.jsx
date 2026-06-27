import React from "react";
import { EXTRA_PRICES, displayName } from "../constants/app";

export function OrderSummary({ order }) {
  const activeExtras = order.extras?.filter((extra) => !extra.is_cancelled) || [];
  const extraTotal = activeExtras.reduce((total, extra) => total + (EXTRA_PRICES[extra.name] || 0) * extra.quantity, 0);
  const includedDrinks = Array.isArray(order.included_drinks) ? order.included_drinks : [
    order.included_drinks?.juice ? { kind: "juice", name: order.included_drinks.juice, quantity: 1 } : { kind: "juice", name: "Jugo", quantity: 1 },
    order.included_drinks?.coffee ? { kind: "coffee", name: order.included_drinks.coffee, quantity: 1 } : { kind: "coffee", name: "Cafe", quantity: 1 },
  ];

  return (
    <div className="summary">
      {order.claimed_included && <strong className="included">DESAYUNO INCLUIDO</strong>}
      <p><b>{order.guest_name}</b> - {order.document}</p>
      <p>{order.delivery_location} - {order.table_number ? `Mesa ${order.table_number}` : `Habitación ${order.room_number}`}</p>
      <p><b>Desayuno:</b> {displayName(order.breakfast_type)}</p>
      {order.egg_prep && <p><b>Huevo:</b> {order.egg_prep}</p>}
      <div className="summaryBlock">
        <b>Incluido sin costo adicional</b>
        <ul>
          {includedDrinks.map((drink, index) => (
            <li key={`${drink.kind}-${drink.name}-${index}`}>{drink.quantity} x {drink.kind === "juice" ? "Jugo de " : ""}{displayName(drink.name)}</li>
          ))}
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
                  <span>{extra.quantity} x {displayName(extra.category_name)} - {displayName(extra.name)}{extra.egg_prep ? ` (${extra.egg_prep})` : ""}</span>
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
