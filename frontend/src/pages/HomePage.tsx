import { Link } from 'react-router-dom';
import { useCategorias } from '@/entities/categoria/hooks';
import { Button } from '@/shared/ui';

export function HomePage() {
  const { data: categorias } = useCategorias();

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-secondary text-white py-20 px-6 rounded-lg">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-6">Bienvenido a Food Store</h1>
          <p className="text-xl mb-8">
            Los mejores productos alimenticios al alcance de un clic
          </p>
          <Link to="/catalogo">
            <Button size="lg" variant="outline" className="bg-white text-primary hover:bg-gray-100">
              Ver catálogo
            </Button>
          </Link>
        </div>
      </section>

      {/* Categorías destacadas */}
      <section className="max-w-6xl mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8 text-center">Categorías destacadas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categorias?.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              to={`/catalogo?categoria=${cat.id}`}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-center"
            >
              {cat.imagen_url && (
                <img
                  src={cat.imagen_url}
                  alt={cat.nombre}
                  className="w-20 h-20 mx-auto mb-4 rounded-full object-cover"
                />
              )}
              <h3 className="font-semibold">{cat.nombre}</h3>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
