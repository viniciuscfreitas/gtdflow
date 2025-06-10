'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, Star } from 'lucide-react';
import { ParetoAnalysis } from '@/components/pareto/ParetoAnalysis';
import { ParetoChart } from '@/components/pareto/ParetoChart';
import { ParetoInsightsDashboard } from '@/components/pareto/ParetoInsightsDashboard';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useFirestorePomodoro } from '@/lib/hooks/useFirestorePomodoro';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useMemo } from 'react';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ParetoPage() {
  const { user } = useAuth();
  const { data: gtdItems } = useFirestoreGTD(user);
  const { sessions: pomodoroSessionsData } = useFirestorePomodoro(user);
  
  const pomodoroSessions = pomodoroSessionsData.data;
  const [activeTab, setActiveTab] = useState('analysis');

  // Preparar dados para gráficos
  const chartData = useMemo(() => {
    const now = new Date();
    const weekRange = {
      start: startOfWeek(now, { locale: ptBR }),
      end: endOfWeek(now, { locale: ptBR })
    };

    const completedTasks = gtdItems.filter(item => 
      item.status === 'completed' && 
      item.completedAt &&
      isWithinInterval(new Date(item.completedAt), weekRange)
    );

    return completedTasks.map(task => {
      // Calcular tempo gasto (baseado em pomodoros ou estimativa)
      const relatedPomodoros = pomodoroSessions.filter(session => 
        session.taskId === task.id && session.status === 'completed'
      );
      
      const timeSpent = relatedPomodoros.length > 0
        ? relatedPomodoros.reduce((total, session) => total + session.duration, 0)
        : task.estimatedTime || 25;

      // Calcular impacto baseado em heurísticas
      let impact = 5;
      
      if (task.context?.includes('@trabalho') || task.context?.includes('@office')) {
        impact += 2;
      }
      
      if (task.energy === 'high') {
        impact += 1;
      }
      
      if (task.projectId) {
        impact += 1;
      }
      
      if (task.area?.toLowerCase().includes('work') || task.area?.toLowerCase().includes('carreira')) {
        impact += 1;
      }

      impact = Math.min(impact, 10);

      return {
        id: task.id,
        title: task.title,
        timeSpent,
        impact,
        value: impact * (timeSpent / 60),
        category: task.area || task.context || 'Geral',
        completedAt: task.completedAt!,
        isHighImpact: impact >= 7
      };
    });
  }, [gtdItems, pomodoroSessions]);

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Princípio de Pareto</h1>
          <p className="text-muted-foreground">
            Análise 80/20 - Identifique as atividades de maior impacto
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Análise Detalhada
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Gráficos Visuais
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Dashboard Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-6">
          <ParetoAnalysis />
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <ParetoChart data={chartData} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <ParetoInsightsDashboard />
        </TabsContent>
      </Tabs>

      {/* Recomendações sempre visíveis */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Recomendações Baseadas em Pareto</h3>
          <div className="space-y-3">
            <div className="p-4 border rounded-lg bg-blue-50/50 border-blue-200">
              <h4 className="font-semibold text-blue-900">💡 Foque no que importa</h4>
              <p className="text-sm text-blue-700 mt-1">
                Identifique as 20% das atividades que geram 80% dos resultados
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-green-50/50 border-green-200">
              <h4 className="font-semibold text-green-900">📊 Meça o impacto</h4>
              <p className="text-sm text-green-700 mt-1">
                Avalie cada tarefa por tempo investido vs. valor gerado
              </p>
            </div>
            <div className="p-4 border rounded-lg bg-purple-50/50 border-purple-200">
              <h4 className="font-semibold text-purple-900">🔄 Revise regularmente</h4>
              <p className="text-sm text-purple-700 mt-1">
                Faça análises semanais para ajustar seu foco
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 