'use client';

import { useEffect, useState } from 'react';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface PWAWrapperProps {
  compact?: boolean;
  showInDashboard?: boolean;
}

export function PWAWrapper({ compact = false, showInDashboard = false }: PWAWrapperProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Não renderizar no servidor para evitar hydration mismatch
  if (!isClient) {
    return null;
  }

  return <PWAInstallPrompt compact={compact} showInDashboard={showInDashboard} />;
} 