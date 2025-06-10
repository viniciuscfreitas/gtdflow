import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Target, 
  Clock, 
  TrendingUp,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { EisenhowerTask, GTDItem } from '@/lib/types';

interface TaskCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedTask: EisenhowerTask | GTDItem | null;
  suggestions: string[];
  stats?: {
    totalCompleted: number;
    todayCompleted: number;
    weekCompleted: number;
    currentStreak: number;
  };
}

export function TaskCompletionModal({ 
  isOpen, 
  onClose, 
  completedTask, 
  suggestions,
  stats = {
    totalCompleted: 0,
    todayCompleted: 0,
    weekCompleted: 0,
    currentStreak: 0
  }
}: TaskCompletionModalProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!completedTask) return null;

  const isEisenhowerTask = 'quadrant' in completedTask;
  const isGTDTask = 'context' in completedTask;

  const getQuadrantInfo = (quadrant: string) => {
    switch (quadrant) {
      case 'urgent-important':
        return { label: 'Fazer Agora', color: 'bg-red-100 text-red-800', icon: '🔥' };
      case 'not-urgent-important':
        return { label: 'Agendar', color: 'bg-blue-100 text-blue-800', icon: '🎯' };
      case 'urgent-not-important':
        return { label: 'Delegar', color: 'bg-yellow-100 text-yellow-800', icon: '⚡' };
      case 'not-urgent-not-important':
        return { label: 'Eliminar', color: 'bg-gray-100 text-gray-800', icon: '🗑️' };
      default:
        return { label: 'Tarefa', color: 'bg-gray-100 text-gray-800', icon: '📋' };
    }
  };

  const quadrantInfo = isEisenhowerTask ? getQuadrantInfo(completedTask.quadrant) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <span>Tarefa Concluída!</span>
            {showCelebration && (
              <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tarefa Concluída */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-medium text-green-900 mb-2">
              {completedTask.title}
            </h3>
            
            <div className="flex items-center gap-2 flex-wrap">
              {isEisenhowerTask && quadrantInfo && (
                <Badge className={quadrantInfo.color}>
                  {quadrantInfo.icon} {quadrantInfo.label}
                </Badge>
              )}
              
              {isGTDTask && completedTask.context && (
                <Badge variant="outline">
                  📍 {completedTask.context}
                </Badge>
              )}
              
              {completedTask.description && (
                <p className="text-sm text-green-700 mt-2">
                  {completedTask.description}
                </p>
              )}
            </div>
          </div>

          {/* Estatísticas de Progresso */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats.todayCompleted}
              </div>
              <div className="text-xs text-blue-700">Hoje</div>
            </div>
            
            <div className="p-3 bg-purple-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">
                {stats.currentStreak}
              </div>
              <div className="text-xs text-purple-700">Sequência</div>
            </div>
          </div>

          {/* Progresso Semanal */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progresso Semanal</span>
              <span className="font-medium">{stats.weekCompleted}/20</span>
            </div>
            <Progress value={(stats.weekCompleted / 20) * 100} className="h-2" />
          </div>

          {/* Sugestões */}
          {suggestions.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-900">Próxima Ação</span>
              </div>
              <p className="text-sm text-amber-800">
                {suggestions[0]}
              </p>
            </div>
          )}

          {/* Ações */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
              className="flex-1"
            >
              <Clock className="h-4 w-4 mr-2" />
              Fazer Pausa
            </Button>
            
            <Button 
              size="sm" 
              onClick={onClose}
              className="flex-1"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Continuar
            </Button>
          </div>

          {/* Motivação */}
          <div className="text-center p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <p className="text-sm font-medium text-gray-700">
              Você está construindo momentum! 🚀
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {stats.totalCompleted} tarefas concluídas no total
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 