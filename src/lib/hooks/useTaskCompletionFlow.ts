'use client';

import { useState, useCallback, useMemo } from 'react';
import { useGTDItems, useEisenhowerTasks } from './useLocalStorage';
import { useCrossMethodologySync } from './useCrossMethodologySync';
import { useTaskCompletionHistory } from './useActionHistory';
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

export function useTaskCompletionFlow() {
  const [completionFlow, setCompletionFlow] = useState<{
    isOpen: boolean;
    completedTask: CompletedTask | null;
  }>({
    isOpen: false,
    completedTask: null
  });

  const { data: gtdItems } = useGTDItems();
  const { data: eisenhowerTasks } = useEisenhowerTasks();
  const { syncTaskCompletion } = useCrossMethodologySync();
  const { recordCompletion } = useTaskCompletionHistory();
  const { notifySuccess, notifyInfo } = useNotificationContext();

  // Calcular estatísticas de conclusão
  const stats = useMemo((): TaskCompletionStats => {
    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Combinar tarefas concluídas de ambos os sistemas
    const allCompletedTasks = [
      ...gtdItems.filter(item => item.status === 'completed' && item.completedAt),
      ...eisenhowerTasks.filter(task => task.status === 'completed' && task.completedAt)
    ];

    const todayCompleted = allCompletedTasks.filter(task => 
      task.completedAt && new Date(task.completedAt).toDateString() === today
    ).length;

    const weekCompleted = allCompletedTasks.filter(task => 
      task.completedAt && new Date(task.completedAt) >= weekAgo
    ).length;

    const totalCompleted = allCompletedTasks.length;

    // Calcular sequência atual (dias consecutivos com pelo menos 1 tarefa)
    let currentStreak = 0;
    const checkDate = new Date(now);
    
    while (currentStreak < 30) { // Máximo 30 dias para evitar loop infinito
      const dateStr = checkDate.toDateString();
      const hasTasksOnDate = allCompletedTasks.some(task => 
        task.completedAt && new Date(task.completedAt).toDateString() === dateStr
      );
      
      if (hasTasksOnDate) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Média por dia (últimos 30 dias)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last30DaysCompleted = allCompletedTasks.filter(task => 
      task.completedAt && new Date(task.completedAt) >= thirtyDaysAgo
    ).length;
    const averagePerDay = last30DaysCompleted / 30;

    return {
      todayCompleted,
      weekCompleted,
      totalCompleted,
      currentStreak,
      averagePerDay
    };
  }, [gtdItems, eisenhowerTasks]);

  // Gerar sugestões inteligentes de próximas ações
  const generateSuggestions = useCallback((completedTask: CompletedTask): NextActionSuggestion[] => {
    const suggestions: NextActionSuggestion[] = [];

    // Tarefas ativas disponíveis
    const activeGTDItems = gtdItems.filter(item => 
      item.status === 'active' && item.type === 'next-action'
    );
    const activeTasks = eisenhowerTasks.filter(task => 
      task.status === 'pending' || task.status === 'in-progress'
    );

    // 1. Sugestões por contexto similar (GTD)
    if (completedTask.context) {
      const contextTasks = activeGTDItems.filter(item => 
        item.context === completedTask.context
      );
      
      contextTasks.slice(0, 2).forEach(task => {
                 suggestions.push({
           id: task.id,
           title: task.title,
           type: 'context',
           reason: `Mesmo contexto: ${completedTask.context || 'N/A'}`,
           priority: 'high'
         });
      });
    }

    // 2. Sugestões por quadrante similar (Matriz)
    if (completedTask.quadrant) {
      const quadrantTasks = activeTasks.filter(task => {
        const taskQuadrant = getTaskQuadrant(task.urgency, task.importance);
        return taskQuadrant === completedTask.quadrant;
      });

      quadrantTasks.slice(0, 2).forEach(task => {
                 suggestions.push({
           id: task.id,
           title: task.title,
           type: 'similar',
           reason: `Mesma prioridade: ${getQuadrantLabel(completedTask.quadrant || '')}`,
           priority: completedTask.quadrant === 'urgent-important' ? 'high' : 'medium'
         });
      });
    }

    // 3. Sugestões por energia (tarefas de baixa energia se for final do dia)
    const currentHour = new Date().getHours();
    if (currentHour >= 16) { // Após 16h, sugerir tarefas de baixa energia
      const lowEnergyTasks = activeGTDItems.filter(item => 
        item.energy === 'low'
      );

      lowEnergyTasks.slice(0, 1).forEach(task => {
        suggestions.push({
          id: task.id,
          title: task.title,
          type: 'energy',
          reason: 'Tarefa de baixa energia para o final do dia',
          priority: 'low'
        });
      });
    } else {
      // Durante o dia, sugerir tarefas de alta energia
      const highEnergyTasks = activeGTDItems.filter(item => 
        item.energy === 'high'
      );

      highEnergyTasks.slice(0, 1).forEach(task => {
        suggestions.push({
          id: task.id,
          title: task.title,
          type: 'energy',
          reason: 'Aproveite sua energia alta',
          priority: 'high'
        });
      });
    }

    // 4. Tarefas urgentes da matriz
    const urgentTasks = activeTasks.filter(task => 
      task.urgency >= 8 && task.importance >= 6
    );

    urgentTasks.slice(0, 1).forEach(task => {
      suggestions.push({
        id: task.id,
        title: task.title,
        type: 'similar',
        reason: 'Tarefa urgente e importante',
        priority: 'high'
      });
    });

    // Remover duplicatas e limitar a 5 sugestões
    const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
      index === self.findIndex(s => s.id === suggestion.id)
    );

    return uniqueSuggestions.slice(0, 5);
  }, [gtdItems, eisenhowerTasks]);

  // Funções auxiliares
  const getTaskQuadrant = (urgency: number, importance: number): string => {
    if (urgency >= 7 && importance >= 7) return 'urgent-important';
    if (urgency < 7 && importance >= 7) return 'important-not-urgent';
    if (urgency >= 7 && importance < 7) return 'urgent-not-important';
    return 'not-urgent-not-important';
  };

  const getQuadrantLabel = (quadrant: string): string => {
    switch (quadrant) {
      case 'urgent-important': return 'Fazer Agora';
      case 'important-not-urgent': return 'Agendar';
      case 'urgent-not-important': return 'Delegar';
      case 'not-urgent-not-important': return 'Eliminar';
      default: return 'Indefinido';
    }
  };

  // Iniciar fluxo de conclusão
  const startCompletionFlow = useCallback(async (
    taskId: string,
    taskType: 'gtd' | 'eisenhower'
  ) => {
    try {
      // Sincronizar conclusão
      await syncTaskCompletion(taskId, taskType, true);

      // Encontrar a tarefa concluída
      let completedTask: CompletedTask | null = null;

      if (taskType === 'gtd') {
        const gtdItem = gtdItems.find(item => item.id === taskId);
        if (gtdItem) {
          completedTask = {
            id: gtdItem.id,
            title: gtdItem.title,
            description: gtdItem.description,
            type: 'gtd',
            context: gtdItem.context,
            estimatedTime: gtdItem.estimatedTime,
            completedAt: new Date().toISOString()
          };
        }
      } else {
        const eisenhowerTask = eisenhowerTasks.find(task => task.id === taskId);
        if (eisenhowerTask) {
          completedTask = {
            id: eisenhowerTask.id,
            title: eisenhowerTask.title,
            description: eisenhowerTask.description,
            type: 'eisenhower',
            quadrant: getTaskQuadrant(eisenhowerTask.urgency, eisenhowerTask.importance),
            completedAt: new Date().toISOString()
          };
        }
      }

      if (completedTask) {
        // Registrar no histórico
        recordCompletion(
          taskType,
          taskId,
          { status: 'active' },
          { status: 'completed', completedAt: completedTask.completedAt },
          completedTask.title
        );

        // Abrir fluxo de conclusão
        setCompletionFlow({
          isOpen: true,
          completedTask
        });

        notifySuccess(
          '🎉 Tarefa Concluída!',
          `"${completedTask.title}" foi finalizada com sucesso`
        );
      }
    } catch (error) {
      console.error('Erro no fluxo de conclusão:', error);
      notifyInfo('Erro', 'Não foi possível processar a conclusão da tarefa');
    }
  }, [gtdItems, eisenhowerTasks, syncTaskCompletion, recordCompletion, notifySuccess, notifyInfo]);

  // Fechar fluxo
  const closeCompletionFlow = useCallback(() => {
    setCompletionFlow({
      isOpen: false,
      completedTask: null
    });
  }, []);

  // Desfazer conclusão
  const undoTaskCompletion = useCallback(async (taskId: string, taskType: 'gtd' | 'eisenhower') => {
    try {
      await syncTaskCompletion(taskId, taskType, false);
      closeCompletionFlow();
      notifyInfo('Conclusão Desfeita', 'A tarefa foi reativada');
    } catch (error) {
      console.error('Erro ao desfazer conclusão:', error);
      notifyInfo('Erro', 'Não foi possível desfazer a conclusão');
    }
  }, [syncTaskCompletion, closeCompletionFlow, notifyInfo]);

  return {
    completionFlow,
    stats,
    startCompletionFlow,
    closeCompletionFlow,
    undoTaskCompletion,
    generateSuggestions
  };
} 