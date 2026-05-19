export const CANCELLATION_REASONS = [
  "Pedido duplicado",
  "Retiro del huesped antes de recibir el desayuno",
  "Agotamiento de insumos",
  "Error en el pedido",
  "Imposibilidad de preparacion",
  "Cambio de decision del huesped",
];

export const STATUS_FLOW = ["Pendiente", "En preparación", "Entregado"];
export const ASSET_BASE = "/portal-assets";
export const BREAKFAST_IMAGES = {
  Americano: `${ASSET_BASE}/Americano.png`,
  Continental: `${ASSET_BASE}/Continental.png`,
  Dietetico: `${ASSET_BASE}/Dietetico.png`,
};
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
