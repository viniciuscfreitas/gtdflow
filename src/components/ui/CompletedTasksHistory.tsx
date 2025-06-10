'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  Search, 
  Filter,
  RotateCcw,
  Target,
  Grid3X3,
  Archive,
  Trophy,
  Zap
} from 'lucide-react';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useFirestoreMatrix } from '@/lib/hooks/useFirestoreMatrix';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCrossMethodologySync } from '@/lib/hooks/useCrossMethodologySync';
import { useNotificationContext } from '@/lib/contexts/NotificationContext';
import { GTDItem, EisenhowerTask } from '@/lib/types';

interface CompletedTasksHistoryProps {
  limit?: number;
  showFilters?: boolean;
}

interface CompletedTaskWithMetadata {
  id: string;
  title: string;
  description?: string;
  type: 'gtd' | 'eisenhower';
  completedAt: string;
  context?: string;
  quadrant?: string;
  area?: string;
  energy?: string;
  estimatedTime?: number;
  originalTask: GTDItem | EisenhowerTask;
}

export function CompletedTasksHistory({ limit, showFilters = true }: CompletedTasksHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const { user } = useAuth();
  const { data: gtdItems } = useFirestoreGTD(user);
  const { data: eisenhowerTasks } = useFirestoreMatrix(user);
  const { syncTaskCompletion } = useCrossMethodologySync();
  const { notifySuccess, notifyInfo } = useNotificationContext();

  // Função auxiliar para converter quadrante
  const getQuadrantName = (quadrant: string): string => {
    switch (quadrant) {
      case 'urgent-important': return 'Fazer Agora';
      case 'important-not-urgent': return 'Agendar';
      case 'urgent-not-important': return 'Delegar';
      case 'not-urgent-not-important': return 'Eliminar';
      default: return quadrant;
    }
  };

  // Combinar tarefas concluídas de ambos os sistemas
  const completedTasks = useMemo((): CompletedTaskWithMetadata[] => {
    const tasks: CompletedTaskWithMetadata[] = [];

    // Tarefas GTD concluídas
    gtdItems
      .filter(item => item.status === 'completed' && item.completedAt)
      .forEach(item => {
        tasks.push({
          id: item.id,
          title: item.title,
          description: item.description,
          type: 'gtd',
          completedAt: item.completedAt!,
          context: item.context,
          area: item.area,
          energy: item.energy,
          estimatedTime: item.estimatedTime,
          originalTask: item
        });
      });

    // Tarefas Eisenhower concluídas
    eisenhowerTasks
      .filter(task => task.status === 'completed' && task.completedAt)
      .forEach(task => {
        const quadrant = getQuadrantName(task.quadrant);
        tasks.push({
          id: task.id,
          title: task.title,
          description: task.description,
          type: 'eisenhower',
          completedAt: task.completedAt!,
          quadrant,
          estimatedTime: undefined,
          originalTask: task
        });
      });

    return tasks;
  }, [gtdItems, eisenhowerTasks]);

  // Aplicar filtros
  const filteredTasks = useMemo(() => {
    let filtered = completedTasks;

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtro de tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(task => task.type === typeFilter);
    }

    // Filtro de período
    if (periodFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (periodFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      if (periodFilter !== 'all') {
        filtered = filtered.filter(task => 
          new Date(task.completedAt) >= filterDate
        );
      }
    }

    // Ordenação
    switch (sortBy) {
      case 'recent':
        filtered.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime());
        break;
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }

    return limit ? filtered.slice(0, limit) : filtered;
  }, [completedTasks, searchTerm, typeFilter, periodFilter, sortBy, limit]);

  // Estatísticas
  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toDateString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: completedTasks.length,
      today: completedTasks.filter(task => 
        new Date(task.completedAt).toDateString() === today
      ).length,
      thisWeek: completedTasks.filter(task => 
        new Date(task.completedAt) >= weekAgo
      ).length,
      thisMonth: completedTasks.filter(task => 
        new Date(task.completedAt) >= monthAgo
      ).length,
      gtdTasks: completedTasks.filter(task => task.type === 'gtd').length,
      matrixTasks: completedTasks.filter(task => task.type === 'eisenhower').length
    };
  }, [completedTasks]);

  // Funções auxiliares
  const getQuadrantColor = (quadrant?: string): string => {
    switch (quadrant) {
      case 'Fazer Agora': return 'bg-red-100 text-red-800 border-red-200';
      case 'Agendar': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Delegar': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Eliminar': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEnergyColor = (energy?: string): string => {
    switch (energy) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} meses atrás`;
    return `${Math.floor(diffDays / 365)} anos atrás`;
  };

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Reativar tarefa
  const handleReactivateTask = async (task: CompletedTaskWithMetadata) => {
    try {
      await syncTaskCompletion(task.id, task.type, false);
      notifySuccess(
        'Tarefa Reativada',
        `"${task.title}" foi reativada e está disponível novamente`
      );
    } catch (error) {
      notifyInfo('Erro', 'Não foi possível reativar a tarefa');
      console.error('Error reactivating task:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Trophy className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-yellow-600">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.today}</div>
            <div className="text-xs text-muted-foreground">Hoje</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.thisWeek}</div>
            <div className="text-xs text-muted-foreground">Esta Semana</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.thisMonth}</div>
            <div className="text-xs text-muted-foreground">Este Mês</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <CheckCircle2 className="h-6 w-6 text-green-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-green-600">{stats.gtdTasks}</div>
            <div className="text-xs text-muted-foreground">GTD</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 text-center">
            <Grid3X3 className="h-6 w-6 text-orange-600 mx-auto mb-1" />
            <div className="text-2xl font-bold text-orange-600">{stats.matrixTasks}</div>
            <div className="text-xs text-muted-foreground">Matriz</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tarefas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="gtd">GTD</SelectItem>
                  <SelectItem value="eisenhower">Matriz</SelectItem>
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="quarter">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Mais recentes</SelectItem>
                  <SelectItem value="oldest">Mais antigas</SelectItem>
                  <SelectItem value="title">Título A-Z</SelectItem>
                </SelectContent>
              </Select>

              {(searchTerm || typeFilter !== 'all' || periodFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setPeriodFilter('all');
                  }}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Tarefas Concluídas */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {completedTasks.length === 0 
                    ? 'Nenhuma tarefa concluída ainda' 
                    : 'Nenhuma tarefa encontrada'
                  }
                </h3>
                <p className="text-muted-foreground">
                  {completedTasks.length === 0
                    ? 'Complete algumas tarefas para ver seu histórico de conquistas aqui'
                    : 'Tente ajustar os filtros para encontrar o que procura'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  {/* Ícone de Conclusão */}
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Título e Descrição */}
                    <h4 className="font-medium text-sm mb-1 line-clamp-2">
                      {task.title}
                    </h4>
                    
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Metadados */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      {/* Tipo */}
                      <Badge variant="outline" className="text-xs">
                        {task.type === 'gtd' ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            GTD
                          </>
                        ) : (
                          <>
                            <Grid3X3 className="h-3 w-3 mr-1" />
                            Matriz
                          </>
                        )}
                      </Badge>

                      {/* Contexto (GTD) */}
                      {task.context && (
                        <Badge variant="outline" className="text-xs">
                          📍 {task.context}
                        </Badge>
                      )}

                      {/* Quadrante (Matriz) */}
                      {task.quadrant && (
                        <Badge variant="outline" className={`text-xs ${getQuadrantColor(task.quadrant)}`}>
                          <Target className="h-3 w-3 mr-1" />
                          {task.quadrant}
                        </Badge>
                      )}

                      {/* Energia (GTD) */}
                      {task.energy && (
                        <Badge variant="outline" className={`text-xs ${getEnergyColor(task.energy)}`}>
                          <Zap className="h-3 w-3 mr-1" />
                          {task.energy}
                        </Badge>
                      )}

                      {/* Tempo Estimado */}
                      {task.estimatedTime && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {task.estimatedTime}min
                        </Badge>
                      )}

                      {/* Área (GTD) */}
                      {task.area && (
                        <Badge variant="outline" className="text-xs">
                          🏷️ {task.area}
                        </Badge>
                      )}
                    </div>

                    {/* Data de Conclusão */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Concluída {formatDate(task.completedAt)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>às {formatTime(task.completedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ação de Reativar */}
                  <div className="flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReactivateTask(task)}
                      className="h-8 px-3 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                      title="Reativar tarefa"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Reativar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Mostrar mais */}
      {limit && filteredTasks.length === limit && completedTasks.length > limit && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Mostrando {limit} de {completedTasks.length} tarefas concluídas
          </p>
        </div>
      )}
    </div>
  );
} 