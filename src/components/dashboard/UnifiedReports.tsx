'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Target,
  CheckSquare,
  BarChart3,
  Timer,
  Award,
  Zap,
  Download,
  Filter
} from 'lucide-react';
import { useLocalStorage } from '@/lib/hooks/useLocalStorage';
import { 
  Objective, 
  GTDItem, 
  PomodoroSession,
  ParetoAnalysis 
} from '@/lib/types';

type ReportPeriod = 'week' | 'month' | 'quarter';

export function UnifiedReports() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('week');
  
  // Carregar dados
  const { data: objectives = [] } = useLocalStorage('objectives', [] as Objective[]);
  const { data: gtdItems = [] } = useLocalStorage('gtd-items', [] as GTDItem[]);
  const { data: pomodoroSessions = [] } = useLocalStorage('pomodoro-sessions', [] as PomodoroSession[]);
  const { data: paretoAnalyses = [] } = useLocalStorage('pareto-analyses', [] as ParetoAnalysis[]);

  // Calcular período
  const periodData = useMemo(() => {
    const now = new Date();
    const periods = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    };
    
    const startDate = periods[selectedPeriod];
    
    // Filtrar dados por período
    const periodGTDItems = gtdItems.filter(item => 
      item.createdAt && new Date(item.createdAt) >= startDate
    );
    
    const periodPomodoros = pomodoroSessions.filter(session => 
      session.startTime && new Date(session.startTime) >= startDate
    );

    // Métricas OKRs
    const activeObjectives = objectives.filter(obj => obj.status === 'active');
    const avgOKRProgress = activeObjectives.length > 0 
      ? activeObjectives.reduce((acc, obj) => {
          const keyResultsProgress = obj.keyResults.length > 0
            ? obj.keyResults.reduce((sum, kr) => sum + (kr.currentValue / kr.targetValue * 100), 0) / obj.keyResults.length
            : 0;
          return acc + keyResultsProgress;
        }, 0) / activeObjectives.length
      : 0;

    // Métricas GTD
    const completedGTD = periodGTDItems.filter(item => item.status === 'completed');
    const gtdCompletionRate = periodGTDItems.length > 0 
      ? (completedGTD.length / periodGTDItems.length) * 100 
      : 0;

    // Métricas Pomodoro
    const completedPomodoros = periodPomodoros.filter(session => session.status === 'completed');
    const totalFocusTime = completedPomodoros.reduce((acc, session) => acc + session.duration, 0);
    const avgPomodorosPerDay = completedPomodoros.length / (selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 90);

    // Métricas Pareto
    const latestPareto = paretoAnalyses
      .filter(analysis => new Date(analysis.endDate) >= startDate)
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];

    const paretoEfficiency = latestPareto 
      ? (latestPareto.highImpactTasks.length / latestPareto.tasks.length) * 100
      : 0;

    return {
      period: selectedPeriod,
      startDate,
      
      // OKRs
      activeObjectives: activeObjectives.length,
      avgOKRProgress,
      
      // GTD
      totalGTDItems: periodGTDItems.length,
      completedGTDItems: completedGTD.length,
      gtdCompletionRate,
      
      // Pomodoro
      totalPomodoros: completedPomodoros.length,
      totalFocusTime,
      avgPomodorosPerDay,
      
      // Pareto
      paretoEfficiency
    };
  }, [selectedPeriod, objectives, gtdItems, pomodoroSessions, paretoAnalyses]);

  // Formatar tempo
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Relatórios e Análises
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Período:</span>
            <div className="flex gap-1">
              {(['week', 'month', 'quarter'] as ReportPeriod[]).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                >
                  {period === 'week' ? 'Última Semana' : 
                   period === 'month' ? 'Último Mês' : 
                   'Último Trimestre'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Resumo Executivo - {selectedPeriod === 'week' ? 'Última Semana' : 
                                selectedPeriod === 'month' ? 'Último Mês' : 
                                'Último Trimestre'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{periodData.activeObjectives}</div>
              <div className="text-sm text-muted-foreground">OKRs Ativos</div>
              <Progress value={periodData.avgOKRProgress} className="h-1 mt-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(periodData.avgOKRProgress)}% progresso
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{periodData.completedGTDItems}</div>
              <div className="text-sm text-muted-foreground">Tarefas Concluídas</div>
              <Progress value={periodData.gtdCompletionRate} className="h-1 mt-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {Math.round(periodData.gtdCompletionRate)}% conclusão
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{periodData.totalPomodoros}</div>
              <div className="text-sm text-muted-foreground">Pomodoros</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatTime(periodData.totalFocusTime)} foco
              </div>
              <div className="text-xs text-muted-foreground">
                {Math.round(periodData.avgPomodorosPerDay * 10) / 10}/dia
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{Math.round(periodData.paretoEfficiency)}%</div>
              <div className="text-sm text-muted-foreground">Eficiência Pareto</div>
              <Progress value={periodData.paretoEfficiency} className="h-1 mt-2" />
              <div className="text-xs text-muted-foreground mt-1">
                Otimização 80/20
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Recomendações para Próxima Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {periodData.avgOKRProgress < 50 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Acelere o progresso dos OKRs</h4>
                  <p className="text-sm text-blue-700">
                    Seu progresso está em {Math.round(periodData.avgOKRProgress)}%. 
                    Revise seus Key Results e defina ações específicas.
                  </p>
                </div>
              </div>
            )}
            
            {periodData.avgPomodorosPerDay < 3 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <Timer className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-red-900">Aumente o foco com Pomodoro</h4>
                  <p className="text-sm text-red-700">
                    Você está fazendo {Math.round(periodData.avgPomodorosPerDay * 10) / 10} pomodoros por dia. 
                    Tente chegar a pelo menos 4 sessões diárias.
                  </p>
                </div>
              </div>
            )}
            
            {periodData.gtdCompletionRate < 60 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckSquare className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Melhore a organização GTD</h4>
                  <p className="text-sm text-green-700">
                    Taxa de conclusão em {Math.round(periodData.gtdCompletionRate)}%. 
                    Revise seu processo de captura e priorização.
                  </p>
                </div>
              </div>
            )}
            
            {periodData.avgOKRProgress >= 50 && 
             periodData.avgPomodorosPerDay >= 3 && 
             periodData.gtdCompletionRate >= 60 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Award className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">Excelente performance!</h4>
                  <p className="text-sm text-green-700">
                    Você está mantendo um bom ritmo em todas as metodologias. 
                    Continue assim e considere aumentar seus objetivos.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
