
'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReactiveLocalStorageManager } from '@/lib/storage/reactiveLocalStorage';
import { BaseEntity } from '@/lib/types';

export function useReactiveLocalStorage<T extends BaseEntity>(
  storageKey: string,
  initialValue: T[] = []
) {
  const [data, setData] = useState<T[]>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create reactive manager instance
  const manager = new ReactiveLocalStorageManager<T>(storageKey);

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
  }, [storageKey]);

  // Subscribe to storage changes
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
  }, [storageKey]);

  // Create new item
  const create = useCallback((item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>) => {
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
  }, [manager]);

  // Update existing item
  const update = useCallback((id: string, updates: Partial<Omit<T, 'id' | 'createdAt'>>) => {
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
  }, [manager]);

  // Delete item
  const remove = useCallback((id: string) => {
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
  }, [manager]);

  // Get item by ID
  const getById = useCallback((id: string): T | undefined => {
    return data.find(item => item.id === id);
  }, [data]);

  // Refresh data from storage
  const refresh = useCallback(() => {
    try {
      const refreshedData = manager.getAll();
      setData(refreshedData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar dados');
    }
  }, [manager]);

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