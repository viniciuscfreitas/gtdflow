'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  History, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Pause,
  Calendar,
  Filter,
  TrendingUp
} from 'lucide-react';
import { PomodoroSession } from '@/lib/types';

interface SessionHistoryProps {
  sessions: PomodoroSession[];
  limit?: number;
  showFilters?: boolean;
}

export function SessionHistory({ sessions, limit, showFilters = true }: SessionHistoryProps) {
  // Ordenar sessões por data (mais recentes primeiro)
  const sortedSessions = useMemo(() => {
    return [...sessions]
      .filter(session => session.startTime)
      .sort((a, b) => new Date(b.startTime!).getTime() - new Date(a.startTime!).getTime())
      .slice(0, limit);
  }, [sessions, limit]);

  // Estatísticas rápidas
  const stats = useMemo(() => {
    const completed = sessions.filter(s => s.status === 'completed').length;
    const interrupted = sessions.filter(s => s.status === 'interrupted').length;
    const totalFocusTime = sessions
      .filter(s => s.status === 'completed')
      .reduce((acc, s) => acc + s.duration, 0);
    
    return {
      total: sessions.length,
      completed,
      interrupted,
      completionRate: sessions.length > 0 ? (completed / sessions.length) * 100 : 0,
      totalFocusTime
    };
  }, [sessions]);

  // Formatar tempo
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Formatar data
  const formatDate = (date: Date) => {
    const now = new Date();
    const sessionDate = new Date(date);
    const diffInHours = (now.getTime() - sessionDate.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}min atrás`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h atrás`;
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return sessionDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
  };

  // Determinar cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'interrupted':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Determinar ícone do status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'interrupted':
        return <XCircle className="h-4 w-4" />;
      case 'active':
        return <Pause className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Determinar label do status
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída';
      case 'interrupted':
        return 'Interrompida';
      case 'active':
        return 'Ativa';
      case 'planned':
        return 'Planejada';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Sessões
          </div>
          {showFilters && (
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filtros
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-semibold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-700">{stats.completed}</div>
            <div className="text-xs text-green-600">Concluídas</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-lg font-semibold text-red-700">{stats.interrupted}</div>
            <div className="text-xs text-red-600">Interrompidas</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold text-blue-700">
              {Math.round(stats.completionRate)}%
            </div>
            <div className="text-xs text-blue-600">Taxa Sucesso</div>
          </div>
        </div>

        {/* Lista de Sessões */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sortedSessions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma sessão ainda</h3>
              <p className="text-muted-foreground">
                Inicie seu primeiro Pomodoro para ver o histórico aqui
              </p>
            </div>
          ) : (
            sortedSessions.map(session => (
              <div
                key={session.id}
                className="p-3 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{session.taskTitle}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(session.status)}`}
                      >
                        {getStatusIcon(session.status)}
                        <span className="ml-1">{getStatusLabel(session.status)}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(session.duration)}
                      </div>
                      
                      {session.startTime && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(new Date(session.startTime))}
                        </div>
                      )}
                      
                      {session.interruptions > 0 && (
                        <div className="flex items-center gap-1 text-red-600">
                          <XCircle className="h-3 w-3" />
                          {session.interruptions} interrupções
                        </div>
                      )}
                    </div>
                    
                    {session.notes && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {session.notes}
                      </p>
                    )}
                  </div>
                  
                  <div className="ml-2 text-right">
                    {session.startTime && session.endTime && (
                      <div className="text-xs text-muted-foreground">
                        {new Date(session.startTime).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })} - {new Date(session.endTime).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Resumo de Tempo Total */}
        {stats.totalFocusTime > 0 && (
          <div className="pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Tempo total de foco
              </div>
              <div className="font-semibold">
                {formatTime(stats.totalFocusTime)}
              </div>
            </div>
          </div>
        )}

        {/* Ver Mais */}
        {limit && sessions.length > limit && (
          <div className="text-center pt-2">
            <Button variant="outline" size="sm">
              Ver todas as {sessions.length} sessões
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 