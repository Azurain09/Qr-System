import React from "react";
import { SLUGS } from "./api/client";
import { GuestApp } from "./pages/GuestApp";
import { KitchenPanel } from "./pages/KitchenPanel";
import { ReportPanel } from "./pages/ReportPanel";
import { StaffLinks } from "./pages/StaffLinks";

export function App() {
  const path = window.location.pathname.replace(/^\/+/, "");
  if (path === SLUGS.cook) return <KitchenPanel />;
  if (path === SLUGS.reception) return <ReportPanel />;
  if (path === SLUGS.manager) return <ReportPanel manager />;
  if (path === "links") return <StaffLinks />;
  return <GuestApp />;
}
