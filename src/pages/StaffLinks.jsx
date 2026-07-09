import React from "react";
import { Building2, ChefHat, ClipboardList, ExternalLink, Hotel, ShieldCheck, Users } from "lucide-react";
import { STAFF_LINKS } from "../api/client";
import { ASSET_BASE } from "../constants/app";

const ACCESS_GROUPS = [
  {
    title: "Atención al huésped",
    description: "Ingreso público para registrar pedidos de desayuno.",
    icon: <Hotel size={22} />,
    links: [{ label: "Portal de huésped", href: "/", helper: "Validación por DNI y registro de pedido" }],
  },
  {
    title: "Operación diaria",
    description: "Áreas que gestionan pedidos, reportes y atención durante el servicio.",
    icon: <ClipboardList size={22} />,
    links: [
      { label: "Cocina", href: STAFF_LINKS.cook, helper: "Pedidos del día y disponibilidad", icon: <ChefHat size={18} /> },
      { label: "Recepción", href: STAFF_LINKS.reception, helper: "Dashboard y reportes operativos", icon: <ClipboardList size={18} /> },
    ],
  },
  {
    title: "Administración",
    description: "Acceso interno para gestión de usuarios autorizados.",
    icon: <ShieldCheck size={22} />,
    links: [{ label: "Gerencia", href: STAFF_LINKS.manager, helper: "Usuarios, roles y descarga de reportes", icon: <Users size={18} /> }],
  },
];

export function StaffLinks() {
  return (
    <main className="staffLinksPage">
      <header className="staffLinksTopbar">
        <div>
          <span className="staffLinksEyebrow"><Building2 size={18} /> Cacique Hotel</span>
          <h1>QR System</h1>
          <p>Accesos principales del sistema de pedidos digitales.</p>
        </div>
        <img src={`${ASSET_BASE}/logo.webp`} alt="QR System" decoding="async" />
      </header>

      <section className="staffLinksCard" aria-label="Accesos por área">
        <div className="staffLinksIntro">
          <span><ShieldCheck size={24} /></span>
          <div>
            <h2>Seleccione el área de acceso</h2>
            <p>Las interfaces internas solicitan usuario y contraseña antes de mostrar información operativa.</p>
          </div>
        </div>

        <div className="staffAccessList">
          {ACCESS_GROUPS.map((group, index) => (
            <details className="staffAccessGroup" key={group.title} open={index === 0}>
              <summary>
                <span>{group.icon}</span>
                <div>
                  <strong>{group.title}</strong>
                  <small>{group.description}</small>
                </div>
              </summary>
              <div className="staffAccessLinks">
                {group.links.map((link) => (
                  <a className="staffAccessButton" href={link.href} key={link.label}>
                    <span>{link.icon || group.icon}</span>
                    <div>
                      <strong>{link.label}</strong>
                      <small>{link.helper}</small>
                    </div>
                    <ExternalLink size={17} />
                  </a>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}
