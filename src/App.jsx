import React from "react";
import { ArrowRight, ClipboardList, Lock, Utensils } from "lucide-react";
import { SLUGS } from "./api/client";
import { ASSET_BASE } from "./constants/app";
import { GuestApp } from "./pages/GuestApp";
import { KitchenPanel } from "./pages/KitchenPanel";
import { ReportPanel } from "./pages/ReportPanel";
import { StaffLinks } from "./pages/StaffLinks";
import { GuestChrome, PortalInfo } from "./components/ui";

const STAFF_PASSWORD = "Cacique2026";

function StaffPasswordGate({ title, subtitle, icon, children }) {
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [password, setPassword] = React.useState("");
  const [message, setMessage] = React.useState("");

  const submit = (event) => {
    event.preventDefault();
    if (password === STAFF_PASSWORD) {
      setIsAuthorized(true);
      setPassword("");
      setMessage("");
      return;
    }
    setMessage("Contraseña incorrecta");
  };

  if (isAuthorized) return children;

  return (
    <GuestChrome title={title} icon={icon} footer={false} className="loginPortal staffLoginPortal">
      <section className="documentScreen loginReferenceScreen">
        <div className="loginSplitCard staffLoginCard">
          <form className="loginPane" onSubmit={submit}>
            <h1>{title}</h1>
            <p>{subtitle}</p>
            {message && <div className="portalAlert staffLoginAlert">{message}</div>}
            <div className="documentInput loginInput">
              <Lock size={20} />
              <input
                type="password"
                value={password}
                placeholder="Contraseña"
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button className="portalPrimary loginButton" type="submit">
              <ArrowRight size={22} />
              Ingresar
            </button>
            <PortalInfo>Ingrese la contraseña autorizada para acceder a esta interfaz.</PortalInfo>
            <div className="loginCopyright">© 2025 Cacique Hotel - Todos los derechos reservados</div>
          </form>
          <img className="loginHotelImage" src={`${ASSET_BASE}/Hotel.png`} alt="Hotel Cacique" />
        </div>
      </section>
    </GuestChrome>
  );
}

export function App() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (path === SLUGS.cook) {
    return (
      <StaffPasswordGate title="COCINA" subtitle="Ingrese la contraseña para acceder a los pedidos" icon={<Utensils size={21} />}>
        <KitchenPanel />
      </StaffPasswordGate>
    );
  }
  if (path === SLUGS.reception) {
    return (
      <StaffPasswordGate title="RECEPCIÓN" subtitle="Ingrese la contraseña para acceder a los reportes" icon={<ClipboardList size={21} />}>
        <ReportPanel />
      </StaffPasswordGate>
    );
  }
  if (path === SLUGS.manager) return <ReportPanel manager />;
  if (path === "links") return <StaffLinks />;
  return <GuestApp />;
}
