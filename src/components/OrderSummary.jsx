import React from "react";

export function OrderSummary({ order }) {
  return (
    <div className="summary">
      {order.claimed_included && <strong className="included">DESAYUNO INCLUIDO</strong>}
      <p><b>{order.guest_name}</b> - {order.document}</p>
      <p>{order.delivery_location} - {order.table_number ? `Mesa ${order.table_number}` : `Habitacion ${order.room_number}`}</p>
      <p>{order.breakfast_type}{order.egg_prep ? ` - ${order.egg_prep}` : ""}</p>
      {order.extras?.filter((extra) => !extra.is_cancelled).length > 0 && (
        <ul>
          {order.extras.filter((extra) => !extra.is_cancelled).map((extra) => (
            <li key={extra.id}>{extra.quantity} x {extra.category_name} - {extra.name}{extra.egg_prep ? ` (${extra.egg_prep})` : ""}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
