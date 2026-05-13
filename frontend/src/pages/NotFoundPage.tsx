import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <div className="text-6xl mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Página no encontrada
        </h1>
        <p className="text-gray-600 mb-6">
          La página que buscás no existe o fue movida.
        </p>
        <Link
          to="/"
          className="inline-block bg-primary-500 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
