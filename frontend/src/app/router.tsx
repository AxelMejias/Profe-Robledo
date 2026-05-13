import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Componentes stub temporales
const HomePage = () => <div>HomePage - TODO</div>;
const CatalogoPage = () => <div>CatalogoPage - TODO</div>;
const ProductoDetallePage = () => <div>ProductoDetallePage - TODO</div>;
const CarritoPage = () => <div>CarritoPage - TODO</div>;
const PedidosPage = () => <div>PedidosPage - TODO</div>;
const PedidoDetallePage = () => <div>PedidoDetallePage - TODO</div>;
const CheckoutPage = () => <div>CheckoutPage - TODO</div>;
const PagoMPPage = () => <div>PagoMPPage - TODO</div>;
const PerfilPage = () => <div>PerfilPage - TODO</div>;
const DireccionesPage = () => <div>DireccionesPage - TODO</div>;

// Admin pages
const AdminLayout = () => <div>AdminLayout - TODO</div>;
const DashboardPage = () => <div>DashboardPage - TODO</div>;
const ProductosAdminPage = () => <div>ProductosAdminPage - TODO</div>;
const CategoriasAdminPage = () => <div>CategoriasAdminPage - TODO</div>;
const UsuariosAdminPage = () => <div>UsuariosAdminPage - TODO</div>;
const StockAdminPage = () => <div>StockAdminPage - TODO</div>;
const PedidosAdminPage = () => <div>PedidosAdminPage - TODO</div>;

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/catalogo',
    element: <CatalogoPage />,
  },
  {
    path: '/producto/:id',
    element: <ProductoDetallePage />,
  },
  {
    path: '/carrito',
    element: <CarritoPage />,
  },
  {
    path: '/pedidos',
    element: <PedidosPage />,
  },
  {
    path: '/pedidos/:id',
    element: <PedidoDetallePage />,
  },
  {
    path: '/checkout',
    element: <CheckoutPage />,
  },
  {
    path: '/pago-mp/:pedidoId',
    element: <PagoMPPage />,
  },
  {
    path: '/perfil',
    element: <PerfilPage />,
  },
  {
    path: '/perfil/direcciones',
    element: <DireccionesPage />,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'productos',
        element: <ProductosAdminPage />,
      },
      {
        path: 'categorias',
        element: <CategoriasAdminPage />,
      },
      {
        path: 'usuarios',
        element: <UsuariosAdminPage />,
      },
      {
        path: 'stock',
        element: <StockAdminPage />,
      },
      {
        path: 'pedidos',
        element: <PedidosAdminPage />,
      },
    ],
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
