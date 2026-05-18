// ============================================================================
// DOMINIO: Identidad y Acceso
// ============================================================================

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  activo: boolean;
  roles: string[]; // ["ADMIN", "CLIENT", etc.]
  creado_en: string;
  actualizado_en: string;
}

export interface DireccionEntrega {
  id: number;
  usuario_id: number;
  alias?: string;
  linea1: string;
  linea2?: string;
  ciudad: string;
  codigo_postal: string;
  referencia?: string;
  es_principal: boolean;
  creado_en: string;
  actualizado_en: string;
}

// ============================================================================
// DOMINIO: Catálogo de Productos
// ============================================================================

export interface Categoria {
  id: number;
  nombre: string;
  descripcion?: string;
  imagen_url?: string;
  parent_id?: number;
  creado_en: string;
  actualizado_en: string;
  eliminado_en?: string;
}

export interface Ingrediente {
  id: number;
  nombre: string;
  descripcion?: string;
  es_alergeno: boolean;
  unidad_medida: string;
  precio: number;
  tipo_extra?: string | null;
  disponible_como_extra: boolean;
  creado_en: string;
  actualizado_en: string;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  stock_cantidad: number;
  disponible: boolean;
  imagen_url?: string;
  creado_en: string;
  actualizado_en: string;
  eliminado_en?: string;
  categorias?: Categoria[];
  ingredientes?: ProductoIngredienteInfo[];
}

export interface ProductoIngrediente {
  producto_id: number;
  ingrediente_id: number;
  es_removible: boolean;
}

export interface ProductoIngredienteInfo {
  ingrediente_id: number;
  nombre: string;
  es_alergeno: boolean;
  es_removible: boolean;
  cantidad: number;
}

export interface FormaPago {
  codigo: string; // PK semántica: MERCADOPAGO | EFECTIVO | TRANSFERENCIA
  nombre: string;
  habilitado: boolean;
}

// ============================================================================
// DOMINIO: Ventas, Pagos y Trazabilidad
// ============================================================================

export interface EstadoPedido {
  codigo: string; // PENDIENTE | CONFIRMADO | EN_PREP | EN_CAMINO | ENTREGADO | CANCELADO
  nombre: string;
  descripcion?: string;
  es_terminal: boolean;
}

export interface DetallePedido {
  id?: number;
  pedido_id?: number;
  producto_id: number;
  nombre_snapshot: string;
  precio_snapshot: number;
  cantidad: number;
  subtotal: number;
  personalizacion?: number[];
}

export interface HistorialEstadoPedido {
  id: number;
  pedido_id?: number;
  estado_desde?: string;
  estado_hasta: string;
  usuario_id?: number;
  motivo?: string;
  created_at: string;
}

export interface Pedido {
  id: number;
  usuario_id: number;
  estado_codigo: string;
  direccion_id?: number;
  direccion_snapshot?: string;
  forma_pago_codigo: string;
  subtotal: number;
  descuento?: number;
  costo_envio: number;
  total: number;
  notas?: string;
  creado_en: string;
  actualizado_en?: string;
  eliminado_en?: string;
  usuario_nombre?: string;
  // Relaciones expandidas (cuando se solicita detalle)
  items?: DetallePedido[];
  historial?: HistorialEstadoPedido[];
  pagos?: Pago[];
}

export interface Pago {
  id: number;
  pedido_id: number;
  monto: number;
  mp_payment_id?: number;
  mp_status: string; // pending | approved | rejected | in_process | cancelled
  external_reference: string;
  idempotency_key: string;
  creado_en: string;
  actualizado_en: string;
}

// ============================================================================
// REQUEST/RESPONSE TYPES — API
// ============================================================================

// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

// Carrito
export interface ItemCarritoLocal {
  producto_id: number;
  nombre: string;
  precio: number;
  imagen_url?: string;
  cantidad: number;
  personalizacion: number[];
  extras?: { ingrediente_id: number; nombre: string; precio: number }[];
}

export interface ItemPedidoRequest {
  producto_id: number;
  cantidad: number;
  personalizacion?: number[];
}

export interface CrearPedidoRequest {
  items: ItemPedidoRequest[];
  direccion_id?: number;
  forma_pago_codigo: string;
  notas?: string;
}

export interface ValidarCarritoRequest {
  items: { producto_id: number; cantidad: number }[];
}

export interface ValidarCarritoResponse {
  valido: boolean;
  errores: string[];
}

// Admin
export interface MetricasKPI {
  total_pedidos: number;
  ingresos_hoy: number;
  pedidos_pendientes: number;
  sin_stock: number;
}

export interface MetricaPorEstado {
  estado: string;
  cantidad: number;
}

export interface MetricaIngresoDia {
  fecha: string;
  ingresos: number;
}

export interface TopProductoItem {
  producto_id: number;
  nombre: string;
  total_vendido: number;
}

// Paginación
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
