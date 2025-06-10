/**
 * Hook Firestore para Pomodoro (Sessions & Stats)
 * 
 * Substitui useLocalStorage para dados Pomodoro
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
import { PomodoroSession, PomodoroStats } from '@/lib/types';

// ============================================================================
// POMODORO SESSIONS HOOK
// ============================================================================

export function useFirestorePomodoroSessions(user: User | null) {
  const [data, setData] = useState<PomodoroSession[]>([]);
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
    const sessionsCollectionRef = collection(
      db, 
      FIRESTORE_COLLECTIONS.USERS, 
      user.uid, 
      FIRESTORE_COLLECTIONS.POMODORO_SESSIONS
    );

    const q = query(
      sessionsCollectionRef,
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const sessions: PomodoroSession[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Pular itens deletados
            if (data.isDeleted) return;
            
            // Converter timestamps Firestore para Date
            const session: PomodoroSession = {
              ...data,
              id: doc.id,
              userId: user.uid,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              startTime: data.startTime?.toDate() || new Date(),
              endTime: data.endTime?.toDate() || undefined,
            } as unknown as PomodoroSession;
            
            sessions.push(session);
          });

          setData(sessions);
          setError(null);
        } catch (err) {
          console.error('Erro ao processar dados de Pomodoro Sessions:', err);
          setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Erro no listener de Pomodoro Sessions:', err);
        setError(err.message || 'Erro de conexão');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const create = useCallback(async (session: Omit<PomodoroSession, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(collection(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.POMODORO_SESSIONS));
      
      const newSession: Partial<PomodoroSession> = {
        ...session,
        id: docRef.id,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(docRef, {
        ...newSession,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        startTime: session.startTime || serverTimestamp(),
        endTime: session.endTime || null,
        isDeleted: false,
        syncVersion: 1,
      });

      return { ...newSession, id: docRef.id } as PomodoroSession;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar sessão';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const update = useCallback(async (id: string, updates: Partial<Omit<PomodoroSession, 'id' | 'createdAt' | 'userId'>>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.POMODORO_SESSIONS, id);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        syncVersion: increment(1),
      });

      // Retornar sessão atualizada para compatibilidade
      const existingSession = data.find(session => session.id === id);
      if (existingSession) {
        return { ...existingSession, ...updates, updatedAt: new Date() } as PomodoroSession;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar sessão';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, data]);

  const remove = useCallback(async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.POMODORO_SESSIONS, id);
      
      // Soft delete para sincronização
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncVersion: increment(1),
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar sessão';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const getById = useCallback((id: string): PomodoroSession | undefined => {
    return data.find(session => session.id === id);
  }, [data]);

  const refresh = useCallback(async () => {
    setError(null);
  }, []);

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

// ============================================================================
// POMODORO STATS HOOK
// ============================================================================

export function useFirestorePomodoroStats(user: User | null) {
  const [data, setData] = useState<PomodoroStats[]>([]);
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
    const statsCollectionRef = collection(
      db, 
      FIRESTORE_COLLECTIONS.USERS, 
      user.uid, 
      FIRESTORE_COLLECTIONS.POMODORO_STATS
    );

    const q = query(
      statsCollectionRef,
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const stats: PomodoroStats[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Pular itens deletados
            if (data.isDeleted) return;
            
            // Converter timestamps Firestore para Date
            const stat: PomodoroStats = {
              ...data,
              id: doc.id,
              userId: user.uid,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as unknown as PomodoroStats;
            
            stats.push(stat);
          });

          setData(stats);
          setError(null);
        } catch (err) {
          console.error('Erro ao processar dados de Pomodoro Stats:', err);
          setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Erro no listener de Pomodoro Stats:', err);
        setError(err.message || 'Erro de conexão');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const create = useCallback(async (stats: Omit<PomodoroStats, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(collection(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.POMODORO_STATS));
      
      const newStats: Partial<PomodoroStats> = {
        ...stats,
        id: docRef.id,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(docRef, {
        ...newStats,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
        syncVersion: 1,
      });

      return { ...newStats, id: docRef.id } as PomodoroStats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar estatísticas';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const update = useCallback(async (id: string, updates: Partial<Omit<PomodoroStats, 'id' | 'createdAt' | 'userId'>>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.POMODORO_STATS, id);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        syncVersion: increment(1),
      });

      // Retornar estatísticas atualizadas para compatibilidade
      const existingStats = data.find(stat => stat.id === id);
      if (existingStats) {
        return { ...existingStats, ...updates, updatedAt: new Date() } as PomodoroStats;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar estatísticas';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, data]);

  const remove = useCallback(async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.POMODORO_STATS, id);
      
      // Soft delete para sincronização
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncVersion: increment(1),
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar estatísticas';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const getById = useCallback((id: string): PomodoroStats | undefined => {
    return data.find(stat => stat.id === id);
  }, [data]);

  const refresh = useCallback(async () => {
    setError(null);
  }, []);

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

// ============================================================================
// COMBINED POMODORO HOOK
// ============================================================================

export function useFirestorePomodoro(user: User | null) {
  const sessions = useFirestorePomodoroSessions(user);
  const stats = useFirestorePomodoroStats(user);

  return {
    sessions,
    stats,
    isLoading: sessions.isLoading || stats.isLoading,
    error: sessions.error || stats.error,
  };
} 