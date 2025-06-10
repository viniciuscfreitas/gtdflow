'use client';

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  isLoading: boolean;
  isClient: boolean;
}

interface PWAActions {
  installApp: () => Promise<void>;
  updateApp: () => Promise<void>;
  clearCache: () => Promise<void>;
  checkForUpdates: () => Promise<void>;
}

// Hook principal com proteção contra hidratação
export function usePWA(): PWAState & PWAActions {
  const [mounted, setMounted] = useState(false);
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isOnline: true,
    isUpdateAvailable: false,
    isLoading: false,
    isClient: false
  });

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Verificar se está no cliente
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      setState(prev => ({
        ...prev,
        isClient: true,
        isOnline: navigator.onLine
      }));
    }
  }, []);

  // Verificar se está instalado como PWA
  const checkIfInstalled = useCallback(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    try {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = 'standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true;
      const isInstalled = isStandalone || isInWebAppiOS;
      
      setState(prev => ({ ...prev, isInstalled }));
    } catch (error) {
      console.warn('[PWA] Error checking install status:', error);
    }
  }, [mounted]);

  // Registrar Service Worker com proteção
  const registerServiceWorker = useCallback(async () => {
    if (!mounted || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return null;
    }
    
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      setRegistration(reg);
      
      console.log('[PWA] Service Worker registered successfully');
      
      // Verificar atualizações
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setState(prev => ({ ...prev, isUpdateAvailable: true }));
            }
          });
        }
      });
      
      return reg;
    } catch (error) {
      console.warn('[PWA] Service Worker registration failed:', error);
      return null;
    }
  }, [mounted]);

  // Instalar app
  const installApp = useCallback(async () => {
    if (!mounted || !deferredPrompt) {
      console.log('[PWA] No install prompt available');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      console.log('[PWA] Install prompt result:', outcome);
      
      if (outcome === 'accepted') {
        setState(prev => ({ 
          ...prev, 
          isInstallable: false,
          isInstalled: true 
        }));
      }
      
      setDeferredPrompt(null);
    } catch (error) {
      console.warn('[PWA] Install failed:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [mounted, deferredPrompt]);

  // Atualizar app
  const updateApp = useCallback(async () => {
    if (!mounted || !registration || !registration.waiting) {
      console.log('[PWA] No update available');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
      
      setState(prev => ({ ...prev, isUpdateAvailable: false }));
    } catch (error) {
      console.warn('[PWA] Update failed:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [mounted, registration]);

  // Limpar cache
  const clearCache = useCallback(async () => {
    if (!mounted || !registration) {
      console.log('[PWA] No service worker registration');
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const messageChannel = new MessageChannel();
      
      const promise = new Promise<void>((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data.success) {
            console.log('[PWA] Cache cleared successfully');
            resolve();
          }
        };
      });

      registration.active?.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );

      await promise;
    } catch (error) {
      console.warn('[PWA] Clear cache failed:', error);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [mounted, registration]);

  // Verificar atualizações
  const checkForUpdates = useCallback(async () => {
    if (!mounted || !registration) {
      console.log('[PWA] No service worker registration');
      return;
    }

    try {
      await registration.update();
      console.log('[PWA] Update check completed');
    } catch (error) {
      console.warn('[PWA] Update check failed:', error);
    }
  }, [mounted, registration]);

  // Efeitos apenas no cliente após montagem
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;

    // Verificar se está instalado
    checkIfInstalled();

    // Registrar service worker
    registerServiceWorker();

    // Listener para prompt de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setDeferredPrompt(event);
      setState(prev => ({ ...prev, isInstallable: true }));
      console.log('[PWA] Install prompt captured');
    };

    // Listener para mudanças de conectividade
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      console.log('[PWA] Back online');
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      console.log('[PWA] Gone offline');
    };

    // Listener para mudanças no display mode
    const handleDisplayModeChange = () => {
      checkIfInstalled();
    };

    // Adicionar listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
    };
  }, [mounted, checkIfInstalled, registerServiceWorker]);

  // Retornar estado padrão se não estiver montado
  if (!mounted) {
    return {
      isInstallable: false,
      isInstalled: false,
      isOnline: true,
      isUpdateAvailable: false,
      isLoading: false,
      isClient: false,
      installApp: async () => {},
      updateApp: async () => {},
      clearCache: async () => {},
      checkForUpdates: async () => {}
    };
  }

  return {
    ...state,
    installApp,
    updateApp,
    clearCache,
    checkForUpdates
  };
}

// Hook para notificações push
export function usePushNotifications() {
  const [mounted, setMounted] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const requestPermission = useCallback(async () => {
    if (!mounted || typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.warn('[PWA] Permission request failed:', error);
      return 'denied';
    }
  }, [mounted]);

  const subscribe = useCallback(async () => {
    if (!mounted || typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      });
      
      setSubscription(sub);
      console.log('[PWA] Push subscription created');
      return sub;
    } catch (error) {
      console.warn('[PWA] Push subscription failed:', error);
      return null;
    }
  }, [mounted]);

  const unsubscribe = useCallback(async () => {
    if (!mounted || !subscription) return;
    
    try {
      await subscription.unsubscribe();
      setSubscription(null);
      console.log('[PWA] Push subscription removed');
    } catch (error) {
      console.warn('[PWA] Push unsubscribe failed:', error);
    }
  }, [mounted, subscription]);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  if (!mounted) {
    return {
      permission: 'default' as NotificationPermission,
      subscription: null,
      requestPermission: async () => 'denied' as NotificationPermission,
      subscribe: async () => null,
      unsubscribe: async () => {}
    };
  }

  return {
    permission,
    subscription,
    requestPermission,
    subscribe,
    unsubscribe
  };
}

// Hook para detectar instalação
export function useInstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const event = e as BeforeInstallPromptEvent;
      setInstallPrompt(event);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstallable(false);
      console.log('[PWA] App was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!mounted || !installPrompt) return false;

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPrompt(null);
      }
      
      return outcome === 'accepted';
    } catch (error) {
      console.warn('[PWA] Install prompt failed:', error);
      return false;
    }
  }, [mounted, installPrompt]);

  if (!mounted) {
    return {
      isInstallable: false,
      promptInstall: async () => false
    };
  }

  return {
    isInstallable,
    promptInstall
  };
} 