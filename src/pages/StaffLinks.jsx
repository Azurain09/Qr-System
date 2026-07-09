import React from "react";
import { Building2, ChefHat, ClipboardList, ExternalLink, ShieldCheck, Users } from "lucide-react";
import { STAFF_LINKS } from "../api/client";
import { ASSET_BASE } from "../constants/app";

const ACCESS_AREAS = [
  {
    title: "Cocina",
    description: "Pedidos del día, estados y disponibilidad de insumos.",
    href: STAFF_LINKS.cook,
    icon: <ChefHat size={22} />,
  },
  {
    title: "Recepción",
    description: "Dashboard, filtros de consumo y reportes operativos.",
    href: STAFF_LINKS.reception,
    icon: <ClipboardList size={22} />,
  },
  {
    title: "Gerencia",
    description: "Gestión de usuarios y descarga de reportes.",
    href: STAFF_LINKS.manager,
    icon: <Users size={22} />,
  },
];

export function StaffLinks() {
  return (
    <main className="staffLinksPage">
      <header className="staffLinksTopbar">
        <div>
          <span className="staffLinksEyebrow"><Building2 size={18} /> Cacique Hotel</span>
          <h1>QR System</h1>
          <p>Accesos internos del sistema de pedidos digitales.</p>
        </div>
        <img src={`${ASSET_BASE}/logo.webp`} alt="QR System" decoding="async" />
      </header>

      <section className="staffLinksCard" aria-label="Accesos internos por área">
        <div className="staffLinksIntro">
          <span><ShieldCheck size={24} /></span>
          <div>
            <h2>Seleccione el área de acceso</h2>
            <p>Las áreas internas solicitan usuario y contraseña antes de mostrar información operativa.</p>
          </div>
        </div>

        <div className="staffAccessList">
          {ACCESS_AREAS.map((area, index) => (
            <details className="staffAccessGroup" key={area.title} open={index === 0}>
              <summary>
                <span>{area.icon}</span>
                <div>
                  <strong>{area.title}</strong>
                  <small>{area.description}</small>
                </div>
              </summary>
              <div className="staffAccessLinks">
                <a className="staffAccessButton" href={area.href}>
                  <span>{area.icon}</span>
                  <div>
                    <strong>Ingresar a {area.title}</strong>
                    <small>Acceso protegido por usuario y contraseña</small>
                  </div>
                  <ExternalLink size={17} />
                </a>
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
