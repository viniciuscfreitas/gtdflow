'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Target,
  Zap,
  Coffee,
  Plus,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotificationContext } from '@/lib/contexts/NotificationContext';

interface CompletedTask {
  id: string;
  title: string;
  description?: string;
  type: 'gtd' | 'eisenhower';
  context?: string;
  quadrant?: string;
  estimatedTime?: number;
  completedAt: string;
}

interface TaskCompletionStats {
  todayCompleted: number;
  weekCompleted: number;
  totalCompleted: number;
  currentStreak: number;
  averagePerDay: number;
}

interface NextActionSuggestion {
  id: string;
  title: string;
  type: 'similar' | 'context' | 'project' | 'energy';
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

interface TaskCompletionFlowProps {
  isOpen: boolean;
  onClose: () => void;
  completedTask: CompletedTask | null;
  stats: TaskCompletionStats;
  suggestions: NextActionSuggestion[];
  onSelectSuggestion?: (suggestion: NextActionSuggestion) => void;
  onCreateNew?: () => void;
  onTakeBreak?: () => void;
  onUndo?: () => void;
}

export function TaskCompletionFlow({
  isOpen,
  onClose,
  completedTask,
  stats,
  suggestions,
  onSelectSuggestion,
  onCreateNew,
  onTakeBreak,
  onUndo
}: TaskCompletionFlowProps) {
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentStep, setCurrentStep] = useState<'celebration' | 'stats' | 'suggestions'>('celebration');
  const { notifySuccess } = useNotificationContext();

  useEffect(() => {
    if (isOpen && completedTask) {
      setShowCelebration(true);
      setCurrentStep('celebration');
      
      // Celebração inicial
      setTimeout(() => setCurrentStep('stats'), 2000);
      setTimeout(() => setCurrentStep('suggestions'), 4000);
      setTimeout(() => setShowCelebration(false), 1500);

      // Notificação de sucesso
      notifySuccess(
        '🎉 Tarefa Concluída!',
        `"${completedTask.title}" foi finalizada com sucesso`,
        {
          label: 'Ver Estatísticas',
          onClick: () => setCurrentStep('stats')
        }
      );
    }
  }, [isOpen, completedTask, notifySuccess]);

  if (!completedTask) return null;

  const getQuadrantInfo = (quadrant?: string) => {
    switch (quadrant) {
      case 'urgent-important':
        return { label: 'Fazer Agora', color: 'bg-red-100 text-red-800', icon: '🔥' };
      case 'important-not-urgent':
        return { label: 'Agendar', color: 'bg-blue-100 text-blue-800', icon: '🎯' };
      case 'urgent-not-important':
        return { label: 'Delegar', color: 'bg-yellow-100 text-yellow-800', icon: '⚡' };
      case 'not-urgent-not-important':
        return { label: 'Eliminar', color: 'bg-gray-100 text-gray-800', icon: '🗑️' };
      default:
        return null;
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'similar': return <Target className="h-4 w-4" />;
      case 'context': return <Zap className="h-4 w-4" />;
      case 'project': return <ArrowRight className="h-4 w-4" />;
      case 'energy': return <TrendingUp className="h-4 w-4" />;
      default: return <Plus className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTime = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const quadrantInfo = getQuadrantInfo(completedTask.quadrant);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <span>Tarefa Concluída!</span>
            {showCelebration && (
              <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Tarefa Concluída */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-1">
                    {completedTask.title}
                  </h3>
                  
                  {completedTask.description && (
                    <p className="text-sm text-green-700 mb-2">
                      {completedTask.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    {quadrantInfo && (
                      <Badge className={quadrantInfo.color}>
                        {quadrantInfo.icon} {quadrantInfo.label}
                      </Badge>
                    )}
                    
                    {completedTask.context && (
                      <Badge variant="outline">
                        📍 {completedTask.context}
                      </Badge>
                    )}

                    {completedTask.estimatedTime && (
                      <Badge variant="outline">
                        ⏱️ {formatTime(completedTask.estimatedTime)}
                      </Badge>
                    )}

                    <Badge variant="outline" className="text-xs">
                      {completedTask.type === 'gtd' ? 'GTD' : 'Matriz'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estatísticas Motivacionais */}
          {currentStep === 'stats' && (
            <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="text-center mb-4">
                  <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-900">Seu Progresso</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.todayCompleted}</div>
                    <div className="text-xs text-muted-foreground">Hoje</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{stats.weekCompleted}</div>
                    <div className="text-xs text-muted-foreground">Esta Semana</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{stats.currentStreak}</div>
                    <div className="text-xs text-muted-foreground">Sequência</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">{stats.averagePerDay.toFixed(1)}</div>
                    <div className="text-xs text-muted-foreground">Média/Dia</div>
                  </div>
                </div>

                <div className="text-center mt-4 p-2 bg-white/50 rounded">
                  <p className="text-sm font-medium text-blue-900">
                    🎯 Você está construindo momentum!
                  </p>
                  <p className="text-xs text-blue-700">
                    {stats.totalCompleted} tarefas concluídas no total
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sugestões de Próximas Ações */}
          {currentStep === 'suggestions' && suggestions.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                Próximas Ações Sugeridas
              </h4>
              
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {suggestions.slice(0, 3).map((suggestion) => (
                  <Card 
                    key={suggestion.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      getPriorityColor(suggestion.priority)
                    )}
                    onClick={() => onSelectSuggestion?.(suggestion)}
                  >
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center gap-3">
                        {getSuggestionIcon(suggestion.type)}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{suggestion.title}</p>
                          <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={onTakeBreak}
              className="flex items-center gap-2"
            >
              <Coffee className="h-4 w-4" />
              Fazer Pausa
            </Button>
            
            <Button 
              onClick={onCreateNew}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nova Tarefa
            </Button>
          </div>

          {/* Ações Secundárias */}
          <div className="flex justify-between items-center pt-2 border-t">
            {onUndo && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onUndo}
                className="text-orange-600 hover:text-orange-700"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Desfazer
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClose}
              className="ml-auto"
            >
              Continuar Trabalhando
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 