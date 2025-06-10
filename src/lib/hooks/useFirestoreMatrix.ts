/**
 * Hook Firestore para Matriz de Eisenhower
 * 
 * Substitui useReactiveLocalStorage para dados da Matriz
 * Mantém API idêntica mas usa Firestore com real-time listeners
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  serverTimestamp,
  query,
  orderBy,
  where,
  increment
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { FIRESTORE_COLLECTIONS } from '@/lib/firebase/schema';
import { EisenhowerTask, EisenhowerQuadrant } from '@/lib/types';

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useFirestoreMatrix(user: User | null) {
  const [data, setData] = useState<EisenhowerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // REAL-TIME LISTENER
  // ============================================================================

  useEffect(() => {
    if (!user) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Configurar listener em tempo real
    const matrixCollectionRef = collection(
      db, 
      FIRESTORE_COLLECTIONS.USERS, 
      user.uid, 
      FIRESTORE_COLLECTIONS.EISENHOWER_TASKS
    );

    const q = query(
      matrixCollectionRef,
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const tasks: EisenhowerTask[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Pular itens deletados
            if (data.isDeleted) return;
            
            // Converter timestamps Firestore para Date
            const task: EisenhowerTask = {
              ...data,
              id: doc.id,
              userId: user.uid,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              dueDate: data.dueDate?.toDate() || undefined,
            } as EisenhowerTask;
            
            tasks.push(task);
          });

          setData(tasks);
          setError(null);
        } catch (err) {
          console.error('Erro ao processar dados da Matriz:', err);
          setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Erro no listener da Matriz:', err);
        setError(err.message || 'Erro de conexão');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const create = useCallback(async (task: Omit<EisenhowerTask, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(collection(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.EISENHOWER_TASKS));
      
      const newTask: Partial<EisenhowerTask> = {
        ...task,
        id: docRef.id,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(docRef, {
        ...newTask,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
        syncVersion: 1,
      });

      // Retornar task com ID para compatibilidade
      return { ...newTask, id: docRef.id } as EisenhowerTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar tarefa';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const update = useCallback(async (id: string, updates: Partial<Omit<EisenhowerTask, 'id' | 'createdAt' | 'userId'>>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.EISENHOWER_TASKS, id);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      // Retornar task atualizada para compatibilidade
      const existingTask = data.find(task => task.id === id);
      if (existingTask) {
        return { ...existingTask, ...updates, updatedAt: new Date() } as EisenhowerTask;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar tarefa';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, data]);

  const remove = useCallback(async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      // Optimistic update - remove imediatamente da UI
      setData(prevData => prevData.filter(task => task.id !== id));

      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.EISENHOWER_TASKS, id);
      
      // Soft delete para sincronização
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncVersion: increment(1), // Incrementar versão para evitar conflitos
      });

      return true;
    } catch (err) {
      // Reverter optimistic update em caso de erro
      setError('Erro ao deletar tarefa. Recarregando...');
      
      // Recarregar dados para reverter o optimistic update
      setTimeout(() => {
        setError(null);
      }, 2000);
      
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar tarefa';
      throw new Error(errorMessage);
    }
  }, [user]);

  const getById = useCallback((id: string): EisenhowerTask | undefined => {
    return data.find(task => task.id === id);
  }, [data]);

  const refresh = useCallback(async () => {
    // Com real-time listeners, não é necessário refresh manual
    // Mas mantemos para compatibilidade de API
    setError(null);
  }, []);

  // ============================================================================
  // QUADRANT HELPERS
  // ============================================================================

  const getByQuadrant = useCallback((quadrant: EisenhowerQuadrant) => {
    return data.filter(task => task.quadrant === quadrant && task.status !== 'completed');
  }, [data]);

  const getUrgentImportant = useCallback(() => {
    return getByQuadrant('urgent-important');
  }, [getByQuadrant]);

  const getNotUrgentImportant = useCallback(() => {
    return getByQuadrant('not-urgent-important');
  }, [getByQuadrant]);

  const getUrgentNotImportant = useCallback(() => {
    return getByQuadrant('urgent-not-important');
  }, [getByQuadrant]);

  const getNotUrgentNotImportant = useCallback(() => {
    return getByQuadrant('not-urgent-not-important');
  }, [getByQuadrant]);

  const getByStatus = useCallback((status: EisenhowerTask['status']) => {
    return data.filter(task => task.status === status);
  }, [data]);

  const getCompleted = useCallback(() => {
    return getByStatus('completed');
  }, [getByStatus]);

  const getPending = useCallback(() => {
    return getByStatus('pending');
  }, [getByStatus]);

  const getInProgress = useCallback(() => {
    return getByStatus('in-progress');
  }, [getByStatus]);

  // ============================================================================
  // STATISTICS
  // ============================================================================

  const getStats = useCallback(() => {
    const total = data.length;
    const completed = getCompleted().length;
    const urgentImportant = getUrgentImportant().length;
    const notUrgentImportant = getNotUrgentImportant().length;
    const urgentNotImportant = getUrgentNotImportant().length;
    const notUrgentNotImportant = getNotUrgentNotImportant().length;

    return {
      total,
      completed,
      active: total - completed,
      quadrants: {
        urgentImportant,
        notUrgentImportant,
        urgentNotImportant,
        notUrgentNotImportant,
      },
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      distribution: {
        q1: total > 0 ? Math.round((urgentImportant / total) * 100) : 0,
        q2: total > 0 ? Math.round((notUrgentImportant / total) * 100) : 0,
        q3: total > 0 ? Math.round((urgentNotImportant / total) * 100) : 0,
        q4: total > 0 ? Math.round((notUrgentNotImportant / total) * 100) : 0,
      },
    };
  }, [data, getCompleted, getUrgentImportant, getNotUrgentImportant, getUrgentNotImportant, getNotUrgentNotImportant]);

  // ============================================================================
  // PRIORITY HELPERS
  // ============================================================================

  const getByPriority = useCallback((minUrgency: number, minImportance: number) => {
    return data.filter(task => 
      task.urgency >= minUrgency && 
      task.importance >= minImportance &&
      task.status !== 'completed'
    );
  }, [data]);

  const getHighPriority = useCallback(() => {
    return getByPriority(4, 4); // Urgência >= 4 e Importância >= 4
  }, [getByPriority]);

  const getMediumPriority = useCallback(() => {
    return getByPriority(3, 3); // Urgência >= 3 e Importância >= 3
  }, [getByPriority]);

  const getDueSoon = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return data.filter(task => 
      task.dueDate && 
      task.dueDate <= tomorrow &&
      task.status !== 'completed'
    );
  }, [data]);

  const getOverdue = useCallback(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    return data.filter(task => 
      task.dueDate && 
      task.dueDate < today &&
      task.status !== 'completed'
    );
  }, [data]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    // Data
    data,
    isLoading,
    error,

    // CRUD operations (compatível com useReactiveLocalStorage)
    create,
    update,
    remove,
    getById,
    refresh,

    // Quadrant helpers
    getByQuadrant,
    getUrgentImportant,
    getNotUrgentImportant,
    getUrgentNotImportant,
    getNotUrgentNotImportant,

    // Status helpers
    getByStatus,
    getCompleted,
    getPending,
    getInProgress,

    // Priority helpers
    getByPriority,
    getHighPriority,
    getMediumPriority,
    getDueSoon,
    getOverdue,

    // Statistics
    getStats,

    // Status helpers
    isOnline: !!user,
    hasData: data.length > 0,
    isEmpty: data.length === 0,
  };
} 