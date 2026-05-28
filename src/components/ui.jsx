import React from "react";
import { ArrowLeft, Building2, Hotel, Info } from "lucide-react";
import { ASSET_BASE } from "../constants/app";

export function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function QuantityButton({ children, onClick }) {
  return (
    <button className="iconButton" type="button" onClick={onClick}>
      {children}
    </button>
  );
}

export function ServiceClosed({ title = "Sistema fuera de servicio" }) {
  return (
    <main className="centerScreen">
      <section className="notice">
        <Hotel size={40} />
        <h1>{title}</h1>
        <p>El horario para huespedes es de 6:00 AM a 11:00 AM. Cocina opera de 5:30 AM a 11:00 AM.</p>
      </section>
    </main>
  );
}

export function GuestChrome({ title, icon, children, footer = true, countdown, className = "" }) {
  return (
    <main className={`guestPortal ${className}`}>
      <header className="portalTopbar">
        <div className="portalTitle">
          <span className="portalIcon">{icon}</span>
          <strong>{title}</strong>
        </div>
        <img className="portalLogo" src={`${ASSET_BASE}/logo.png`} alt="QR System" />
      </header>
      {countdown && <div className="floatingCountdown">{countdown}</div>}
      <div className="portalCanvas">{children}</div>
      {footer && <GuestFooter />}
    </main>
  );
}

export function GuestFooter() {
  return (
    <footer className="portalFooter">
      <Building2 size={20} />
      <span>Cacique Hotel</span>
    </footer>
  );
}

export function PortalInfo({ children }) {
  return (
    <div className="portalInfo">
      <span>
        <Info size={18} />
      </span>
      <strong>Importante:</strong>
      <p>{children}</p>
    </div>
  );
}

export function BackButton({ onClick, children = "Volver" }) {
  return (
    <button className="portalBack" type="button" onClick={onClick}>
      <ArrowLeft size={18} />
      {children}
    </button>
  );
}

export function DashboardShell({ title, subtitle, icon, children, className = "" }) {
  return (
    <main className={`dashboard ${className}`}>
      <header className="staffTopbar">
        <div className="portalTitle">
          <span className="portalIcon">{icon}</span>
          <strong>{title}</strong>
        </div>
        <img className="portalLogo" src={`${ASSET_BASE}/logo.png`} alt="QR System" />
      </header>
      <section className="staffIntro">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>
      {children}
    </main>
  );
}
