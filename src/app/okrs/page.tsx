'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, TrendingUp, MoreHorizontal, BarChart3, FileText } from 'lucide-react';
import { ObjectivesList } from '@/components/okrs/ObjectivesList';
import { OKRsDashboard } from '@/components/okrs/OKRsDashboard';
import { OKRsReports } from '@/components/okrs/OKRsReports';
import { useFirestoreOKRs } from '@/lib/hooks/useFirestoreOKRs';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { Objective, KeyResult } from '@/lib/types';

// Função auxiliar para garantir que um valor seja um número válido
const safeNumber = (value: unknown, fallback: number = 0): number => {
  const num = Number(value);
  return isNaN(num) || !isFinite(num) ? fallback : num;
};

// Função auxiliar para calcular progresso de Key Result
const calculateKeyResultProgress = (kr: KeyResult): number => {
  const currentValue = safeNumber(kr.currentValue, 0);
  const targetValue = safeNumber(kr.targetValue, 1); // Evita divisão por zero
  
  if (targetValue <= 0) return 0;
  
  const progress = (currentValue / targetValue) * 100;
  return Math.min(Math.max(progress, 0), 100); // Garante que está entre 0 e 100
};

export default function OKRsPage() {
  const { user } = useAuth();
  const { objectives, isLoading } = useFirestoreOKRs(user);
  const [currentView, setCurrentView] = useState<'list' | 'dashboard' | 'reports'>('list');

  // Validate and sanitize data
  const validObjectives = useMemo(() => {
    if (!Array.isArray(objectives)) return [];
    
    return objectives.filter((obj): obj is Objective => {
      return obj && 
             typeof obj === 'object' && 
             typeof obj.title === 'string' &&
             obj.title.trim() !== '' &&
             Array.isArray(obj.keyResults);
    }).map(obj => ({
      ...obj,
      keyResults: Array.isArray(obj.keyResults) ? obj.keyResults.filter((kr): kr is KeyResult => {
        return kr && 
               typeof kr === 'object' &&
               typeof kr.title === 'string' &&
               kr.title.trim() !== '' &&
               typeof kr.currentValue !== 'undefined' &&
               typeof kr.targetValue !== 'undefined';
      }) : []
    }));
  }, [objectives]);

  // Calculate stats
  const activeObjectives = validObjectives.filter((obj) => obj.status === 'active').length;
  const totalKeyResults = validObjectives.reduce((sum: number, obj) => sum + (obj.keyResults?.length || 0), 0);
  
  // Calculate average progress safely
  let averageProgress = 0;
  if (validObjectives.length > 0) {
    const totalProgress = validObjectives.reduce((sum: number, obj: Objective) => {
      if (!obj.keyResults || obj.keyResults.length === 0) return sum;
      
      const objProgress = obj.keyResults.reduce((krSum: number, kr: KeyResult) => {
        const progress = calculateKeyResultProgress(kr);
        return krSum + progress;
      }, 0) / obj.keyResults.length;
      
      return sum + safeNumber(objProgress, 0);
    }, 0);
    
    averageProgress = Math.round(safeNumber(totalProgress / validObjectives.length, 0));
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">OKRs - Estratégia</h1>
            <p className="text-muted-foreground">
              Defina objetivos e resultados-chave para direcionar seu foco
            </p>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={currentView === 'list' ? 'default' : 'outline'}
            onClick={() => setCurrentView('list')}
          >
            <Target className="h-4 w-4 mr-2" />
            Lista
          </Button>
          <Button
            variant={currentView === 'dashboard' ? 'default' : 'outline'}
            onClick={() => setCurrentView('dashboard')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </Button>
          <Button
            variant={currentView === 'reports' ? 'default' : 'outline'}
            onClick={() => setCurrentView('reports')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Relatórios
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Objetivos Ativos</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : activeObjectives}</div>
            <p className="text-xs text-muted-foreground">
              {activeObjectives === 0 ? 'Nenhum objetivo ativo' : `${activeObjectives} objetivo${activeObjectives !== 1 ? 's' : ''} ativo${activeObjectives !== 1 ? 's' : ''}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : `${averageProgress}%`}</div>
            <p className="text-xs text-muted-foreground">
              {validObjectives.length === 0 ? 'Crie objetivos para ver o progresso' : 'Baseado nos Key Results'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Key Results</CardTitle>
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? '...' : totalKeyResults}</div>
            <p className="text-xs text-muted-foreground">
              {totalKeyResults === 0 ? 'Nenhum resultado definido' : 'Resultados-chave definidos'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content */}
      {currentView === 'dashboard' ? (
        <OKRsDashboard />
      ) : currentView === 'reports' ? (
        <OKRsReports />
      ) : (
        <ObjectivesList />
      )}
    </div>
  );
} 