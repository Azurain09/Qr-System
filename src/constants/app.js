export const CANCELLATION_REASONS = [
  {
    title: "Pedido realizado por error",
    description: "Hice el pedido por equivocacion.",
  },
  {
    title: "Cambios de planes",
    description: "Mis planes han cambiado y ya no necesito el pedido.",
  },
  {
    title: "Tiempo de espera",
    description: "El tiempo de espera es demasiado largo.",
  },
  {
    title: "Problema con el pedido",
    description: "Hubo un problema con mi pedido.",
  },
  {
    title: "Otro motivo",
    description: "Otro motivo no listado.",
  },
];

export const STATUS_FLOW = ["Pendiente", "En preparación", "Entregado"];
export const ASSET_BASE = "/portal-assets";
export const BREAKFAST_IMAGES = {
  Americano: `${ASSET_BASE}/Americano.png`,
  Continental: `${ASSET_BASE}/Continental.png`,
  Dietetico: `${ASSET_BASE}/Dietetico.png`,
};
export const EGG_IMAGES = {
  Fritos: `${ASSET_BASE}/egg-fritos.png`,
  Hervidos: `${ASSET_BASE}/egg-hervidos.png`,
  Revueltos: `${ASSET_BASE}/egg-revueltos.png`,
  Escalfados: `${ASSET_BASE}/egg-escalfados.png`,
};
export const EGG_DESCRIPTIONS = {
  Fritos: "Huevos fritos en aceite o mantequilla.",
  Hervidos: "Huevos cocidos en agua hasta la coccion deseada.",
  Revueltos: "Huevos batidos y cocidos a fuego lento.",
  Escalfados: "Huevos cocidos en agua sin cascara.",
};
export const JUICE_OPTIONS = [
  { name: "Naranja", image: `${ASSET_BASE}/juice-naranja.png`, color: "orange" },
  { name: "Pina", image: `${ASSET_BASE}/juice-pina.png`, color: "orange" },
  { name: "Papaya", image: `${ASSET_BASE}/juice-papaya.png`, color: "orange" },
  { name: "Guayaba", image: `${ASSET_BASE}/juice-guayaba.png`, color: "orange" },
];
export const COFFEE_OPTIONS = [
  { name: "Cafe Negro", image: `${ASSET_BASE}/coffee-negro.png`, color: "purple" },
  { name: "Cafe con Leche", image: `${ASSET_BASE}/coffee-leche.png`, color: "purple" },
];
export const PURGE_CONFIRMATION = "ELIMINAR PEDIDOS";

export const INCLUDED_ITEMS = [
  { name: "Jugo", quantity: 1 },
  { name: "Cafe", quantity: 1 },
];

export const EXTRA_PRICES = {
  "Solo": 2,
  "Con mantequilla y mermelada": 4,
  "Solo mantequilla": 3,
  "Solo mermelada": 3,
  "Con jamon y queso": 6,
  "Solo jamon": 4,
  "Solo queso": 4,
  "Naranja": 6,
  "Papaya": 6,
  "Pina": 6,
  "Fresa": 7,
  "Mixto de la casa": 8,
  "Ensalada de frutas": 10,
  "Ensalada fresca": 9,
  "Americano adicional": 18,
  "Continental adicional": 18,
  "Dietetico adicional": 18,
  "Huevos adicionales": 8,
  "Cafe": 5,
  "Leche": 5,
  "Yogurt pequeno": 6,
  "Yogurt grande": 9,
};
