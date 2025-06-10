/**
 * Indicador de Status de Sincronização
 * 
 * Componente visual que mostra o status da sincronização Firebase
 * Integra com useSyncStatus hook e fornece controles para o usuário
 */

'use client';

import { useState } from 'react';
import { User } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useSyncStatus } from '@/lib/hooks/useSyncStatus';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';

interface SyncStatusIndicatorProps {
  user: User | null;
  className?: string;
}

export function SyncStatusIndicator({ user, className = '' }: SyncStatusIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const syncStatus = useSyncStatus(user);

  // Se não há usuário, não mostrar indicador
  if (!user) return null;

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const getMainIcon = () => {
    if (!syncStatus.isOnline) {
      return <WifiOff className="h-4 w-4 text-gray-500" />;
    }

    switch (syncStatus.status) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'synced':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'conflict':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'offline':
        return <CloudOff className="h-4 w-4 text-gray-500" />;
      default:
        return <Cloud className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = () => {
    if (syncStatus.needsSync && syncStatus.isOnline) {
      return (
        <Badge variant="secondary" className="ml-1 px-1 py-0 text-xs">
          {syncStatus.pendingChanges}
        </Badge>
      );
    }
    return null;
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  // ============================================================================
  // RENDER MAIN COMPONENT
  // ============================================================================

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`relative h-8 w-8 p-0 ${className}`}
          title={syncStatus.getStatusMessage()}
        >
          {getMainIcon()}
          {getStatusBadge()}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getMainIcon()}
              <span className="font-medium text-sm">Sincronização</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Status Principal */}
          <div className="mb-4">
            <div className={`text-sm font-medium ${syncStatus.getStatusColor()}`}>
              {syncStatus.getStatusMessage()}
            </div>
            
            {syncStatus.lastSync && (
              <div className="text-xs text-gray-500 mt-1">
                Última sincronização: {formatLastSync(syncStatus.lastSync)}
              </div>
            )}
          </div>

          {/* Progresso de Sincronização */}
          {syncStatus.isSyncing && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Sincronizando...</span>
                <span>{syncStatus.progress.total} itens</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ 
                    width: syncStatus.progress.total > 0 
                      ? `${((syncStatus.progress.uploaded + syncStatus.progress.downloaded) / syncStatus.progress.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>↑ {syncStatus.progress.uploaded}</span>
                <span>↓ {syncStatus.progress.downloaded}</span>
              </div>
            </div>
          )}

          {/* Conflitos */}
          {syncStatus.hasConflicts && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  {syncStatus.conflicts.length} Conflito{syncStatus.conflicts.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="space-y-2">
                {syncStatus.conflicts.slice(0, 3).map((conflict) => (
                  <div key={conflict.id} className="text-xs">
                    <div className="font-medium text-yellow-800">
                      {conflict.collection}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => syncStatus.controls.resolveConflict(conflict.id, 'local')}
                      >
                        Manter Local
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-2 text-xs"
                        onClick={() => syncStatus.controls.resolveConflict(conflict.id, 'remote')}
                      >
                        Usar Remoto
                      </Button>
                    </div>
                  </div>
                ))}
                
                {syncStatus.conflicts.length > 3 && (
                  <div className="text-xs text-yellow-600">
                    +{syncStatus.conflicts.length - 3} conflitos adicionais
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Erro */}
          {syncStatus.hasError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Erro de Sincronização</span>
              </div>
              <div className="text-xs text-red-700 mb-2">
                {syncStatus.error}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={syncStatus.controls.retrySync}
                >
                  Tentar Novamente
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 px-2 text-xs"
                  onClick={syncStatus.controls.clearError}
                >
                  Ignorar
                </Button>
              </div>
            </div>
          )}

          <Separator className="my-3" />

          {/* Controles */}
          <div className="space-y-2">
            {/* Status da Conexão */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {syncStatus.isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-500" />
                )}
                <span className="text-gray-600">
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {syncStatus.needsSync && (
                <Badge variant="secondary" className="text-xs">
                  {syncStatus.pendingChanges} pendente{syncStatus.pendingChanges > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 h-8"
                onClick={syncStatus.controls.sync}
                disabled={!syncStatus.canSync}
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${syncStatus.isSyncing ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
              
              {syncStatus.hasError && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2"
                  onClick={syncStatus.controls.forceSync}
                  title="Forçar sincronização"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Informações Adicionais */}
            <div className="text-xs text-gray-500 space-y-1">
              {syncStatus.lastSync && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Última sync: {formatLastSync(syncStatus.lastSync)}</span>
                </div>
              )}
              
              {!syncStatus.isOnline && (
                <div className="text-yellow-600">
                  Mudanças serão sincronizadas quando voltar online
                </div>
              )}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
} 