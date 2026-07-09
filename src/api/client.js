const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const NGROK_BYPASS_HEADERS = API_URL.includes("ngrok-free")
  ? { "ngrok-skip-browser-warning": "true" }
  : {};

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

const STAFF_TOKEN_KEYS = {
  cook: "qr_staff_token_cook",
  reception: "qr_staff_token_reception",
  manager: "qr_staff_token_manager",
};

function roleFromPath(path) {
  if (path.includes(SLUGS.cook)) return "cook";
  if (path.includes(SLUGS.reception)) return "reception";
  if (path.includes(SLUGS.manager)) return "manager";
  return null;
}

export function getStaffToken(role) {
  return role ? localStorage.getItem(STAFF_TOKEN_KEYS[role]) : null;
}

export function setStaffToken(role, token) {
  if (role && token) localStorage.setItem(STAFF_TOKEN_KEYS[role], token);
}

export function clearStaffToken(role) {
  if (role) localStorage.removeItem(STAFF_TOKEN_KEYS[role]);
}

export function socketUrl(path, role) {
  const base = API_URL.replace(/^http/, "ws");
  const token = getStaffToken(role);
  if (!token) return `${base}${path}`;
  const separator = path.includes("?") ? "&" : "?";
  return `${base}${path}${separator}token=${encodeURIComponent(token)}`;
}

async function request(path, options = {}) {
  const role = options.staffRole || roleFromPath(path);
  const token = getStaffToken(role);
  const headers = { "Content-Type": "application/json", ...NGROK_BYPASS_HEADERS, ...(options.headers || {}) };
  if (token) headers["X-Staff-Token"] = token;
  const { staffRole, ...fetchOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    headers,
    ...fetchOptions,
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
  staffLogin: (role, username, password) => request("/auth/staff", { method: "POST", body: JSON.stringify({ role, username, password }) }),
  catalog: () => request("/catalog"),
  createOrder: (payload) => request("/orders", { method: "POST", body: JSON.stringify(payload) }),
  confirmOrder: (orderId) => request(`/orders/${orderId}/confirm`, { method: "POST" }),
  addOrderExtras: (orderId, extras) => request(`/orders/${orderId}/extras`, { method: "POST", body: JSON.stringify({ extras }) }),
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
  createCatalogItem: (kind, name) =>
    request(`/staff/${SLUGS.cook}/catalog-items`, {
      method: "POST",
      body: JSON.stringify({ kind, name }),
    }),
  report: (slug, date, filters = {}) => request(`/reports/${slug}/daily${reportQuery(date, filters)}`),
  dashboardReport: (slug, date, filters = {}) => request(`/reports/${slug}/dashboard${reportQuery(date, filters)}`),
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

function reportQuery(date, filters = {}) {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (filters.period) params.set("period", filters.period);
  if (filters.consumptionType) params.set("consumption_type", filters.consumptionType);
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function excelUrl(slug, date, filters = {}) {
  const role = slug === SLUGS.manager ? "manager" : "reception";
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (filters.period) params.set("period", filters.period);
  if (filters.consumptionType) params.set("consumption_type", filters.consumptionType);
  const token = getStaffToken(role);
  if (token) params.set("token", token);
  const query = params.toString();
  return `${API_URL}/reports/${slug}/daily.xlsx${query ? `?${query}` : ""}`;
}
