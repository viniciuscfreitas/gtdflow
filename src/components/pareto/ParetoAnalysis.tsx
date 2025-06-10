'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  Target, 
  Lightbulb,
  Clock,
  Star
} from 'lucide-react';
import { useGTDItems, usePomodoroSessions } from '@/lib/hooks/useLocalStorage';
import { format, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TaskAnalysis {
  id: string;
  title: string;
  timeSpent: number; // em minutos
  impact: number; // 1-10 (calculado)
  value: number; // resultado/benefício
  category: string;
  completedAt: string;
  isHighImpact: boolean;
}

interface ParetoMetrics {
  totalTasks: number;
  totalTimeSpent: number;
  highImpactTasks: number;
  highImpactTime: number;
  efficiency: number; // % de tempo em tarefas de alto impacto
  paretoRatio: number; // % das tarefas que geram maior impacto
}

export function ParetoAnalysis() {
  const { data: gtdItems } = useGTDItems();
  const { data: pomodoroSessions } = usePomodoroSessions();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter'>('week');
  const [analysisData, setAnalysisData] = useState<TaskAnalysis[]>([]);

  // Calcular período de análise
  const analysisRange = useMemo(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'week':
        return {
          start: startOfWeek(now, { locale: ptBR }),
          end: endOfWeek(now, { locale: ptBR }),
          label: 'Esta semana'
        };
      case 'month':
        return {
          start: subDays(now, 30),
          end: now,
          label: 'Últimos 30 dias'
        };
      case 'quarter':
        return {
          start: subDays(now, 90),
          end: now,
          label: 'Últimos 90 dias'
        };
    }
  }, [selectedPeriod]);

  // Analisar tarefas concluídas
  useEffect(() => {
    const completedTasks = gtdItems.filter(item => 
      item.status === 'completed' && 
      item.completedAt &&
      isWithinInterval(new Date(item.completedAt), {
        start: analysisRange.start,
        end: analysisRange.end
      })
    );

    const taskAnalysis: TaskAnalysis[] = completedTasks.map(task => {
      // Calcular tempo gasto (baseado em pomodoros ou estimativa)
      const relatedPomodoros = pomodoroSessions.filter(session => 
        session.taskId === task.id && session.status === 'completed'
      );
      
      const timeSpent = relatedPomodoros.length > 0
        ? relatedPomodoros.reduce((total, session) => total + session.duration, 0)
        : task.estimatedTime || 25; // fallback para estimativa ou 25min padrão

      // Calcular impacto baseado em heurísticas
      let impact = 5; // base
      
      // Contexto de trabalho = maior impacto
      if (task.context?.includes('@trabalho') || task.context?.includes('@office')) {
        impact += 2;
      }
      
      // Alta energia = maior impacto
      if (task.energy === 'high') {
        impact += 1;
      }
      
      // Projetos = maior impacto que ações isoladas
      if (task.projectId) {
        impact += 1;
      }
      
      // Área profissional = maior impacto
      if (task.area?.toLowerCase().includes('work') || task.area?.toLowerCase().includes('carreira')) {
        impact += 1;
      }

      impact = Math.min(impact, 10); // máximo 10

      return {
        id: task.id,
        title: task.title,
        timeSpent,
        impact,
        value: impact * (timeSpent / 60), // valor = impacto * horas
        category: task.area || task.context || 'Geral',
        completedAt: task.completedAt!,
        isHighImpact: impact >= 7
      };
    });

    // Ordenar por valor (impacto * tempo)
    taskAnalysis.sort((a, b) => b.value - a.value);
    setAnalysisData(taskAnalysis);
  }, [gtdItems, pomodoroSessions, analysisRange]);

  // Calcular métricas Pareto
  const metrics: ParetoMetrics = useMemo(() => {
    const totalTasks = analysisData.length;
    const totalTimeSpent = analysisData.reduce((sum, task) => sum + task.timeSpent, 0);
    const highImpactTasks = analysisData.filter(task => task.isHighImpact).length;
    const highImpactTime = analysisData
      .filter(task => task.isHighImpact)
      .reduce((sum, task) => sum + task.timeSpent, 0);

    const efficiency = totalTimeSpent > 0 ? (highImpactTime / totalTimeSpent) * 100 : 0;
    const paretoRatio = totalTasks > 0 ? (highImpactTasks / totalTasks) * 100 : 0;

    return {
      totalTasks,
      totalTimeSpent,
      highImpactTasks,
      highImpactTime,
      efficiency,
      paretoRatio
    };
  }, [analysisData]);

  // Gerar insights automáticos
  const insights = useMemo(() => {
    const insights: string[] = [];

    if (metrics.efficiency < 30) {
      insights.push('🔴 Apenas ' + Math.round(metrics.efficiency) + '% do seu tempo está em atividades de alto impacto. Foque mais em tarefas estratégicas.');
    } else if (metrics.efficiency < 50) {
      insights.push('🟡 ' + Math.round(metrics.efficiency) + '% do seu tempo está em atividades de alto impacto. Há espaço para melhoria.');
    } else {
      insights.push('🟢 Excelente! ' + Math.round(metrics.efficiency) + '% do seu tempo está em atividades de alto impacto.');
    }

    if (metrics.paretoRatio > 30) {
      insights.push('⚠️ Muitas tarefas classificadas como alto impacto (' + Math.round(metrics.paretoRatio) + '%). Seja mais seletivo.');
    }

    if (metrics.totalTasks < 5) {
      insights.push('📊 Poucos dados para análise robusta. Complete mais tarefas para insights melhores.');
    }

    // Análise por categoria
    const categoryAnalysis = analysisData.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = { time: 0, value: 0, count: 0 };
      }
      acc[task.category].time += task.timeSpent;
      acc[task.category].value += task.value;
      acc[task.category].count += 1;
      return acc;
    }, {} as Record<string, { time: number; value: number; count: number }>);

    const topCategory = Object.entries(categoryAnalysis)
      .sort(([,a], [,b]) => b.value - a.value)[0];

    if (topCategory) {
      insights.push('🎯 Sua categoria mais valiosa é "' + topCategory[0] + '" com ' + Math.round(topCategory[1].value) + ' pontos de valor.');
    }

    return insights;
  }, [metrics, analysisData]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  return (
    <div className="space-y-6">
      {/* Header com seletor de período */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Análise de Pareto</h2>
          <p className="text-muted-foreground">
            Identifique as atividades de maior impacto - {analysisRange.label}
          </p>
        </div>
        
        <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'week' | 'month' | 'quarter')}>
          <TabsList>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="quarter">Trimestre</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Métricas principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência 80/20</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.efficiency)}%</div>
            <p className="text-xs text-muted-foreground">
              Tempo em tarefas de alto impacto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Analisadas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {analysisRange.label.toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alto Impacto</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.highImpactTasks}</div>
            <p className="text-xs text-muted-foreground">
              Atividades identificadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Total</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(metrics.totalTimeSpent)}</div>
            <p className="text-xs text-muted-foreground">
              Tempo investido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de tarefas analisadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análise Detalhada de Tarefas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analysisData.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sem dados para análise</h3>
              <p className="text-muted-foreground mb-4">
                Complete algumas tarefas no período selecionado para gerar insights
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {analysisData.slice(0, 10).map((task, index) => (
                <div 
                  key={task.id} 
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {task.category}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(task.timeSpent)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(task.completedAt), 'dd/MM', { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold">
                        Impacto: {task.impact}/10
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Valor: {Math.round(task.value)}
                      </div>
                    </div>
                    {task.isHighImpact && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                </div>
              ))}
              
              {analysisData.length > 10 && (
                <div className="text-center pt-4">
                  <p className="text-sm text-muted-foreground">
                    +{analysisData.length - 10} tarefas adicionais analisadas
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights automáticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights e Reflexões
          </CardTitle>
        </CardHeader>
        <CardContent>
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum insight ainda</h3>
              <p className="text-muted-foreground">
                Complete mais tarefas para gerar insights automáticos
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div 
                  key={index}
                  className="p-4 border rounded-lg bg-blue-50/50 border-blue-200"
                >
                  <p className="text-sm text-blue-900">{insight}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 