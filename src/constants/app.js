export const CANCELLATION_REASONS = [
  "Pedido duplicado",
  "Retiro del huesped antes de recibir el desayuno",
  "Agotamiento de insumos",
  "Error en el pedido",
  "Imposibilidad de preparacion",
  "Cambio de decision del huesped",
];

export const STATUS_FLOW = ["Pendiente", "En preparacion", "En camino", "Entregado"];
export const ASSET_BASE = "/portal-assets";
export const BREAKFAST_IMAGES = {
  Americano: `${ASSET_BASE}/Americano.png`,
  Continental: `${ASSET_BASE}/Continental.png`,
  Dietetico: `${ASSET_BASE}/Dietetico.png`,
};
export const PURGE_CONFIRMATION = "ELIMINAR PEDIDOS";
