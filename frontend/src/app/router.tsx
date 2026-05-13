import { createBrowserRouter } from 'react-router-dom';
import { RootLayout } from './RootLayout';

// Páginas públicas
import { HomePage } from '@/pages/HomePage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { CatalogoPage } from '@/pages/CatalogoPage';
import { ProductoDetallePage } from '@/pages/ProductoDetallePage';
import { CarritoPage } from '@/pages/CarritoPage';

// Páginas protegidas (con auth)
import { ProtectedRoute } from '@/features/auth';
import { PedidosPage } from '@/pages/PedidosPage';
import { PedidoDetallePage } from '@/pages/PedidoDetallePage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { PagoMPPage } from '@/pages/PagoMPPage';
import { PagoExitosoPage } from '@/pages/PagoExitosoPage';
import { PagoRechazadoPage } from '@/pages/PagoRechazadoPage';
import { PerfilPage } from '@/pages/PerfilPage';
import { DireccionesPage } from '@/pages/DireccionesPage';

// Admin
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { DashboardPage } from '@/pages/admin/DashboardPage';
import { ProductosAdminPage } from '@/pages/admin/ProductosAdminPage';
import { CategoriasAdminPage } from '@/pages/admin/CategoriasAdminPage';
import { UsuariosAdminPage } from '@/pages/admin/UsuariosAdminPage';
import { StockAdminPage } from '@/pages/admin/StockAdminPage';
import { PedidosAdminPage } from '@/pages/admin/PedidosAdminPage';
import { IngredientesAdminPage } from '@/pages/admin/IngredientesAdminPage';

export const router = createBrowserRouter([
  {
    // Layout con Navigation + ToastContainer para páginas normales
    element: <RootLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/catalogo', element: <CatalogoPage /> },
      { path: '/producto/:id', element: <ProductoDetallePage /> },
      { path: '/carrito', element: <CarritoPage /> },
      { path: '/pedidos', element: <ProtectedRoute><PedidosPage /></ProtectedRoute> },
      { path: '/pedidos/:id', element: <ProtectedRoute><PedidoDetallePage /></ProtectedRoute> },
      { path: '/checkout', element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
      { path: '/pago-mp/:id', element: <ProtectedRoute><PagoMPPage /></ProtectedRoute> },
      { path: '/pago-exitoso/:id', element: <ProtectedRoute><PagoExitosoPage /></ProtectedRoute> },
      { path: '/pago-rechazado/:id', element: <ProtectedRoute><PagoRechazadoPage /></ProtectedRoute> },
      { path: '/perfil', element: <ProtectedRoute><PerfilPage /></ProtectedRoute> },
      { path: '/perfil/direcciones', element: <ProtectedRoute><DireccionesPage /></ProtectedRoute> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    // Admin con su propio layout (sidebar)
    path: '/admin',
    element: <ProtectedRoute><AdminLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'productos', element: <ProductosAdminPage /> },
      { path: 'categorias', element: <CategoriasAdminPage /> },
      { path: 'usuarios', element: <UsuariosAdminPage /> },
      { path: 'ingredientes', element: <IngredientesAdminPage /> },
      { path: 'stock', element: <StockAdminPage /> },
      { path: 'pedidos', element: <PedidosAdminPage /> },
    ],
  },
]);
