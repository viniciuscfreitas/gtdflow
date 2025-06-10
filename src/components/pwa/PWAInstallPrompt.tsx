'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  X,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { usePWA, useInstallPrompt } from '@/lib/hooks/usePWA';
import { toast } from 'sonner';

interface PWAInstallPromptProps {
  showInDashboard?: boolean;
  compact?: boolean;
}

export function PWAInstallPrompt({ showInDashboard = false, compact = false }: PWAInstallPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const { 
    isInstallable, 
    isInstalled, 
    isOnline, 
    isUpdateAvailable, 
    isLoading,
    installApp,
    updateApp,
    clearCache,
    checkForUpdates
  } = usePWA();
  
  const { isInstallable: promptInstallable, promptInstall } = useInstallPrompt();

  // Verificar se deve mostrar o prompt
  const shouldShow = !dismissed && !isInstalled && (isInstallable || promptInstallable);

  // Auto-dismiss após instalação
  useEffect(() => {
    if (isInstalled) {
      setDismissed(true);
    }
  }, [isInstalled]);

  // Handlers
  const handleInstall = async () => {
    try {
      const success = await promptInstall();
      if (success) {
        toast.success('GTD Flow instalado com sucesso!');
        setDismissed(true);
      } else {
        // Fallback para o método alternativo
        await installApp();
      }
    } catch (error) {
      console.error('Install failed:', error);
      toast.error('Falha na instalação. Tente novamente.');
    }
  };

  const handleUpdate = async () => {
    try {
      await updateApp();
      toast.success('App atualizado! Recarregando...');
    } catch (error) {
      console.error('Update failed:', error);
      toast.error('Falha na atualização. Tente novamente.');
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      toast.success('Cache limpo com sucesso!');
    } catch (error) {
      console.error('Clear cache failed:', error);
      toast.error('Falha ao limpar cache.');
    }
  };

  const handleCheckUpdates = async () => {
    try {
      await checkForUpdates();
      toast.info('Verificação de atualizações concluída.');
    } catch (error) {
      console.error('Check updates failed:', error);
      toast.error('Falha ao verificar atualizações.');
    }
  };

  // Versão compacta para dashboard
  if (compact) {
    return (
      <div className="space-y-2">
        {/* Status de Conectividade */}
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Badge variant="outline" className="text-green-600 border-green-200">
              <Wifi className="h-3 w-3 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge variant="outline" className="text-red-600 border-red-200">
              <WifiOff className="h-3 w-3 mr-1" />
              Offline
            </Badge>
          )}
          
          {isInstalled && (
            <Badge variant="outline" className="text-blue-600 border-blue-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Instalado
            </Badge>
          )}
        </div>

        {/* Ações rápidas */}
        <div className="flex gap-2">
          {shouldShow && (
            <Button size="sm" onClick={handleInstall} disabled={isLoading}>
              <Download className="h-3 w-3 mr-1" />
              Instalar
            </Button>
          )}
          
          {isUpdateAvailable && (
            <Button size="sm" variant="outline" onClick={handleUpdate} disabled={isLoading}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Atualizar
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Versão completa
  return (
    <div className="space-y-4">
      {/* Prompt de Instalação */}
      {shouldShow && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <strong className="text-blue-900">Instale o GTD Flow</strong>
                  <p className="text-sm text-blue-700 mt-1">
                    Acesse rapidamente suas tarefas e trabalhe offline
                  </p>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button size="sm" onClick={handleInstall} disabled={isLoading}>
                  <Download className="h-4 w-4 mr-2" />
                  Instalar
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setDismissed(true)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status PWA */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            Status do App
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Status de Instalação */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isInstalled ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm">
                {isInstalled ? 'Instalado como PWA' : 'Executando no navegador'}
              </span>
            </div>
            {isInstalled && (
              <Badge variant="outline" className="text-green-600">
                <CheckCircle className="h-3 w-3 mr-1" />
                PWA
              </Badge>
            )}
          </div>

          {/* Status de Conectividade */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">
                {isOnline ? 'Conectado à internet' : 'Modo offline'}
              </span>
            </div>
            {isOnline ? (
              <Badge variant="outline" className="text-green-600">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>

          {/* Atualização Disponível */}
          {isUpdateAvailable && (
            <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                  <div>
                    <strong className="text-orange-900">Atualização disponível</strong>
                    <p className="text-sm text-orange-700">
                      Nova versão do GTD Flow está pronta
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={handleUpdate} disabled={isLoading}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            {!isInstalled && shouldShow && (
              <Button size="sm" onClick={handleInstall} disabled={isLoading}>
                <Download className="h-4 w-4 mr-2" />
                Instalar App
              </Button>
            )}
            
            <Button size="sm" variant="outline" onClick={handleCheckUpdates} disabled={isLoading}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Verificar Atualizações
            </Button>
            
            <Button size="sm" variant="outline" onClick={handleClearCache} disabled={isLoading}>
              <X className="h-4 w-4 mr-2" />
              Limpar Cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Informações sobre PWA */}
      {showInDashboard && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="h-4 w-4" />
              Sobre o App Instalável
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Funciona offline com dados salvos localmente</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Acesso rápido através de ícone na tela inicial</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Notificações para lembretes de tarefas</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Interface otimizada para mobile e desktop</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span>Sincronização automática quando voltar online</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Componente para status na barra de navegação
export function PWAStatusIndicator() {
  const { isOnline, isInstalled, isUpdateAvailable } = usePWA();

  return (
    <div className="flex items-center gap-1">
      {/* Indicador de conectividade */}
      {isOnline ? (
        <Wifi className="h-4 w-4 text-green-600" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-600" />
      )}
      
      {/* Indicador de instalação */}
      {isInstalled && (
        <div className="w-2 h-2 rounded-full bg-blue-500" title="Instalado como PWA" />
      )}
      
      {/* Indicador de atualização */}
      {isUpdateAvailable && (
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" title="Atualização disponível" />
      )}
    </div>
  );
} 