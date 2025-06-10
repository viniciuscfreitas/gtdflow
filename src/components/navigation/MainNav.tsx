'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  CheckSquare, 
  Grid3X3, 
  Home,
  Menu,
  X,
  CheckCircle2
  // Hidden for MVP: Target, BarChart3, Timer
} from 'lucide-react';
import { useState } from 'react';

// MVP Navigation - Only GTD + Eisenhower focus
const navigation = [
  {
    name: 'Dashboard',
    href: '/',
    icon: Home,
    description: 'Visão geral'
  },
  {
    name: 'GTD',
    href: '/gtd',
    icon: CheckSquare,
    description: 'Organização'
  },
  {
    name: 'Matriz',
    href: '/matrix',
    icon: Grid3X3,
    description: 'Priorização'
  },
  {
    name: 'Concluídas',
    href: '/completed',
    icon: CheckCircle2,
    description: 'Histórico'
  },
];

// Hidden for MVP - will be restored later
// {
//   name: 'OKRs',
//   href: '/okrs',
//   icon: Target,
//   description: 'Estratégia'
// },
// {
//   name: 'Pareto',
//   href: '/pareto',
//   icon: BarChart3,
//   description: 'Reflexão'
// },
// {
//   name: 'Pomodoro',
//   href: '/pomodoro',
//   icon: Timer,
//   description: 'Execução'
// },

export function MainNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center space-x-1">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden lg:block">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>

        {mobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-background border-b shadow-lg z-50">
            <div className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <div>
                      <div>{item.name}</div>
                      <div className="text-xs opacity-70">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-40">
      <div className="grid grid-cols-4 gap-1 p-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-2 rounded-md text-xs transition-colors',
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] leading-none">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
} 