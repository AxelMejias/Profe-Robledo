import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/shared/store/authStore";
import { useCartStore } from "@/shared/store/cartStore";
import api from "@/shared/api/axios";

// ---- tipos mínimos ----
interface Producto { id: number; nombre: string; precio_base: number; stock_cantidad: number; disponible: boolean; imagen_url: string | null; }
interface Pedido { id: number; estado_codigo: string; total: number; forma_pago_codigo: string; creado_en: string; }
interface Metricas { total_pedidos: number; ingresos_hoy: number; pedidos_pendientes: number; sin_stock: number; }
type Tab = "productos" | "carrito" | "pedidos" | "admin";

// ---- badge de estado ----
const ESTADO_COLOR: Record<string, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-800",
  CONFIRMADO: "bg-blue-100 text-blue-800",
  EN_PREP: "bg-purple-100 text-purple-800",
  EN_CAMINO: "bg-orange-100 text-orange-800",
  ENTREGADO: "bg-green-100 text-green-800",
  CANCELADO: "bg-red-100 text-red-800",
};

// ===========================================================================
// LOGIN
// ===========================================================================
function LoginSection() {
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data: tokens } = await api.post("/auth/login", { email, password });
      // Guardamos tokens primero para que el interceptor los use
      useAuthStore.getState().updateTokens(tokens.access_token, tokens.refresh_token);
      const { data: user } = await api.get("/auth/me");
      login(tokens.access_token, tokens.refresh_token, {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        roles: user.roles,
      });
    } catch {
      setError("Email o contraseña incorrectos");
      useAuthStore.getState().logout();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Food Store</h1>
        <p className="text-sm text-gray-500 mb-6">Demo — ingresá para ver el sistema</p>
        {error && <p className="bg-red-50 text-red-600 text-sm rounded px-3 py-2 mb-4">{error}</p>}
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
        <button type="submit" disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

// ===========================================================================
// TAB: PRODUCTOS
// ===========================================================================
function TabProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState<number | null>(null);

  useEffect(() => {
    api.get("/productos?size=12").then(({ data }) => {
      setProductos(data.items ?? []);
    }).finally(() => setLoading(false));
  }, []);

  const handleAdd = (p: Producto) => {
    addItem({ producto_id: p.id, nombre: p.nombre, precio: Number(p.precio_base), imagen_url: p.imagen_url, personalizacion: [] });
    setAdded(p.id);
    setTimeout(() => setAdded(null), 1500);
  };

  if (loading) return <p className="text-gray-500">Cargando productos...</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {productos.map((p) => (
        <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="h-32 bg-gray-100 flex items-center justify-center text-3xl">
            {p.imagen_url ? <img src={p.imagen_url} alt={p.nombre} className="h-full w-full object-cover" /> : "🍔"}
          </div>
          <div className="p-3 flex flex-col flex-1">
            <p className="font-medium text-sm text-gray-900 leading-tight">{p.nombre}</p>
            <p className="text-blue-600 font-bold text-sm mt-1">${Number(p.precio_base).toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-0.5">Stock: {p.stock_cantidad}</p>
            <button
              onClick={() => handleAdd(p)}
              disabled={!p.disponible || p.stock_cantidad === 0}
              className={`mt-auto mt-2 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                added === p.id ? "bg-green-500 text-white" :
                !p.disponible || p.stock_cantidad === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed" :
                "bg-blue-600 text-white hover:bg-blue-700"
              }`}>
              {added === p.id ? "✓ Agregado" : !p.disponible ? "No disponible" : "Agregar"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================================================
// TAB: CARRITO
// ===========================================================================
function TabCarrito() {
  const items = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const total = useCartStore((s) => s.total);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{ valido: boolean; errores: string[] } | null>(null);
  const [creating, setCreating] = useState(false);
  const [pedidoCreado, setPedidoCreado] = useState<number | null>(null);
  const [error, setError] = useState("");

  const handleValidar = async () => {
    setValidating(true);
    setValidation(null);
    try {
      const { data } = await api.post("/carrito/validar", {
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad })),
      });
      setValidation({ valido: data.valido, errores: data.errores });
    } catch {
      setError("Error al validar el carrito");
    } finally {
      setValidating(false);
    }
  };

  const handleCrearPedido = async () => {
    setCreating(true);
    setError("");
    try {
      const { data } = await api.post("/pedidos", {
        items: items.map((i) => ({ producto_id: i.producto_id, cantidad: i.cantidad, personalizacion: i.personalizacion })),
        forma_pago_codigo: "EFECTIVO",
        notas: "Pedido de demo",
      });
      setPedidoCreado(data.id);
      clearCart();
    } catch (e: any) {
      setError(e.response?.data?.detail ?? "Error al crear el pedido");
    } finally {
      setCreating(false);
    }
  };

  if (pedidoCreado) return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
      <p className="text-3xl mb-2">✅</p>
      <p className="text-green-800 font-semibold">Pedido #{pedidoCreado} creado con estado PENDIENTE</p>
      <button onClick={() => setPedidoCreado(null)} className="mt-4 text-sm text-green-600 underline">OK</button>
    </div>
  );

  if (items.length === 0) return (
    <div className="text-center py-12 text-gray-400">
      <p className="text-4xl mb-2">🛒</p>
      <p>El carrito está vacío. Agregá productos desde la tab Productos.</p>
    </div>
  );

  return (
    <div className="space-y-4 max-w-lg">
      {items.map((i) => (
        <div key={i.producto_id} className="flex items-center justify-between bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div>
            <p className="font-medium text-sm">{i.nombre}</p>
            <p className="text-xs text-gray-500">x{i.cantidad} — ${(i.precio * i.cantidad).toFixed(2)}</p>
          </div>
          <button onClick={() => removeItem(i.producto_id)} className="text-red-400 hover:text-red-600 text-sm">✕</button>
        </div>
      ))}

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-1">
        <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>${subtotal().toFixed(2)}</span></div>
        <div className="flex justify-between text-sm"><span className="text-gray-500">Envío</span><span>$50.00</span></div>
        <div className="flex justify-between font-bold"><span>Total</span><span>${total().toFixed(2)}</span></div>
      </div>

      {validation && (
        <div className={`rounded-xl p-3 text-sm ${validation.valido ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
          {validation.valido ? "✓ Carrito válido — stock y precios OK" : validation.errores.join(" · ")}
        </div>
      )}
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button onClick={handleValidar} disabled={validating}
          className="flex-1 border border-blue-600 text-blue-600 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 disabled:opacity-50">
          {validating ? "Validando..." : "Validar stock"}
        </button>
        <button onClick={handleCrearPedido} disabled={creating}
          className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {creating ? "Creando..." : "Crear pedido"}
        </button>
      </div>
    </div>
  );
}

// ===========================================================================
// TAB: MIS PEDIDOS
// ===========================================================================
function TabPedidos() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPedidos = useCallback(() => {
    setLoading(true);
    api.get("/pedidos").then(({ data }) => setPedidos(data.items ?? [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchPedidos(); }, [fetchPedidos]);

  if (loading) return <p className="text-gray-500">Cargando pedidos...</p>;
  if (pedidos.length === 0) return <p className="text-gray-400">No tenés pedidos todavía.</p>;

  return (
    <div className="space-y-3">
      <button onClick={fetchPedidos} className="text-xs text-blue-600 underline mb-2">↻ Actualizar</button>
      {pedidos.map((p) => (
        <div key={p.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="font-medium text-sm">Pedido #{p.id}</p>
            <p className="text-xs text-gray-500">{new Date(p.creado_en).toLocaleString("es-AR")} · {p.forma_pago_codigo}</p>
          </div>
          <div className="text-right space-y-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ESTADO_COLOR[p.estado_codigo] ?? "bg-gray-100 text-gray-700"}`}>
              {p.estado_codigo}
            </span>
            <p className="text-sm font-bold text-gray-900">${Number(p.total).toFixed(2)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===========================================================================
// TAB: ADMIN MÉTRICAS
// ===========================================================================
function TabAdmin() {
  const [metricas, setMetricas] = useState<Metricas | null>(null);
  const [porEstado, setPorEstado] = useState<{ estado: string; cantidad: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api.get("/admin/metricas"), api.get("/admin/metricas/por-estado")])
      .then(([{ data: m }, { data: pe }]) => { setMetricas(m); setPorEstado(pe); })
      .catch(() => setError("Sin acceso o backend no disponible"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Cargando métricas...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  const kpis = [
    { label: "Total pedidos", value: metricas?.total_pedidos ?? 0, icon: "📦" },
    { label: "Ingresos hoy", value: `$${Number(metricas?.ingresos_hoy ?? 0).toFixed(2)}`, icon: "💰" },
    { label: "Pendientes", value: metricas?.pedidos_pendientes ?? 0, icon: "⏳" },
    { label: "Sin stock", value: metricas?.sin_stock ?? 0, icon: "⚠️" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
            <p className="text-2xl mb-1">{k.icon}</p>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {porEstado.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-gray-700 mb-3">Pedidos por estado</p>
          <div className="space-y-2">
            {porEstado.map((pe) => (
              <div key={pe.estado} className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-28 text-center ${ESTADO_COLOR[pe.estado] ?? "bg-gray-100 text-gray-700"}`}>
                  {pe.estado}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${Math.min(100, pe.cantidad * 20)}%` }} />
                </div>
                <span className="text-sm font-bold text-gray-700 w-6 text-right">{pe.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// MAIN APP
// ===========================================================================
export function App() {
  const { isAuthenticated, user, logout, refreshToken } = useAuthStore((s) => ({
    isAuthenticated: s.isAuthenticated,
    user: s.user,
    logout: s.logout,
    refreshToken: s.refreshToken,
  }));
  const itemCount = useCartStore((s) => s.itemCount);
  const [tab, setTab] = useState<Tab>("productos");

  const handleLogout = async () => {
    try { await api.post("/auth/logout", { refresh_token: refreshToken }); } catch { /* ignorar */ }
    logout();
  };

  if (!isAuthenticated) return <LoginSection />;

  const isAdmin = user?.roles.includes("ADMIN") ?? false;
  const tabs: { id: Tab; label: string }[] = [
    { id: "productos", label: "🛍 Productos" },
    { id: "carrito", label: `🛒 Carrito${itemCount() > 0 ? ` (${itemCount()})` : ""}` },
    { id: "pedidos", label: "📋 Mis pedidos" },
    ...(isAdmin ? [{ id: "admin" as Tab, label: "⚙️ Admin" }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-lg font-bold text-gray-900">Food Store <span className="text-xs font-normal text-gray-400 ml-1">demo</span></h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:block">
            {user?.nombre} {user?.apellido}
            {isAdmin && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">ADMIN</span>}
          </span>
          <button onClick={handleLogout} className="text-sm text-red-500 hover:text-red-700 transition-colors">
            Salir
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="flex gap-0">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="p-6 max-w-5xl mx-auto">
        {tab === "productos" && <TabProductos />}
        {tab === "carrito" && <TabCarrito />}
        {tab === "pedidos" && <TabPedidos />}
        {tab === "admin" && <TabAdmin />}
      </main>
    </div>
  );
}
