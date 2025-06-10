/**
 * Hook para gerenciar estado de sincronização Firebase
 * 
 * Fornece status, controles e indicadores visuais para sincronização
 * Integra com o FirebaseSyncService para operações de sync
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { User } from 'firebase/auth';
import { syncService, SyncConflict } from '@/lib/firebase/syncService';

// ============================================================================
// TYPES
// ============================================================================

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline' | 'conflict';

export interface SyncState {
  status: SyncStatus;
  lastSync: Date | null;
  isOnline: boolean;
  pendingChanges: number;
  conflicts: SyncConflict[];
  error: string | null;
  progress: {
    uploaded: number;
    downloaded: number;
    total: number;
  };
}

export interface SyncControls {
  sync: () => Promise<void>;
  forceSync: () => Promise<void>;
  resolveConflict: (conflictId: string, resolution: 'local' | 'remote') => Promise<void>;
  clearError: () => void;
  retrySync: () => Promise<void>;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useSyncStatus(user: User | null) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [syncState, setSyncState] = useState<SyncState>({
    status: 'idle',
    lastSync: null,
    isOnline: navigator.onLine,
    pendingChanges: 0,
    conflicts: [],
    error: null,
    progress: {
      uploaded: 0,
      downloaded: 0,
      total: 0,
    },
  });

  const syncInProgress = useRef(false);
  const retryTimeout = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // ONLINE/OFFLINE DETECTION
  // ============================================================================

  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, isOnline: true, status: 'idle' }));
      
      // Auto-sync quando voltar online se há mudanças pendentes
      if (syncState.pendingChanges > 0) {
        setTimeout(() => sync(), 1000); // Delay para estabilizar conexão
      }
    };

    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, isOnline: false, status: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncState.pendingChanges]);

  // ============================================================================
  // SYNC SERVICE INITIALIZATION
  // ============================================================================

  useEffect(() => {
    if (user) {
      initializeSyncService(user);
    } else {
      cleanupSyncService();
    }

    return () => cleanupSyncService();
  }, [user]);

  const initializeSyncService = async (user: User) => {
    try {
      await syncService.initialize(user);
      setSyncState(prev => ({ ...prev, status: 'idle', error: null }));
      
      // Sync inicial após login
      setTimeout(() => sync(), 500);
    } catch (error) {
      console.error('Erro ao inicializar sync service:', error);
      setSyncState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro de inicialização',
      }));
    }
  };

  const cleanupSyncService = () => {
    syncService.cleanup();
    setSyncState(prev => ({ ...prev, status: 'idle', error: null }));
    
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = null;
    }
  };

  // ============================================================================
  // SYNC OPERATIONS
  // ============================================================================

  const sync = useCallback(async () => {
    if (!user || !syncState.isOnline || syncInProgress.current) {
      return;
    }

    syncInProgress.current = true;
    setSyncState(prev => ({ 
      ...prev, 
      status: 'syncing', 
      error: null,
      progress: { uploaded: 0, downloaded: 0, total: 0 }
    }));

    try {
      const result = await syncService.fullSync();
      
      if (result.success) {
        setSyncState(prev => ({
          ...prev,
          status: result.conflicts.length > 0 ? 'conflict' : 'synced',
          lastSync: result.timestamp,
          conflicts: result.conflicts,
          pendingChanges: 0,
          progress: {
            uploaded: result.uploaded,
            downloaded: result.downloaded,
            total: result.uploaded + result.downloaded,
          },
        }));

        // Auto-clear status 'synced' após 3 segundos
        if (result.conflicts.length === 0) {
          setTimeout(() => {
            setSyncState(prev => prev.status === 'synced' ? { ...prev, status: 'idle' } : prev);
          }, 3000);
        }
      } else {
        throw new Error(result.error || 'Erro desconhecido na sincronização');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      setSyncState(prev => ({
        ...prev,
        status: 'error',
        error: error instanceof Error ? error.message : 'Erro de sincronização',
      }));

      // Auto-retry após 30 segundos em caso de erro
      scheduleRetry();
    } finally {
      syncInProgress.current = false;
    }
  }, [user, syncState.isOnline]);

  const forceSync = useCallback(async () => {
    // Force sync mesmo se já estiver sincronizando
    syncInProgress.current = false;
    await sync();
  }, [sync]);

  const retrySync = useCallback(async () => {
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
      retryTimeout.current = null;
    }
    await sync();
  }, [sync]);

  const scheduleRetry = () => {
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
    }
    
    retryTimeout.current = setTimeout(() => {
      if (syncState.isOnline && syncState.status === 'error') {
        sync();
      }
    }, 30000); // Retry após 30 segundos
  };

  // ============================================================================
  // CONFLICT RESOLUTION
  // ============================================================================

  const resolveConflict = useCallback(async (conflictId: string, resolution: 'local' | 'remote') => {
    try {
      // TODO: Implementar resolução de conflito baseada na escolha do usuário
      console.log(`Resolvendo conflito ${conflictId} com resolução: ${resolution}`);
      
      // Por enquanto, apenas remover da lista
      setSyncState(prev => ({
        ...prev,
        conflicts: prev.conflicts.filter(c => c.id !== conflictId),
        status: prev.conflicts.length <= 1 ? 'synced' : 'conflict',
      }));

      // Re-sync após resolver conflito
      setTimeout(() => sync(), 1000);
    } catch (error) {
      console.error('Erro ao resolver conflito:', error);
      setSyncState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Erro ao resolver conflito',
      }));
    }
  }, [sync]);

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  const clearError = useCallback(() => {
    setSyncState(prev => ({ ...prev, error: null, status: 'idle' }));
  }, []);

  // ============================================================================
  // PENDING CHANGES MONITORING
  // ============================================================================

  useEffect(() => {
    // Monitor localStorage changes para detectar mudanças pendentes
    const handleStorageChange = () => {
      // Simular contagem de mudanças pendentes
      // Em implementação real, seria baseado em timestamps
      const pendingCount = Math.floor(Math.random() * 5); // Placeholder
      
      setSyncState(prev => ({
        ...prev,
        pendingChanges: pendingCount,
      }));

      // Auto-sync se há mudanças e está online
      if (pendingCount > 0 && syncState.isOnline && !syncInProgress.current) {
        // Debounce auto-sync por 2 segundos
        setTimeout(() => {
          if (!syncInProgress.current) {
            sync();
          }
        }, 2000);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Check inicial
    handleStorageChange();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [sync, syncState.isOnline]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  const controls: SyncControls = {
    sync,
    forceSync,
    resolveConflict,
    clearError,
    retrySync,
  };

  return {
    ...syncState,
    controls,
    
    // Computed properties
    isSyncing: syncState.status === 'syncing',
    hasError: syncState.status === 'error',
    hasConflicts: syncState.conflicts.length > 0,
    needsSync: syncState.pendingChanges > 0,
    canSync: !!user && syncState.isOnline && !syncInProgress.current,
    
    // Status helpers
    getStatusMessage: () => getStatusMessage(syncState),
    getStatusColor: () => getStatusColor(syncState.status),
    getStatusIcon: () => getStatusIcon(syncState.status),
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getStatusMessage(state: SyncState): string {
  switch (state.status) {
    case 'idle':
      return state.pendingChanges > 0 
        ? `${state.pendingChanges} mudança${state.pendingChanges > 1 ? 's' : ''} pendente${state.pendingChanges > 1 ? 's' : ''}`
        : 'Sincronizado';
    
    case 'syncing':
      return 'Sincronizando...';
    
    case 'synced':
      const total = state.progress.uploaded + state.progress.downloaded;
      return total > 0 
        ? `Sincronizado (${total} item${total > 1 ? 's' : ''})`
        : 'Sincronizado';
    
    case 'error':
      return state.error || 'Erro na sincronização';
    
    case 'offline':
      return 'Offline - mudanças serão sincronizadas quando voltar online';
    
    case 'conflict':
      return `${state.conflicts.length} conflito${state.conflicts.length > 1 ? 's' : ''} precisa${state.conflicts.length > 1 ? 'm' : ''} ser resolvido${state.conflicts.length > 1 ? 's' : ''}`;
    
    default:
      return 'Status desconhecido';
  }
}

function getStatusColor(status: SyncStatus): string {
  switch (status) {
    case 'idle':
    case 'synced':
      return 'text-green-600';
    
    case 'syncing':
      return 'text-blue-600';
    
    case 'error':
      return 'text-red-600';
    
    case 'offline':
      return 'text-gray-600';
    
    case 'conflict':
      return 'text-yellow-600';
    
    default:
      return 'text-gray-600';
  }
}

function getStatusIcon(status: SyncStatus): string {
  switch (status) {
    case 'idle':
      return '⚪';
    
    case 'syncing':
      return '🔄';
    
    case 'synced':
      return '✅';
    
    case 'error':
      return '❌';
    
    case 'offline':
      return '📴';
    
    case 'conflict':
      return '⚠️';
    
    default:
      return '❓';
  }
} 