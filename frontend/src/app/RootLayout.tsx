import { Outlet } from 'react-router-dom';
import { Navigation } from '@/widgets/Navigation';
import { ToastContainer } from '@/shared/ui';

export function RootLayout() {
  return (
    <div className="flex flex-col h-screen">
      <Navigation />
      <main className="flex-1 overflow-y-auto bg-[#F8F1EB]/70">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}
