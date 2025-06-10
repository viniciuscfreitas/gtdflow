'use client';

import { usePathname } from 'next/navigation';
import { MainNav, MobileBottomNav } from '@/components/navigation/MainNav';
import { NotificationButton } from '@/components/navigation/NotificationButton';
import { SyncStatusIndicator } from '@/components/navigation/SyncStatusIndicator';
import { UndoToastContainer } from '@/components/ui/UndoToastContainer';
import { UserMenu } from '@/components/auth/UserMenu';
import { useAuth } from '@/lib/contexts/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
}

// Rotas que não devem mostrar header/navegação
const authRoutes = ['/auth/login', '/auth/register'];

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.includes(pathname);
  const { user } = useAuth();

  // Se for rota de auth, renderizar apenas o conteúdo sem navegação
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-background">
        {children}
        <UndoToastContainer />
      </div>
    );
  }

  // Renderizar layout normal com navegação
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">GTD Flow</h1>
              <MainNav />
            </div>

            {/* Status and User menu */}
            <div className="flex items-center gap-3">
              <NotificationButton />
              <SyncStatusIndicator user={user} />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Undo Toast Container */}
      <UndoToastContainer />
    </div>
  );
} 