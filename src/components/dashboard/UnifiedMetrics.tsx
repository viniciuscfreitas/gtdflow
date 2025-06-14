'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  CheckSquare, 
  Grid3X3, 
  BarChart3, 
  Timer, 
  TrendingUp,
  AlertTriangle,
  Clock,
  Zap,
  Award
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useFirestoreMatrix } from '@/lib/hooks/useFirestoreMatrix';
import { useFirestoreOKRs } from '@/lib/hooks/useFirestoreOKRs';
import { useFirestorePomodoro } from '@/lib/hooks/useFirestorePomodoro';
import { useFirestorePareto } from '@/lib/hooks/useFirestorePareto';

export function UnifiedMetrics() {
  const { user } = useAuth();
  
  // Carregar dados de todas as metodologias via Firestore
  const { data: gtdItems = [] } = useFirestoreGTD(user);
  const { data: eisenhowerTasks = [] } = useFirestoreMatrix(user);
  const { objectives } = useFirestoreOKRs(user);
  const { sessions: pomodoroSessions = [] } = useFirestorePomodoro(user);
  const { data: paretoAnalyses = [] } = useFirestorePareto(user);
  
  // Extrair dados dos objetivos
  const objectivesData = objectives?.data || [];

  // Calcular métricas unificadas
  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // OKRs Metrics
    const activeObjectives = objectivesData.filter(obj => obj.status === 'active');
    const avgOKRProgress = activeObjectives.length > 0 
      ? activeObjectives.reduce((acc, obj) => {
          const keyResultsProgress = obj.keyResults.length > 0
            ? obj.keyResults.reduce((sum, kr) => sum + (kr.currentValue / kr.targetValue * 100), 0) / obj.keyResults.length
            : 0;
          return acc + keyResultsProgress;
        }, 0) / activeObjectives.length
      : 0;

    // GTD Metrics
    const inboxItems = gtdItems.filter(item => item.type === 'inbox' && item.status === 'active');
    const nextActions = gtdItems.filter(item => item.type === 'next-action' && item.status === 'active');
    const completedToday = gtdItems.filter(item => 
      item.status === 'completed' && 
      item.completedAt && 
      new Date(item.completedAt) >= today
    );

    // Eisenhower Metrics
    const urgentImportant = eisenhowerTasks.filter(task => 
      task.quadrant === 'urgent-important' && task.status !== 'completed'
    );
    const importantNotUrgent = eisenhowerTasks.filter(task => 
      task.quadrant === 'not-urgent-important' && task.status !== 'completed'
    );

    // Pomodoro Metrics
    const pomodoroSessionsData = Array.isArray(pomodoroSessions) ? pomodoroSessions : pomodoroSessions?.data || [];
    const todayPomodoros = pomodoroSessionsData.filter(session => 
      session.startTime && 
      new Date(session.startTime) >= today && 
      session.status === 'completed'
    );
    const todayFocusTime = todayPomodoros.reduce((acc, session) => acc + session.duration, 0);

    // Pareto Metrics
    const latestPareto = paretoAnalyses
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())[0];
    
    const paretoEfficiency = latestPareto 
      ? (latestPareto.highImpactTasks.length / latestPareto.tasks.length) * 100
      : 0;

    // Calcular score geral de produtividade
    const productivityScore = Math.round(
      (avgOKRProgress * 0.25) + 
      (Math.min(completedToday.length * 10, 100) * 0.2) + 
      (Math.min(todayPomodoros.length * 12.5, 100) * 0.25) + 
      (paretoEfficiency * 0.15) + 
      (Math.max(0, 100 - inboxItems.length * 5) * 0.15)
    );

    return {
      // OKRs
      activeObjectives: activeObjectives.length,
      avgOKRProgress,
      
      // GTD
      inboxCount: inboxItems.length,
      nextActionsCount: nextActions.length,
      completedTodayCount: completedToday.length,
      
      // Eisenhower
      urgentImportantCount: urgentImportant.length,
      importantNotUrgentCount: importantNotUrgent.length,
      
      // Pomodoro
      todayPomodorosCount: todayPomodoros.length,
      todayFocusTime,
      
      // Pareto
      paretoEfficiency,
      
      // Overall
      productivityScore
    };
  }, [objectivesData, gtdItems, eisenhowerTasks, pomodoroSessions, paretoAnalyses]);

  // Formatar tempo
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Determinar cor do score de produtividade
  const getProductivityColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  // Determinar emoji do score
  const getProductivityEmoji = (score: number) => {
    if (score >= 80) return '🔥';
    if (score >= 60) return '⚡';
    if (score >= 40) return '📈';
    return '🎯';
  };

  return (
    <div className="space-y-6">
      {/* Score Geral de Produtividade */}
      <Card className={`border-2 ${getProductivityColor(metrics.productivityScore)}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Score de Produtividade
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {getProductivityEmoji(metrics.productivityScore)} {metrics.productivityScore}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={metrics.productivityScore} className="h-3 mb-2" />
          <p className="text-sm text-muted-foreground">
            Baseado em OKRs, GTD, Pomodoro, Pareto e organização geral
          </p>
        </CardContent>
      </Card>

      {/* Métricas por Metodologia */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* OKRs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">OKRs Ativos</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeObjectives}</div>
            <div className="flex items-center gap-1 mt-1">
              <Progress value={metrics.avgOKRProgress} className="h-1 flex-1" />
              <span className="text-xs text-muted-foreground">
                {Math.round(metrics.avgOKRProgress)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">progresso médio</p>
          </CardContent>
        </Card>

        {/* GTD */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inbox GTD</CardTitle>
            <CheckSquare className={`h-4 w-4 ${metrics.inboxCount > 10 ? 'text-red-500' : 'text-green-600'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.inboxCount}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-green-600">+{metrics.completedTodayCount} hoje</span>
              {metrics.inboxCount > 10 && (
                <AlertTriangle className="h-3 w-3 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">itens para processar</p>
          </CardContent>
        </Card>

        {/* Eisenhower */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Urgentes</CardTitle>
            <Grid3X3 className={`h-4 w-4 ${metrics.urgentImportantCount > 0 ? 'text-red-500' : 'text-orange-600'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.urgentImportantCount}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {metrics.importantNotUrgentCount} importantes
            </div>
            <p className="text-xs text-muted-foreground">na matriz</p>
          </CardContent>
        </Card>

        {/* Pareto */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência 80/20</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(metrics.paretoEfficiency)}%</div>
            <div className="flex items-center gap-1 mt-1">
              <Progress value={metrics.paretoEfficiency} className="h-1 flex-1" />
              <TrendingUp className="h-3 w-3 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground">tempo otimizado</p>
          </CardContent>
        </Card>

        {/* Pomodoro */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pomodoros Hoje</CardTitle>
            <Timer className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.todayPomodorosCount}</div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                {formatTime(metrics.todayFocusTime)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">sessões completas</p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas e Recomendações */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Alertas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Atenção Necessária
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.inboxCount > 10 && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <CheckSquare className="h-3 w-3" />
                Inbox GTD com muitos itens ({metrics.inboxCount})
              </div>
            )}
            
            {metrics.urgentImportantCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <Grid3X3 className="h-3 w-3" />
                {metrics.urgentImportantCount} tarefas urgentes e importantes
              </div>
            )}
            
            {metrics.todayPomodorosCount === 0 && (
              <div className="flex items-center gap-2 text-sm text-orange-600">
                <Timer className="h-3 w-3" />
                Nenhum pomodoro completado hoje
              </div>
            )}
            
            {metrics.activeObjectives === 0 && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Target className="h-3 w-3" />
                Nenhum OKR ativo definido
              </div>
            )}
            
            {metrics.inboxCount <= 5 && metrics.urgentImportantCount === 0 && metrics.todayPomodorosCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Zap className="h-3 w-3" />
                Tudo sob controle! Continue assim.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximas Ações Sugeridas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Próximas Ações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.activeObjectives === 0 && (
              <div className="text-sm">
                📋 <strong>Defina seus OKRs</strong> para ter direção estratégica
              </div>
            )}
            
            {metrics.inboxCount > 0 && (
              <div className="text-sm">
                📥 <strong>Processe {metrics.inboxCount} itens</strong> do inbox GTD
              </div>
            )}
            
            {metrics.urgentImportantCount > 0 && (
              <div className="text-sm">
                🚨 <strong>Foque nas {metrics.urgentImportantCount} tarefas</strong> urgentes e importantes
              </div>
            )}
            
            {metrics.todayPomodorosCount < 4 && (
              <div className="text-sm">
                🍅 <strong>Complete mais pomodoros</strong> para aumentar o foco
              </div>
            )}
            
            {metrics.paretoEfficiency < 50 && (
              <div className="text-sm">
                📊 <strong>Analise suas atividades</strong> com o Princípio de Pareto
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 