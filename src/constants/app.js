export const CANCELLATION_REASONS = [
  {
    title: "Solicitud del huÃ©sped",
    description: "El huÃ©sped solicitÃ³ cancelar el pedido verbalmente.",
  },
  {
    title: "Cambios de planes",
    description: "Mis planes han cambiado y ya no necesito el pedido.",
  },
  {
    title: "Otro motivo",
    description: "Otro motivo no listado.",
  },
];

export const STATUS_FLOW = ["Pendiente", "En preparaciÃ³n", "Entregado"];
export const ASSET_BASE = "/portal-assets";
export const DISPLAY_NAMES = {
  Cafe: "CafÃ©",
  "Cafe Negro": "CafÃ© Negro",
  "Cafe con Leche": "CafÃ© con Leche",
  "Con jamon y queso": "Con jamÃ³n y queso",
  "Solo jamon": "Solo jamÃ³n",
  Dietetico: "DietÃ©tico",
  "Dietetico adicional": "DietÃ©tico adicional",
  Lacteos: "LÃ¡cteos",
  Pina: "PiÃ±a",
  Melon: "MelÃ³n",
  Sandia: "SandÃ­a",
  Surtido: "Surtido",
  "Yogurt pequeno": "Yogurt pequeÃ±o",
};
export const displayName = (name) => DISPLAY_NAMES[name] || name;
export const BREAKFAST_IMAGES = {
  Americano: `${ASSET_BASE}/Americano.webp`,
  Continental: `${ASSET_BASE}/Continental.webp`,
  Dietetico: `${ASSET_BASE}/Dietetico.webp`,
};
export const EGG_IMAGES = {
  Fritos: `${ASSET_BASE}/egg-fritos.webp`,
  Hervidos: `${ASSET_BASE}/egg-hervidos.webp`,
  Revueltos: `${ASSET_BASE}/egg-revueltos.webp`,
  Escalfados: `${ASSET_BASE}/egg-escalfados.webp`,
};
export const EGG_DESCRIPTIONS = {
  Fritos: "Huevos fritos en aceite o mantequilla.",
  Hervidos: "Huevos cocidos en agua hasta la cocciÃ³n deseada.",
  Revueltos: "Huevos batidos y cocidos a fuego lento.",
  Escalfados: "Huevos cocidos en agua sin cÃ¡scara.",
};
export const JUICE_OPTIONS = [
  { name: "Naranja", ingredientNames: ["Naranja"], image: `${ASSET_BASE}/juice-naranja.webp`, color: "orange" },
  { name: "PiÃ±a", ingredientNames: ["Pina"], image: `${ASSET_BASE}/juice-pina.webp`, color: "orange" },
  { name: "Papaya", ingredientNames: ["Papaya"], image: `${ASSET_BASE}/juice-papaya.webp`, color: "orange" },
  { name: "Mango", ingredientNames: ["Mango"], image: `${ASSET_BASE}/juice-mango.webp`, color: "orange" },
  { name: "Fresa", ingredientNames: ["Fresa"], image: `${ASSET_BASE}/juice-fresa.webp`, color: "orange" },
  { name: "Melon", ingredientNames: ["Melon"], image: `${ASSET_BASE}/juice-melon.webp`, color: "orange" },
  { name: "Sandia", ingredientNames: ["Sandia"], image: `${ASSET_BASE}/juice-sandia.webp`, color: "orange" },
  { name: "Surtido", ingredientNames: ["Surtido"], image: `${ASSET_BASE}/juice-surtido.webp`, color: "orange" },
];
export const COFFEE_OPTIONS = [
  { name: "CafÃ© Negro", ingredientNames: ["Cafe"], image: `${ASSET_BASE}/coffee-negro.webp`, color: "purple" },
  { name: "CafÃ© con Leche", ingredientNames: ["Cafe", "Leche"], image: `${ASSET_BASE}/coffee-leche.webp`, color: "purple" },
];
export const PURGE_CONFIRMATION = "ELIMINAR PEDIDOS";

export const INCLUDED_ITEMS = [
  { name: "Jugo", quantity: 1 },
  { name: "CafÃ©", quantity: 1 },
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
  "Melon": 6,
  "Sandia": 6,
  "Surtido": 8,
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
