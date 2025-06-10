'use client';

import { useState, useEffect, useMemo } from 'react';
import { STORAGE_KEYS } from '@/lib/storage/localStorage';
import { ReactiveLocalStorageManager } from '@/lib/storage/reactiveLocalStorage';
import { 
  BaseEntity, 
  Objective, 
  KeyResult, 
  GTDItem, 
  GTDProject, 
  EisenhowerTask, 
  ParetoAnalysis, 
  PomodoroSession, 
  PomodoroStats, 
  UserSettings, 
  CalendarEvent 
} from '@/lib/types';

export function useLocalStorage<T extends BaseEntity>(
  storageKey: string,
  initialValue: T[] = []
) {
  const [data, setData] = useState<T[]>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use reactive manager instead of regular manager - memoized to prevent recreation
  const manager = useMemo(() => new ReactiveLocalStorageManager<T>(storageKey), [storageKey]);

  // Load data on mount
  useEffect(() => {
    try {
      const loadedData = manager.getAll();
      setData(loadedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [manager]);

  // Subscribe to storage changes for reactive updates
  useEffect(() => {
    const unsubscribe = manager.subscribe(() => {
      // Reload data when this storage key changes
      try {
        const refreshedData = manager.getAll();
        setData(refreshedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar dados');
        console.error('Error refreshing data:', err);
      }
    });

    return unsubscribe;
  }, [manager]);

  // Create new item
  const create = (item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newItem = manager.create(item);
      // Data will be updated automatically via subscription
      setError(null);
      return newItem;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar item';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Update existing item
  const update = (id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>) => {
    try {
      const updatedItem = manager.update(id, updates);
      if (updatedItem) {
        // Data will be updated automatically via subscription
        setError(null);
        return updatedItem;
      }
      throw new Error('Item não encontrado');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar item';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Delete item
  const remove = (id: string) => {
    try {
      const success = manager.delete(id);
      if (success) {
        // Data will be updated automatically via subscription
        setError(null);
        return true;
      }
      throw new Error('Item não encontrado');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar item';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Get item by ID
  const getById = (id: string): T | undefined => {
    return data.find(item => item.id === id);
  };

  // Refresh data from storage
  const refresh = () => {
    try {
      const refreshedData = manager.getAll();
      setData(refreshedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar dados');
    }
  };

  return {
    data,
    isLoading,
    error,
    create,
    update,
    remove,
    getById,
    refresh,
  };
}

// Specific hooks for each entity type - now reactive and properly typed!
export const useObjectives = () => useLocalStorage<Objective>(STORAGE_KEYS.OBJECTIVES);
export const useKeyResults = () => useLocalStorage<KeyResult>(STORAGE_KEYS.KEY_RESULTS);
export const useGTDItems = () => useLocalStorage<GTDItem>(STORAGE_KEYS.GTD_ITEMS);
export const useGTDProjects = () => useLocalStorage<GTDProject>(STORAGE_KEYS.GTD_PROJECTS);
export const useEisenhowerTasks = () => useLocalStorage<EisenhowerTask>(STORAGE_KEYS.EISENHOWER_TASKS);
export const useParetoAnalyses = () => useLocalStorage<ParetoAnalysis>(STORAGE_KEYS.PARETO_ANALYSES);
export const usePomodoroSessions = () => useLocalStorage<PomodoroSession>(STORAGE_KEYS.POMODORO_SESSIONS);
export const usePomodoroStats = () => useLocalStorage<PomodoroStats>(STORAGE_KEYS.POMODORO_STATS);
export const useUserSettings = () => useLocalStorage<UserSettings>(STORAGE_KEYS.USER_SETTINGS);
export const useCalendarEvents = () => useLocalStorage<CalendarEvent>(STORAGE_KEYS.CALENDAR_EVENTS); 