import React from "react";
import { ArrowRight, ClipboardList, Lock, ShieldCheck, Utensils } from "lucide-react";
import { api, setStaffToken, SLUGS } from "./api/client";
import { ASSET_BASE } from "./constants/app";
import { GuestApp } from "./pages/GuestApp";
import { KitchenPanel } from "./pages/KitchenPanel";
import { ReportPanel } from "./pages/ReportPanel";
import { StaffLinks } from "./pages/StaffLinks";
import { GuestChrome, PortalInfo } from "./components/ui";

function StaffPasswordGate({ title, subtitle, icon, role, children }) {
  const [isAuthorized, setIsAuthorized] = React.useState(false);
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [message, setMessage] = React.useState("");

  const submit = async (event) => {
    event.preventDefault();
    try {
      const data = await api.staffLogin(role, username, password);
      setStaffToken(role, data.token);
      setIsAuthorized(true);
      setUsername("");
      setPassword("");
      setMessage("");
      return;
    } catch (err) {
      setMessage(err.message || "ContraseÃ±a incorrecta");
    }
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
              <IdCardFallback />
              <input
                type="text"
                value={username}
                placeholder="Usuario"
                autoComplete="username"
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div className="documentInput loginInput">
              <Lock size={20} />
              <input
                type="password"
                value={password}
                placeholder="ContraseÃ±a"
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            <button className="portalPrimary loginButton" type="submit">
              <ArrowRight size={22} />
              Ingresar
            </button>
            <PortalInfo>Ingrese el usuario y la contraseÃ±a autorizados para acceder a esta interfaz.</PortalInfo>
            <div className="loginCopyright">Â© 2025 Cacique Hotel - Todos los derechos reservados</div>
          </form>
          <img className="loginHotelImage" src={`${ASSET_BASE}/Hotel.webp`} alt="Hotel Cacique" decoding="async" />
        </div>
      </section>
    </GuestChrome>
  );
}

function IdCardFallback() {
  return <span className="loginUserIcon">U</span>;
}

export function App() {
  const path = window.location.pathname.replace(/^\/+|\/+$/g, "");
  if (path === SLUGS.cook) {
    return (
      <StaffPasswordGate role="cook" title="COCINA" subtitle="Ingrese usuario y contraseÃ±a para acceder a los pedidos" icon={<Utensils size={21} />}>
        <KitchenPanel />
      </StaffPasswordGate>
    );
  }
  if (path === SLUGS.reception) {
    return (
      <StaffPasswordGate role="reception" title="RECEPCIÃ“N" subtitle="Ingrese usuario y contraseÃ±a para acceder a los reportes" icon={<ClipboardList size={21} />}>
        <ReportPanel />
      </StaffPasswordGate>
    );
  }
  if (path === SLUGS.manager) {
    return (
      <StaffPasswordGate role="manager" title="GERENCIA" subtitle="Ingrese usuario y contraseÃ±a para administrar el sistema" icon={<ShieldCheck size={21} />}>
        <ReportPanel manager />
      </StaffPasswordGate>
    );
  }
  if (path === "links") return <StaffLinks />;
  return <GuestApp />;
}
