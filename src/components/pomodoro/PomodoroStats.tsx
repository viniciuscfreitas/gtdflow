'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  Target,
  Calendar,
  Award
} from 'lucide-react';
import { PomodoroSession } from '@/lib/types';

interface PomodoroStatsProps {
  sessions: PomodoroSession[];
  currentStreak?: number;
}

export function PomodoroStats({ sessions, currentStreak = 0 }: PomodoroStatsProps) {
  // Calcular estatísticas
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    thisWeek.setHours(0, 0, 0, 0);
    
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    // Filtrar sessões por período
    const todaySessions = sessions.filter(s => s.startTime && new Date(s.startTime) >= today);
    const weekSessions = sessions.filter(s => s.startTime && new Date(s.startTime) >= thisWeek);
    const monthSessions = sessions.filter(s => s.startTime && new Date(s.startTime) >= thisMonth);
    
    // Sessões de trabalho (pomodoros completos)
    const todayPomodoros = todaySessions.filter(s => s.status === 'completed');
    const weekPomodoros = weekSessions.filter(s => s.status === 'completed');
    const monthPomodoros = monthSessions.filter(s => s.status === 'completed');
    
    // Tempo total de foco
    const todayFocusTime = todayPomodoros.reduce((acc, s) => acc + s.duration, 0);
    const weekFocusTime = weekPomodoros.reduce((acc, s) => acc + s.duration, 0);
    const monthFocusTime = monthPomodoros.reduce((acc, s) => acc + s.duration, 0);
    
    // Interrupções (sessões não completadas)
    const todayInterruptions = todaySessions.filter(s => s.status === 'interrupted').length;
    const weekInterruptions = weekSessions.filter(s => s.status === 'interrupted').length;
    
    // Taxa de conclusão
    const todayCompletionRate = todaySessions.length > 0 
      ? (todayPomodoros.length / todaySessions.length) * 100 
      : 0;
    
    const weekCompletionRate = weekSessions.length > 0 
      ? (weekPomodoros.length / weekSessions.length) * 100 
      : 0;
    
    // Média diária da semana
    const daysInWeek = Math.min(7, Math.ceil((Date.now() - thisWeek.getTime()) / (1000 * 60 * 60 * 24)));
    const weeklyAverage = daysInWeek > 0 ? weekPomodoros.length / daysInWeek : 0;
    
    // Melhor dia da semana
    const dayStats = Array.from({ length: 7 }, (_, i) => {
      const dayStart = new Date(thisWeek);
      dayStart.setDate(dayStart.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      
      const dayPomodoros = sessions.filter(s => {
        if (!s.startTime) return false;
        const sessionDate = new Date(s.startTime);
        return sessionDate >= dayStart && sessionDate < dayEnd && s.status === 'completed';
      }).length;
      
      return { day: i, pomodoros: dayPomodoros };
    });
    
    const bestDay = dayStats.reduce((best, current) => 
      current.pomodoros > best.pomodoros ? current : best
    );
    
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    return {
      today: {
        pomodoros: todayPomodoros.length,
        focusTime: todayFocusTime,
        interruptions: todayInterruptions,
        completionRate: todayCompletionRate
      },
      week: {
        pomodoros: weekPomodoros.length,
        focusTime: weekFocusTime,
        interruptions: weekInterruptions,
        completionRate: weekCompletionRate,
        average: weeklyAverage,
        bestDay: dayNames[bestDay.day],
        bestDayCount: bestDay.pomodoros
      },
      month: {
        pomodoros: monthPomodoros.length,
        focusTime: monthFocusTime
      },
      streak: currentStreak
    };
  }, [sessions, currentStreak]);

  // Formatar tempo
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Determinar nível de produtividade
  const getProductivityLevel = (pomodoros: number) => {
    if (pomodoros >= 8) return { level: 'Excelente', color: 'bg-green-500', emoji: '🔥' };
    if (pomodoros >= 6) return { level: 'Muito Bom', color: 'bg-blue-500', emoji: '⚡' };
    if (pomodoros >= 4) return { level: 'Bom', color: 'bg-yellow-500', emoji: '👍' };
    if (pomodoros >= 2) return { level: 'Regular', color: 'bg-orange-500', emoji: '📈' };
    return { level: 'Baixo', color: 'bg-gray-500', emoji: '🎯' };
  };

  const todayProductivity = getProductivityLevel(stats.today.pomodoros);
  const weekProductivity = getProductivityLevel(stats.week.pomodoros);

  return (
    <div className="space-y-4">
      {/* Stats de Hoje */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Pomodoros</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{stats.today.pomodoros}</span>
              <Badge variant="secondary" className="text-xs">
                {todayProductivity.emoji} {todayProductivity.level}
              </Badge>
            </div>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Tempo Foco</span>
            <span className="font-semibold">{formatTime(stats.today.focusTime)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Interrupções</span>
            <span className="font-semibold text-red-600">{stats.today.interruptions}</span>
          </div>
          
          {stats.today.completionRate > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxa de Conclusão</span>
                <span className="font-semibold">{Math.round(stats.today.completionRate)}%</span>
              </div>
              <Progress value={stats.today.completionRate} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats da Semana */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Esta Semana
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Pomodoros</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{stats.week.pomodoros}</span>
              <Badge variant="outline" className="text-xs">
                {weekProductivity.emoji}
              </Badge>
            </div>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Média/Dia</span>
            <span className="font-semibold">{stats.week.average.toFixed(1)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Tempo Total</span>
            <span className="font-semibold">{formatTime(stats.week.focusTime)}</span>
          </div>
          
          {stats.week.bestDayCount > 0 && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Melhor Dia</span>
              <span className="font-semibold">{stats.week.bestDay} ({stats.week.bestDayCount})</span>
            </div>
          )}
          
          {stats.week.completionRate > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Eficiência</span>
                <span className="font-semibold">{Math.round(stats.week.completionRate)}%</span>
              </div>
              <Progress value={stats.week.completionRate} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Streak e Conquistas */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="h-4 w-4" />
            Conquistas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Sequência Atual</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{stats.streak}</span>
              <Badge variant={stats.streak >= 7 ? 'default' : 'secondary'} className="text-xs">
                {stats.streak >= 7 ? '🔥' : '📅'} dias
              </Badge>
            </div>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Este Mês</span>
            <span className="font-semibold">{stats.month.pomodoros} pomodoros</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Tempo Mensal</span>
            <span className="font-semibold">{formatTime(stats.month.focusTime)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Próxima Meta */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="h-4 w-4" />
            Próxima Meta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.today.pomodoros < 4 ? (
            <div className="text-center py-2">
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-sm font-medium">Complete 4 pomodoros hoje</p>
              <p className="text-xs text-muted-foreground">
                Faltam {4 - stats.today.pomodoros} pomodoros
              </p>
            </div>
          ) : stats.today.pomodoros < 6 ? (
            <div className="text-center py-2">
              <div className="text-2xl mb-1">⚡</div>
              <p className="text-sm font-medium">Alcance 6 pomodoros hoje</p>
              <p className="text-xs text-muted-foreground">
                Faltam {6 - stats.today.pomodoros} pomodoros
              </p>
            </div>
          ) : stats.today.pomodoros < 8 ? (
            <div className="text-center py-2">
              <div className="text-2xl mb-1">🔥</div>
              <p className="text-sm font-medium">Dia excelente com 8 pomodoros</p>
              <p className="text-xs text-muted-foreground">
                Faltam {8 - stats.today.pomodoros} pomodoros
              </p>
            </div>
          ) : (
            <div className="text-center py-2">
              <div className="text-2xl mb-1">🏆</div>
              <p className="text-sm font-medium">Meta diária alcançada!</p>
              <p className="text-xs text-muted-foreground">
                Parabéns pela produtividade
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 