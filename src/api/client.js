const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export const STAFF_LINKS = {
  cook: "/cocina-huaca-7429",
  reception: "/recepcion-sol-3186",
  manager: "/gerencia-cacique-9051",
};

export const SLUGS = {
  cook: "cocina-huaca-7429",
  reception: "recepcion-sol-3186",
  manager: "gerencia-cacique-9051",
};

export function socketUrl(path) {
  const base = API_URL.replace(/^http/, "ws");
  return `${base}${path}`;
}

async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) {
    let message = "No se pudo completar la accion";
    try {
      const data = await response.json();
      message = data.detail || message;
      if (Array.isArray(message)) message = message[0]?.msg || "Completar todos los campos";
    } catch {
      // Keep default message.
    }
    throw new Error(message);
  }
  return response.json();
}

export const api = {
  catalog: () => request("/catalog"),
  createOrder: (payload) => request("/orders", { method: "POST", body: JSON.stringify(payload) }),
  confirmOrder: (orderId) => request(`/orders/${orderId}/confirm`, { method: "POST" }),
  getOrder: (orderId) => request(`/orders/${orderId}`),
  getOrderByDocument: (document) => request(`/orders/by-document/${document}`),
  kitchenOrders: () => request(`/staff/${SLUGS.cook}/orders`),
  updateStatus: (orderId, payload) =>
    request(`/staff/${SLUGS.cook}/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify(payload) }),
  cancelExtra: (detailId, payload) =>
    request(`/staff/${SLUGS.cook}/extras/${detailId}/cancel`, { method: "PATCH", body: JSON.stringify(payload) }),
  availability: (kind, id, is_active) =>
    request(`/staff/${SLUGS.cook}/availability/${kind}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active }),
    }),
  report: (slug, date) => request(`/reports/${slug}/daily${date ? `?date=${date}` : ""}`),
  dashboardReport: (slug, date) => request(`/reports/${slug}/dashboard${date ? `?date=${date}` : ""}`),
  staff: () => request(`/manager/${SLUGS.manager}/staff`),
  createStaff: (payload) => request(`/manager/${SLUGS.manager}/staff`, { method: "POST", body: JSON.stringify(payload) }),
  updateStaff: (id, payload) =>
    request(`/manager/${SLUGS.manager}/staff/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  purgeOrders: (confirmation_phrase) =>
    request(`/manager/${SLUGS.manager}/purge-orders`, {
      method: "POST",
      body: JSON.stringify({ confirmation_phrase }),
    }),
};

export function excelUrl(slug, date) {
  return `${API_URL}/reports/${slug}/daily.xlsx${date ? `?date=${date}` : ""}`;
}
