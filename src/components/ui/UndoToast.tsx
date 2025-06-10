'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Undo2, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  X,
  RotateCcw
} from 'lucide-react';
import { ActionHistory } from '@/lib/types';
import { useTaskCompletionHistory } from '@/lib/hooks/useActionHistory';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UndoToastProps {
  historyEntry: ActionHistory;
  onUndo: (historyId: string) => Promise<void>;
  onDismiss: () => void;
  autoHideDelay?: number; // em segundos
}

export function UndoToast({ 
  historyEntry, 
  onUndo, 
  onDismiss, 
  autoHideDelay = 10 
}: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(autoHideDelay);
  const [isUndoing, setIsUndoing] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      onDismiss();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, onDismiss]);

  const handleUndo = async () => {
    setIsUndoing(true);
    try {
      await onUndo(historyEntry.id);
      toast.success('Ação desfeita com sucesso!');
      onDismiss();
    } catch (error) {
      toast.error('Erro ao desfazer ação');
      console.error('Erro ao desfazer:', error);
    } finally {
      setIsUndoing(false);
    }
  };

  const getActionIcon = () => {
    switch (historyEntry.action) {
      case 'complete':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'status-change':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      case 'delete':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = () => {
    switch (historyEntry.action) {
      case 'complete':
        return 'border-green-200 bg-green-50';
      case 'status-change':
        return 'border-blue-200 bg-blue-50';
      case 'delete':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className={cn("w-full max-w-md shadow-lg", getActionColor())}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Ícone da ação */}
          <div className="flex-shrink-0 mt-0.5">
            {getActionIcon()}
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 mb-1">
              {historyEntry.description}
            </p>
            
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className="text-xs">
                {historyEntry.entityType.toUpperCase()}
              </Badge>
              
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {timeLeft}s restantes
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
                disabled={isUndoing}
                className="h-7 px-3 text-xs"
              >
                <Undo2 className="h-3 w-3 mr-1" />
                {isUndoing ? 'Desfazendo...' : 'Desfazer'}
              </Button>
              
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="h-7 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                Dispensar
              </Button>
            </div>
          </div>

          {/* Botão de fechar */}
          <Button
            size="sm"
            variant="ghost"
            onClick={onDismiss}
            className="flex-shrink-0 h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        {/* Barra de progresso do tempo */}
        <div className="mt-3 w-full bg-gray-200 rounded-full h-1">
          <div 
            className="bg-blue-500 h-1 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / autoHideDelay) * 100}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Hook para gerenciar toasts de desfazer
export function useUndoToast() {
  const [activeToasts, setActiveToasts] = useState<ActionHistory[]>([]);
  const { undoCompletion } = useTaskCompletionHistory();

  const showUndoToast = (historyEntry: ActionHistory) => {
    setActiveToasts(prev => [historyEntry, ...prev.slice(0, 2)]); // Máximo 3 toasts
  };

  const hideUndoToast = (historyId: string) => {
    setActiveToasts(prev => prev.filter(toast => toast.id !== historyId));
  };

  const handleUndo = async (historyId: string, undoCallback: (previousState: Record<string, unknown>) => Promise<void>) => {
    await undoCompletion(historyId, undoCallback);
    hideUndoToast(historyId);
  };

  return {
    activeToasts,
    showUndoToast,
    hideUndoToast,
    handleUndo,
  };
} 