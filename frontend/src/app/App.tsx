import { Routes, Route } from "react-router-dom";

// Las rutas se agregan aquí a medida que se implementan los changes de frontend.
// Cada change de UI agrega sus páginas y las registra acá.

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900">Food Store</h1>
              <p className="mt-2 text-gray-500">
                Infraestructura lista. Implementá los siguientes changes para agregar funcionalidad.
              </p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}
