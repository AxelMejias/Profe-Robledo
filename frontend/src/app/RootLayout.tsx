import { Outlet } from 'react-router-dom';
import { Navigation } from '@/widgets/Navigation';
import { ToastContainer } from '@/shared/ui';

export function RootLayout() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-gray-50">
        <Outlet />
      </main>
      <ToastContainer />
    </>
  );
}
