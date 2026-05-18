import { Link } from 'react-router-dom';
import { useCategorias } from '@/entities/categoria/hooks';
import type { Categoria } from '@/shared/types';

type CatVisual = { emoji: string; bg: string; desc: string };

const CAT_VISUALS: Record<string, CatVisual> = {
  Hamburguesas: {
    emoji: '🍔',
    bg: 'from-orange-400 to-red-500',
    desc: 'Clásicas, dobles y especiales. Con los ingredientes que más te gustan.',
  },
  Refrescos: {
    emoji: '🥤',
    bg: 'from-sky-400 to-blue-600',
    desc: 'Gaseosas, aguas y más. La compañía perfecta para tu comida.',
  },
  Postres: {
    emoji: '🍰',
    bg: 'from-pink-400 to-rose-500',
    desc: 'Brownies, tartas y mucho más para cerrar con dulzura.',
  },
  Combos: {
    emoji: '🍱',
    bg: 'from-emerald-400 to-teal-600',
    desc: 'Combiná tus favoritos y pagá menos. La mejor relación precio-sabor.',
  },
};

const DEFAULT_VISUAL: CatVisual = {
  emoji: '🛒',
  bg: 'from-gray-400 to-gray-600',
  desc: 'Explorá esta categoría.',
};

const FEATURES = [
  {
    emoji: '⚡',
    title: 'Pedidos rápidos',
    desc: 'Confirmamos tu pedido en minutos y lo preparamos al instante.',
  },
  {
    emoji: '🍽',
    title: 'Calidad garantizada',
    desc: 'Ingredientes frescos seleccionados para cada preparación.',
  },
  {
    emoji: '💳',
    title: 'Pagá como quieras',
    desc: 'Efectivo, transferencia o MercadoPago. Vos elegís.',
  },
];

function CategoryCard({ cat }: { cat: Categoria }) {
  const visual = CAT_VISUALS[cat.nombre] ?? DEFAULT_VISUAL;

  return (
    <Link
      to={`/catalogo?categoria=${cat.id}`}
      className="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className={`bg-gradient-to-br ${visual.bg} p-8 h-full min-h-[220px] flex flex-col justify-between`}>
        {/* Emoji decorativo de fondo */}
        <span className="absolute -right-4 -top-4 text-8xl opacity-20 select-none group-hover:opacity-30 transition-opacity duration-300">
          {visual.emoji}
        </span>

        {/* Contenido */}
        <div>
          <span className="text-5xl mb-4 block">{visual.emoji}</span>
          <h3 className="text-2xl font-bold text-white mb-2">{cat.nombre}</h3>
          <p className="text-white/80 text-sm leading-relaxed">{visual.desc}</p>
        </div>

        <div className="mt-6 flex items-center gap-2 text-white font-semibold text-sm">
          <span>Ver productos</span>
          <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
        </div>
      </div>
    </Link>
  );
}

export function HomePage() {
  const { data: categorias } = useCategorias();

  const FEATURED_ORDER = ['Hamburguesas', 'Refrescos', 'Postres', 'Combos'];
  const mainCats = categorias
    ? FEATURED_ORDER.map((name) => categorias.find((c) => c.nombre === name)).filter((c): c is Categoria => c != null)
    : [];

  return (
    <div className="min-h-screen">
      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-100 py-24 px-6">
        {/* Decoraciones flotantes */}
        <span className="absolute top-8 left-10 text-6xl opacity-20 rotate-[-15deg] select-none">🍔</span>
        <span className="absolute top-16 right-16 text-5xl opacity-20 rotate-12 select-none">🍕</span>
        <span className="absolute bottom-10 left-1/4 text-4xl opacity-15 rotate-6 select-none">🥤</span>
        <span className="absolute bottom-8 right-1/3 text-5xl opacity-20 rotate-[-8deg] select-none">🍰</span>
        <span className="absolute top-1/2 left-6 text-3xl opacity-10 select-none">🍟</span>
        <span className="absolute top-1/3 right-8 text-3xl opacity-10 select-none">🥗</span>

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="inline-block bg-orange-100 text-orange-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
            🔥 Los mejores sabores, a un clic
          </span>
          <h1 className="text-6xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            Bienvenido a{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
              Food Store
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-xl mx-auto leading-relaxed">
            Hamburguesas, combos, bebidas y postres. Todo lo que querés pedir, en un solo lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/catalogo"
              className="inline-flex items-center justify-center px-10 py-4 text-lg font-bold text-white bg-orange-500 hover:bg-orange-600 rounded-lg shadow-lg shadow-orange-200 hover:shadow-xl hover:shadow-orange-300 transition-all duration-200"
            >
              Explorar catálogo
            </Link>
            <Link
              to="/catalogo"
              className="inline-flex items-center justify-center px-10 py-4 text-lg font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:border-orange-400 hover:text-orange-500 rounded-lg transition-all duration-200"
            >
              Ver novedades
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Categorías ──────────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">¿Qué querés pedir hoy?</h2>
          <p className="text-gray-500 text-lg">Explorá nuestras categorías y encontrá lo que más te antoja</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mainCats.length > 0
            ? mainCats.map((cat) => <CategoryCard key={cat.id} cat={cat} />)
            : [
                { id: 0, nombre: 'Hamburguesas' },
                { id: 0, nombre: 'Bebidas' },
                { id: 0, nombre: 'Combos' },
                { id: 0, nombre: 'Postres' },
              ].map((_cat, i) => (
                <div
                  key={i}
                  className="rounded-2xl bg-gray-100 animate-pulse min-h-[220px]"
                />
              ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/catalogo"
            className="text-gray-500 hover:text-orange-500 font-medium underline-offset-4 hover:underline transition-colors duration-200"
          >
            Ver todas las categorías →
          </Link>
        </div>
      </section>

      {/* ─── Por qué elegirnos ───────────────────────────────────────────── */}
      <section className="bg-gray-50 py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-14">¿Por qué elegirnos?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow duration-200 text-center"
              >
                <span className="text-5xl mb-5 block">{f.emoji}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA final ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-orange-500 to-red-500 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-6xl mb-6 block">🛒</span>
          <h2 className="text-4xl font-extrabold text-white mb-4">
            ¿Listo para hacer tu pedido?
          </h2>
          <p className="text-white/80 text-lg mb-10">
            Más de 20 productos esperándote. Pedí ahora y recibilo rápido.
          </p>
          <Link
            to="/catalogo"
            className="inline-flex items-center justify-center px-12 py-4 text-lg font-bold text-orange-500 bg-white hover:bg-orange-50 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
          >
            Ir al catálogo
          </Link>
        </div>
      </section>
    </div>
  );
}
