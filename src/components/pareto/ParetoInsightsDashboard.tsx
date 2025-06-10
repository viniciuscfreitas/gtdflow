'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Lightbulb,
  Clock,
  Star,
  CheckCircle2,
  BarChart3,
  Calendar,
  Zap
} from 'lucide-react';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useFirestorePomodoro } from '@/lib/hooks/useFirestorePomodoro';
import { useAuth } from '@/lib/contexts/AuthContext';
import { subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InsightMetrics {
  weeklyEfficiency: number;
  monthlyEfficiency: number;
  efficiencyTrend: 'up' | 'down' | 'stable';
  topCategory: string;
  topCategoryValue: number;
  averageTaskValue: number;
  highImpactRatio: number;
  timeDistribution: Record<string, number>;
  productivityScore: number;
  recommendations: string[];
  weeklyGoal: number;
  goalProgress: number;
}

export function ParetoInsightsDashboard() {
  const { user } = useAuth();
  const { data: gtdItems } = useFirestoreGTD(user);
  const { sessions: pomodoroSessionsData } = useFirestorePomodoro(user);
  
  const pomodoroSessions = pomodoroSessionsData.data;

  // Calcular métricas avançadas
  const insights: InsightMetrics = useMemo(() => {
    const now = new Date();
    
    // Períodos de análise
    const thisWeek = {
      start: startOfWeek(now, { locale: ptBR }),
      end: endOfWeek(now, { locale: ptBR })
    };
    
    const lastWeek = {
      start: startOfWeek(subDays(now, 7), { locale: ptBR }),
      end: endOfWeek(subDays(now, 7), { locale: ptBR })
    };
    
    const thisMonth = {
      start: subDays(now, 30),
      end: now
    };

    // Função para calcular métricas de um período
    const calculatePeriodMetrics = (period: { start: Date; end: Date }) => {
      const completedTasks = gtdItems.filter(item => 
        item.status === 'completed' && 
        item.completedAt &&
        isWithinInterval(new Date(item.completedAt), period)
      );

      const taskAnalysis = completedTasks.map(task => {
        const relatedPomodoros = pomodoroSessions.filter(session => 
          session.taskId === task.id && session.status === 'completed'
        );
        
        const timeSpent = relatedPomodoros.length > 0
          ? relatedPomodoros.reduce((total, session) => total + session.duration, 0)
          : task.estimatedTime || 25;

        let impact = 5;
        if (task.context?.includes('@trabalho') || task.context?.includes('@office')) impact += 2;
        if (task.energy === 'high') impact += 1;
        if (task.projectId) impact += 1;
        if (task.area?.toLowerCase().includes('work') || task.area?.toLowerCase().includes('carreira')) impact += 1;
        impact = Math.min(impact, 10);

        return {
          timeSpent,
          impact,
          value: impact * (timeSpent / 60),
          category: task.area || task.context || 'Geral',
          isHighImpact: impact >= 7
        };
      });

      const totalTime = taskAnalysis.reduce((sum, task) => sum + task.timeSpent, 0);
      const highImpactTime = taskAnalysis.filter(task => task.isHighImpact).reduce((sum, task) => sum + task.timeSpent, 0);
      const efficiency = totalTime > 0 ? (highImpactTime / totalTime) * 100 : 0;

      return { taskAnalysis, efficiency, totalTime };
    };

    const thisWeekMetrics = calculatePeriodMetrics(thisWeek);
    const lastWeekMetrics = calculatePeriodMetrics(lastWeek);
    const thisMonthMetrics = calculatePeriodMetrics(thisMonth);

    // Tendência de eficiência
    let efficiencyTrend: 'up' | 'down' | 'stable' = 'stable';
    const efficiencyDiff = thisWeekMetrics.efficiency - lastWeekMetrics.efficiency;
    if (efficiencyDiff > 5) efficiencyTrend = 'up';
    else if (efficiencyDiff < -5) efficiencyTrend = 'down';

    // Análise por categoria
    const categoryAnalysis = thisMonthMetrics.taskAnalysis.reduce((acc, task) => {
      if (!acc[task.category]) {
        acc[task.category] = { value: 0, time: 0, count: 0 };
      }
      acc[task.category].value += task.value;
      acc[task.category].time += task.timeSpent;
      acc[task.category].count += 1;
      return acc;
    }, {} as Record<string, { value: number; time: number; count: number }>);

    const topCategory = Object.entries(categoryAnalysis)
      .sort(([,a], [,b]) => b.value - a.value)[0];

    // Distribuição de tempo
    const timeDistribution = Object.entries(categoryAnalysis)
      .reduce((acc, [category, stats]) => {
        acc[category] = Math.round((stats.time / thisMonthMetrics.totalTime) * 100) || 0;
        return acc;
      }, {} as Record<string, number>);

    // Métricas gerais
    const averageTaskValue = thisMonthMetrics.taskAnalysis.length > 0
      ? thisMonthMetrics.taskAnalysis.reduce((sum, task) => sum + task.value, 0) / thisMonthMetrics.taskAnalysis.length
      : 0;

    const highImpactRatio = thisMonthMetrics.taskAnalysis.length > 0
      ? (thisMonthMetrics.taskAnalysis.filter(task => task.isHighImpact).length / thisMonthMetrics.taskAnalysis.length) * 100
      : 0;

    // Score de produtividade (0-100)
    const productivityScore = Math.round(
      (thisWeekMetrics.efficiency * 0.4) + 
      (highImpactRatio * 0.3) + 
      (Math.min(averageTaskValue * 10, 30) * 0.3)
    );

    // Meta semanal e progresso
    const weeklyGoal = 70; // Meta de 70% de eficiência
    const goalProgress = Math.min((thisWeekMetrics.efficiency / weeklyGoal) * 100, 100);

    // Recomendações inteligentes
    const recommendations: string[] = [];
    
    if (thisWeekMetrics.efficiency < 30) {
      recommendations.push('🔴 Foque mais em tarefas de alto impacto. Apenas ' + Math.round(thisWeekMetrics.efficiency) + '% do seu tempo está sendo bem utilizado.');
    }
    
    if (efficiencyTrend === 'down') {
      recommendations.push('📉 Sua eficiência caiu esta semana. Revise suas prioridades e elimine distrações.');
    }
    
    if (highImpactRatio > 40) {
      recommendations.push('⚠️ Muitas tarefas classificadas como alto impacto. Seja mais seletivo nas suas prioridades.');
    }
    
    if (thisWeekMetrics.taskAnalysis.length < 5) {
      recommendations.push('📊 Complete mais tarefas para obter insights mais precisos sobre sua produtividade.');
    }
    
    if (topCategory && topCategory[1].value > averageTaskValue * 3) {
      recommendations.push('🎯 Continue focando em "' + topCategory[0] + '" - é sua área mais produtiva!');
    }
    
    if (thisWeekMetrics.efficiency > 60) {
      recommendations.push('🟢 Excelente eficiência! Mantenha o foco nas atividades de alto impacto.');
    }

    if (recommendations.length === 0) {
      recommendations.push('💡 Continue registrando suas atividades para receber insights personalizados.');
    }

    return {
      weeklyEfficiency: thisWeekMetrics.efficiency,
      monthlyEfficiency: thisMonthMetrics.efficiency,
      efficiencyTrend,
      topCategory: topCategory ? topCategory[0] : 'Nenhuma',
      topCategoryValue: topCategory ? topCategory[1].value : 0,
      averageTaskValue,
      highImpactRatio,
      timeDistribution,
      productivityScore,
      recommendations,
      weeklyGoal,
      goalProgress
    };
  }, [gtdItems, pomodoroSessions]);



  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Dashboard de Insights</h2>
        <p className="text-muted-foreground">
          Análise avançada da sua produtividade e padrões de trabalho
        </p>
      </div>

      {/* Score de Produtividade */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Score de Produtividade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold text-blue-600">
              {insights.productivityScore}
            </div>
            <div className="flex-1">
              <Progress value={insights.productivityScore} className="h-3" />
              <p className="text-sm text-muted-foreground mt-1">
                Baseado em eficiência, impacto e valor das tarefas
              </p>
            </div>
            <div className="text-right">
              {insights.productivityScore >= 80 && (
                <Badge variant="default" className="bg-green-500">Excelente</Badge>
              )}
              {insights.productivityScore >= 60 && insights.productivityScore < 80 && (
                <Badge variant="default" className="bg-blue-500">Bom</Badge>
              )}
              {insights.productivityScore >= 40 && insights.productivityScore < 60 && (
                <Badge variant="default" className="bg-yellow-500">Regular</Badge>
              )}
              {insights.productivityScore < 40 && (
                <Badge variant="destructive">Precisa Melhorar</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência Semanal</CardTitle>
            {insights.efficiencyTrend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
            {insights.efficiencyTrend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
            {insights.efficiencyTrend === 'stable' && <BarChart3 className="h-4 w-4 text-blue-500" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(insights.weeklyEfficiency)}%</div>
            <p className="text-xs text-muted-foreground">
              {insights.efficiencyTrend === 'up' && '↗️ Melhorando'}
              {insights.efficiencyTrend === 'down' && '↘️ Diminuindo'}
              {insights.efficiencyTrend === 'stable' && '→ Estável'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Semanal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(insights.goalProgress)}%</div>
            <Progress value={insights.goalProgress} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Meta: {insights.weeklyGoal}% eficiência
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alto Impacto</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(insights.highImpactRatio)}%</div>
            <p className="text-xs text-muted-foreground">
              Das tarefas concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categoria Top</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{insights.topCategory}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round(insights.topCategoryValue)} pontos de valor
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição de Tempo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Distribuição de Tempo por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(insights.timeDistribution).length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Sem dados de distribuição</h3>
              <p className="text-muted-foreground">
                Complete tarefas em diferentes categorias para ver a distribuição
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(insights.timeDistribution)
                .sort(([,a], [,b]) => b - a)
                .map(([category, percentage]) => (
                  <div key={category} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium truncate">
                      {category}
                    </div>
                    <div className="flex-1">
                      <Progress value={percentage} className="h-2" />
                    </div>
                    <div className="w-12 text-sm text-muted-foreground text-right">
                      {percentage}%
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insights e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Insights e Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.recommendations.map((recommendation, index) => (
              <div 
                key={index}
                className="p-4 border rounded-lg bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-200"
              >
                <p className="text-sm text-blue-900">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Comparativo Mensal vs Semanal */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Comparativo de Eficiência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Esta Semana</span>
                <div className="flex items-center gap-2">
                  <Progress value={insights.weeklyEfficiency} className="w-20 h-2" />
                  <span className="text-sm font-bold">{Math.round(insights.weeklyEfficiency)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Últimos 30 Dias</span>
                <div className="flex items-center gap-2">
                  <Progress value={insights.monthlyEfficiency} className="w-20 h-2" />
                  <span className="text-sm font-bold">{Math.round(insights.monthlyEfficiency)}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Próximos Passos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Revise suas prioridades</p>
                  <p className="text-xs text-muted-foreground">
                    Identifique tarefas de baixo impacto para eliminar
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                                     <p className="text-sm font-medium">Foque na categoria top</p>
                   <p className="text-xs text-muted-foreground">
                     Dedique mais tempo à &ldquo;{insights.topCategory}&rdquo;
                   </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                <div>
                  <p className="text-sm font-medium">Monitore semanalmente</p>
                  <p className="text-xs text-muted-foreground">
                    Acompanhe seu progresso em direção à meta
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 