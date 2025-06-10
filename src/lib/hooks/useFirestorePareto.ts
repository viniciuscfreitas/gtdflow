/**
 * Hook Firestore para Pareto Analysis
 * 
 * Substitui useLocalStorage para dados Pareto
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
import { ParetoAnalysis } from '@/lib/types';

// ============================================================================
// PARETO ANALYSIS HOOK
// ============================================================================

export function useFirestorePareto(user: User | null) {
  const [data, setData] = useState<ParetoAnalysis[]>([]);
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
    const paretoCollectionRef = collection(
      db, 
      FIRESTORE_COLLECTIONS.USERS, 
      user.uid, 
      FIRESTORE_COLLECTIONS.PARETO_ANALYSES
    );

    const q = query(
      paretoCollectionRef,
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        try {
          const analyses: ParetoAnalysis[] = [];
          
          snapshot.forEach((doc) => {
            const data = doc.data();
            
            // Pular itens deletados
            if (data.isDeleted) return;
            
            // Converter timestamps Firestore para Date
            const analysis: ParetoAnalysis = {
              ...data,
              id: doc.id,
              userId: user.uid,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            } as unknown as ParetoAnalysis;
            
            analyses.push(analysis);
          });

          setData(analyses);
          setError(null);
        } catch (err) {
          console.error('Erro ao processar dados de Pareto Analysis:', err);
          setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Erro no listener de Pareto Analysis:', err);
        setError(err.message || 'Erro de conexão');
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  const create = useCallback(async (analysis: Omit<ParetoAnalysis, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(collection(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.PARETO_ANALYSES));
      
      const newAnalysis: Partial<ParetoAnalysis> = {
        ...analysis,
        id: docRef.id,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await setDoc(docRef, {
        ...newAnalysis,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
        syncVersion: 1,
      });

      return { ...newAnalysis, id: docRef.id } as ParetoAnalysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar análise';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const update = useCallback(async (id: string, updates: Partial<Omit<ParetoAnalysis, 'id' | 'createdAt' | 'userId'>>) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.PARETO_ANALYSES, id);
      
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
        syncVersion: increment(1),
      });

      // Retornar análise atualizada para compatibilidade
      const existingAnalysis = data.find(analysis => analysis.id === id);
      if (existingAnalysis) {
        return { ...existingAnalysis, ...updates, updatedAt: new Date() } as ParetoAnalysis;
      }
      
      return null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar análise';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user, data]);

  const remove = useCallback(async (id: string) => {
    if (!user) throw new Error('Usuário não autenticado');

    try {
      const docRef = doc(db, FIRESTORE_COLLECTIONS.USERS, user.uid, FIRESTORE_COLLECTIONS.PARETO_ANALYSES, id);
      
      // Soft delete para sincronização
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        syncVersion: increment(1),
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar análise';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [user]);

  const getById = useCallback((id: string): ParetoAnalysis | undefined => {
    return data.find(analysis => analysis.id === id);
  }, [data]);

  const refresh = useCallback(async () => {
    setError(null);
  }, []);

  // ============================================================================
  // PARETO-SPECIFIC HELPERS
  // ============================================================================

  const getByPeriodType = useCallback((period: ParetoAnalysis['period']) => {
    return data.filter(analysis => analysis.period === period);
  }, [data]);

  const getByDateRange = useCallback((startDate: Date, endDate: Date) => {
    return data.filter(analysis => 
      analysis.createdAt >= startDate && 
      analysis.createdAt <= endDate
    );
  }, [data]);

  const getRecent = useCallback((days: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return data.filter(analysis => analysis.createdAt >= cutoffDate);
  }, [data]);

  const getStats = useCallback(() => {
    const total = data.length;
    const recent = getRecent(30).length;
    const dailyAnalyses = getByPeriodType('daily').length;
    const weeklyAnalyses = getByPeriodType('weekly').length;
    const monthlyAnalyses = getByPeriodType('monthly').length;
    const quarterlyAnalyses = getByPeriodType('quarterly').length;

    return {
      total,
      recent,
      byPeriod: {
        daily: dailyAnalyses,
        weekly: weeklyAnalyses,
        monthly: monthlyAnalyses,
        quarterly: quarterlyAnalyses,
      },
    };
  }, [data, getRecent, getByPeriodType]);

  return {
    // Data
    data,
    isLoading,
    error,

    // CRUD operations (compatível com useLocalStorage)
    create,
    update,
    remove,
    getById,
    refresh,

    // Pareto-specific helpers
    getByPeriodType,
    getByDateRange,
    getRecent,
    getStats,

    // Status helpers
    isOnline: !!user,
    hasData: data.length > 0,
    isEmpty: data.length === 0,
  };
} 