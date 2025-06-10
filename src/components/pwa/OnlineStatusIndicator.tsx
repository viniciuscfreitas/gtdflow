'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff } from 'lucide-react';

export function OnlineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);

      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  if (!mounted) {
    return (
      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    );
  }

  return (
    <Badge 
      variant="outline" 
      className={`${
        isOnline 
          ? 'text-green-600 border-green-200 bg-green-50' 
          : 'text-red-600 border-red-200 bg-red-50'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3 mr-1" />
          Online
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 mr-1" />
          Offline
        </>
      )}
    </Badge>
  );
} 