import React from "react";
import { Hotel } from "lucide-react";
import { STAFF_LINKS } from "../api/client";

export function StaffLinks() {
  return (
    <main className="centerScreen">
      <section className="notice">
        <Hotel size={40} />
        <h1>QR System</h1>
        <p>Portal publico de huespedes. Los paneles del personal usan URLs ocultas.</p>
        <div className="linkStack">
          <a href={STAFF_LINKS.cook}>Cocina</a>
          <a href={STAFF_LINKS.reception}>Recepcion</a>
          <a href={STAFF_LINKS.manager}>Gerencia</a>
        </div>
      </section>
    </main>
  );
}
