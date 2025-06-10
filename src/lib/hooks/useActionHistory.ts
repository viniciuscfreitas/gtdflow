'use client';

import { useState, useCallback } from 'react';
import { ActionHistory } from '@/lib/types';
import { useLocalStorage } from './useLocalStorage';
import { STORAGE_KEYS } from '@/lib/storage/localStorage';

export function useActionHistory() {
  const { data: history, create: createHistoryEntry, update: updateHistoryEntry } = useLocalStorage<ActionHistory>(STORAGE_KEYS.ACTION_HISTORY);
  const [isUndoing, setIsUndoing] = useState(false);

  // Registrar uma ação no histórico
  const recordAction = useCallback((
    entityType: ActionHistory['entityType'],
    entityId: string,
    action: ActionHistory['action'],
    previousState: Record<string, unknown>,
    newState: Record<string, unknown>,
    description: string
  ) => {
    const historyEntry: Omit<ActionHistory, 'id' | 'createdAt' | 'updatedAt'> = {
      entityType,
      entityId,
      action,
      previousState,
      newState,
      description,
      canUndo: true,
    };

    return createHistoryEntry(historyEntry);
  }, [createHistoryEntry]);

  // Desfazer uma ação
  const undoAction = useCallback(async (historyId: string, undoCallback: (previousState: Record<string, unknown>) => Promise<void>) => {
    const historyEntry = history.find(h => h.id === historyId);
    if (!historyEntry || !historyEntry.canUndo || historyEntry.undoneAt) {
      throw new Error('Ação não pode ser desfeita');
    }

    setIsUndoing(true);
    try {
      // Executar o callback de desfazer
      await undoCallback(historyEntry.previousState);
      
      // Marcar como desfeita
      updateHistoryEntry(historyId, {
        undoneAt: new Date(),
        canUndo: false,
      });

      return true;
    } catch (error) {
      console.error('Erro ao desfazer ação:', error);
      throw error;
    } finally {
      setIsUndoing(false);
    }
  }, [history, updateHistoryEntry]);

  // Obter histórico recente (últimas 24 horas)
  const getRecentHistory = useCallback((entityType?: ActionHistory['entityType'], entityId?: string) => {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    return history
      .filter(h => {
        const isRecent = h.createdAt >= oneDayAgo;
        const matchesType = !entityType || h.entityType === entityType;
        const matchesEntity = !entityId || h.entityId === entityId;
        return isRecent && matchesType && matchesEntity && !h.undoneAt;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [history]);

  // Obter ações que podem ser desfeitas
  const getUndoableActions = useCallback((limit = 10) => {
    return history
      .filter(h => h.canUndo && !h.undoneAt)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }, [history]);

  return {
    history,
    recordAction,
    undoAction,
    getRecentHistory,
    getUndoableActions,
    isUndoing,
  };
}

// Hook específico para registrar ações de conclusão
export function useTaskCompletionHistory() {
  const { recordAction, undoAction, getRecentHistory } = useActionHistory();

  const recordCompletion = useCallback((
    entityType: 'gtd' | 'eisenhower',
    entityId: string,
    previousState: Record<string, unknown>,
    newState: Record<string, unknown>,
    taskTitle: string
  ) => {
    return recordAction(
      entityType,
      entityId,
      'complete',
      previousState,
      newState,
      `Tarefa "${taskTitle}" marcada como concluída`
    );
  }, [recordAction]);

  const recordStatusChange = useCallback((
    entityType: 'gtd' | 'eisenhower',
    entityId: string,
    previousState: Record<string, unknown>,
    newState: Record<string, unknown>,
    taskTitle: string,
    fromStatus: string,
    toStatus: string
  ) => {
    return recordAction(
      entityType,
      entityId,
      'status-change',
      previousState,
      newState,
      `Status da tarefa "${taskTitle}" alterado de "${fromStatus}" para "${toStatus}"`
    );
  }, [recordAction]);

  const undoCompletion = useCallback(async (
    historyId: string,
    updateCallback: (previousState: Record<string, unknown>) => Promise<void>
  ) => {
    return undoAction(historyId, updateCallback);
  }, [undoAction]);

  return {
    recordCompletion,
    recordStatusChange,
    undoCompletion,
    getRecentHistory,
  };
} 