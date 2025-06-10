import { useCallback } from 'react';
import { useGTDItems, useEisenhowerTasks, usePomodoroSessions, useParetoAnalyses } from './useLocalStorage';
import { GTDItem, EisenhowerTask } from '@/lib/types';
import { toast } from 'sonner';

export function useCrossMethodologySync() {
  const { update: updateGTDItem, remove: removeGTDItem } = useGTDItems();
  const { data: eisenhowerTasks, update: updateEisenhowerTask, remove: removeEisenhowerTask } = useEisenhowerTasks();
  const { data: pomodoroSessions, update: updatePomodoroSession } = usePomodoroSessions();
  const { update: updateParetoAnalysis } = useParetoAnalyses();

  /**
   * Sincroniza a exclusão de uma tarefa em todas as metodologias
   */
  const syncTaskDeletion = useCallback(async (
    taskId: string,
    taskType: 'gtd' | 'eisenhower'
  ) => {
    try {
      if (taskType === 'eisenhower') {
        // 1. Encontrar tarefa Eisenhower para obter GTD ID
        const eisenhowerTask = await findEisenhowerTask(taskId);
        
        // 2. Remover da Matriz de Eisenhower
        removeEisenhowerTask(taskId);

        // 3. Remover tarefa GTD correspondente se existir
        if (eisenhowerTask?.gtdItemId) {
          removeGTDItem(eisenhowerTask.gtdItemId);
        }

        toast.success('✅ Tarefa excluída de ambos os sistemas', {
          description: 'Removida do GTD e da Matriz de Eisenhower'
        });
      } else if (taskType === 'gtd') {
        // 1. Remover tarefa GTD
        removeGTDItem(taskId);

        // 2. Encontrar e remover tarefa Eisenhower correspondente
        const eisenhowerTask = await findEisenhowerTaskByGTDId(taskId);
        if (eisenhowerTask) {
          removeEisenhowerTask(eisenhowerTask.id);
        }

        toast.success('✅ Tarefa excluída de ambos os sistemas', {
          description: 'Removida do GTD e da Matriz de Eisenhower'
        });
      }

      // 3. Finalizar sessões Pomodoro relacionadas
      await finalizePomodoroSessions(taskId);

    } catch (error) {
      console.error('Erro na sincronização de exclusão:', error);
      toast.error('❌ Erro ao excluir tarefa', {
        description: 'A tarefa pode não ter sido removida de todos os sistemas',
      });
    }
  }, [removeGTDItem, removeEisenhowerTask, eisenhowerTasks]);

  /**
   * Sincroniza a conclusão de uma tarefa em todas as metodologias
   */
  const syncTaskCompletion = useCallback(async (
    taskId: string,
    taskType: 'gtd' | 'eisenhower',
    isCompleted: boolean
  ) => {
    const completedAt = isCompleted ? new Date().toISOString() : undefined;
    
    try {
      if (taskType === 'eisenhower') {
        // 1. Atualizar tarefa na Matriz de Eisenhower
        updateEisenhowerTask(taskId, {
          status: isCompleted ? 'completed' : 'pending',
          completedAt,
          updatedAt: new Date(),
        });

        // 2. Encontrar e atualizar tarefa GTD correspondente
        const eisenhowerTask = await findEisenhowerTask(taskId);
        if (eisenhowerTask?.gtdItemId) {
          updateGTDItem(eisenhowerTask.gtdItemId, {
            status: isCompleted ? 'completed' : 'active',
            completedAt,
            updatedAt: new Date(),
          });
        }
      } else if (taskType === 'gtd') {
        // 1. Atualizar tarefa GTD
        updateGTDItem(taskId, {
          status: isCompleted ? 'completed' : 'active',
          completedAt,
          updatedAt: new Date(),
        });

        // 2. Encontrar e atualizar tarefa Eisenhower correspondente
        const eisenhowerTask = await findEisenhowerTaskByGTDId(taskId);
        if (eisenhowerTask) {
          updateEisenhowerTask(eisenhowerTask.id, {
            status: isCompleted ? 'completed' : 'pending',
            completedAt,
            updatedAt: new Date(),
          });
        }
      }

      // 3. Finalizar sessões Pomodoro ativas relacionadas
      if (isCompleted) {
        await finalizePomodoroSessions(taskId);
      }

      // 4. Atualizar análises Pareto se necessário
      await updateParetoAnalysisForTask(taskId, isCompleted);

      // Sincronização silenciosa - feedback visual será dado pelo modal

    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('❌ Erro ao sincronizar metodologias', {
        description: 'Algumas atualizações podem não ter sido aplicadas',
      });
    }
  }, [updateGTDItem, updateEisenhowerTask, updatePomodoroSession, updateParetoAnalysis]);

  /**
   * Encontra tarefa Eisenhower por ID
   */
  const findEisenhowerTask = useCallback(async (taskId: string): Promise<EisenhowerTask | null> => {
    return eisenhowerTasks.find(task => task.id === taskId) || null;
  }, [eisenhowerTasks]);

  /**
   * Encontra tarefa Eisenhower por GTD ID
   */
  const findEisenhowerTaskByGTDId = useCallback(async (gtdItemId: string): Promise<EisenhowerTask | null> => {
    return eisenhowerTasks.find(task => task.gtdItemId === gtdItemId) || null;
  }, [eisenhowerTasks]);

  /**
   * Finaliza sessões Pomodoro ativas para uma tarefa
   */
  const finalizePomodoroSessions = useCallback(async (taskId: string) => {
    const activeSessions = pomodoroSessions.filter(
      session => session.taskId === taskId && session.status === 'active'
    );

    for (const session of activeSessions) {
      updatePomodoroSession(session.id, {
        status: 'completed',
        endTime: new Date(),
        updatedAt: new Date(),
      });
    }

    // Sessões finalizadas silenciosamente - informação será mostrada no modal se necessário
  }, [pomodoroSessions, updatePomodoroSession]);

  /**
   * Atualiza análises Pareto quando uma tarefa é concluída
   */
  const updateParetoAnalysisForTask = useCallback(async (taskId: string, isCompleted: boolean) => {
    // Implementar lógica para atualizar análises Pareto
    // Por exemplo, marcar tarefa como de alto impacto se foi concluída rapidamente
    console.log('Atualizando análise Pareto para tarefa:', taskId, 'concluída:', isCompleted);
  }, []);

  /**
   * Sugere próxima ação baseada na conclusão da tarefa
   */
  const suggestNextAction = useCallback((completedTask: GTDItem | EisenhowerTask) => {
    const suggestions = [];

    // Sugestões baseadas no quadrante (se for Eisenhower)
    if ('quadrant' in completedTask) {
      switch (completedTask.quadrant) {
        case 'urgent-important':
          suggestions.push('🎯 Ótimo! Foque agora em tarefas "Importantes mas Não Urgentes" para prevenir futuras crises');
          break;
        case 'not-urgent-important':
          suggestions.push('🌟 Excelente! Continue investindo em atividades estratégicas como esta');
          break;
        case 'urgent-not-important':
          suggestions.push('⚡ Considere delegar tarefas similares no futuro');
          break;
        case 'not-urgent-not-important':
          suggestions.push('🗑️ Avalie se tarefas similares realmente precisam ser feitas');
          break;
      }
    }

    // Sugestões baseadas no contexto (se for GTD)
    if ('context' in completedTask) {
      if (completedTask.context?.includes('@work')) {
        suggestions.push('💼 Que tal revisar outras tarefas de trabalho pendentes?');
      }
    }

    // Sugestão de Pomodoro
    suggestions.push('🍅 Considere fazer uma pausa ou iniciar um novo Pomodoro');

    return suggestions;
  }, []);

  return {
    syncTaskCompletion,
    syncTaskDeletion,
    suggestNextAction,
  };
} 