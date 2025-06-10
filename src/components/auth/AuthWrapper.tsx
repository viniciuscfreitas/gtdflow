'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { CheckSquare, Loader2 } from 'lucide-react';

interface AuthWrapperProps {
  children: React.ReactNode;
}

// Rotas que não precisam de autenticação
const publicRoutes = ['/auth/login', '/auth/register'];

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!loading) {
      if (!user && !isPublicRoute) {
        // Usuário não logado tentando acessar rota protegida
        router.push('/auth/login');
      } else if (user && isPublicRoute) {
        // Usuário logado tentando acessar página de auth
        router.push('/');
      }
    }
  }, [user, loading, isPublicRoute, router]);

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <CheckSquare className="h-8 w-8 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-900">GTD Flow</h1>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando...</span>
          </div>
        </div>
      </div>
    );
  }

  // Se não está logado e está tentando acessar rota protegida, não renderiza nada
  // (o useEffect vai redirecionar)
  if (!user && !isPublicRoute) {
    return null;
  }

  // Se está logado e está tentando acessar rota pública, não renderiza nada
  // (o useEffect vai redirecionar)
  if (user && isPublicRoute) {
    return null;
  }

  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
} 