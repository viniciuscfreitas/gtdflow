'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Target, 
  Clock, 
  Archive,
  Filter,
  Calendar,
  CheckCircle2,
  Circle,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFirestoreMatrix } from '@/lib/hooks/useFirestoreMatrix';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCrossMethodologySync } from '@/lib/hooks/useCrossMethodologySync';
import { TaskCompletionFlow } from '@/components/ui/TaskCompletionFlow';
import { useTaskCompletionFlow } from '@/lib/hooks/useTaskCompletionFlow';
import { EisenhowerQuadrant, GTDItem, EisenhowerTask } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useNotificationContext } from '@/lib/contexts/NotificationContext';

export function EisenhowerMatrix() {
  // Adicionar estilos CSS customizados para scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 2px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const [showFilters, setShowFilters] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user } = useAuth();
  const { data: tasks, create: createEisenhowerTask, remove: removeTask } = useFirestoreMatrix(user);
  const { data: gtdItems } = useFirestoreGTD(user);
  const { syncTaskCompletion } = useCrossMethodologySync();
  const { notifyError } = useNotificationContext();
  const { 
    completionFlow, 
    stats, 
    startCompletionFlow, 
    closeCompletionFlow, 
    undoTaskCompletion, 
    generateSuggestions 
  } = useTaskCompletionFlow();

  // Auto-importação de tarefas GTD
  const autoImportGTDTasks = async () => {
    try {
      // Filtrar próximas ações ativas que ainda não estão na matriz
      const availableGTDItems = gtdItems.filter(item => 
        item.type === 'next-action' && 
        item.status === 'active' &&
        !tasks.some(task => task.gtdItemId === item.id)
      );

      if (availableGTDItems.length === 0) {
        return;
      }

      // Função para sugerir quadrante baseado nos dados GTD
      const suggestQuadrant = (item: GTDItem): EisenhowerQuadrant => {
        const hasDeadline = item.dueDate && new Date(item.dueDate) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const isHighEnergy = item.energy === 'high';
        const isWorkContext = item.context?.includes('@trabalho') || item.context?.includes('@office') || item.context?.includes('@work');
        const hasLongEstimate = item.estimatedTime && item.estimatedTime > 60;
        
        // Lógica melhorada de classificação
        if (hasDeadline && (isHighEnergy || isWorkContext || hasLongEstimate)) {
          return 'urgent-important';
        } else if (!hasDeadline && (isHighEnergy || isWorkContext || hasLongEstimate)) {
          return 'not-urgent-important';
        } else if (hasDeadline && !isHighEnergy) {
          return 'urgent-not-important';
        } else {
          return 'not-urgent-not-important';
        }
      };

      const getQuadrantValues = (quadrant: EisenhowerQuadrant) => {
        switch (quadrant) {
          case 'urgent-important': return { urgency: 4, importance: 4 };
          case 'not-urgent-important': return { urgency: 2, importance: 4 };
          case 'urgent-not-important': return { urgency: 4, importance: 2 };
          case 'not-urgent-not-important': return { urgency: 2, importance: 2 };
        }
      };

      // Importar automaticamente
      for (const item of availableGTDItems) {
        const suggestedQuadrant = suggestQuadrant(item);
        const { urgency, importance } = getQuadrantValues(suggestedQuadrant);
        
        const eisenhowerTask = {
          gtdItemId: item.id,
          title: item.title,
          description: item.description,
          quadrant: suggestedQuadrant,
          urgency,
          importance,
          status: 'pending' as const,
          dueDate: item.dueDate,
        };
        
        createEisenhowerTask(eisenhowerTask);
      }
      
      // Sincronização silenciosa - tarefas importadas automaticamente
    } catch (error) {
      notifyError('Erro', 'Falha na sincronização automática');
      console.error('Auto-sync error:', error);
    }
  };

  // Auto-sync quando componente monta e quando GTD items mudam
  useEffect(() => {
    const timer = setTimeout(() => {
      autoImportGTDTasks();
    }, 1000); // Delay para evitar múltiplas execuções

    return () => clearTimeout(timer);
  }, [gtdItems.length, autoImportGTDTasks]); // Reexecuta quando número de itens GTD muda

  // Filtrar tarefas
  const filteredTasks = tasks.filter(task => {
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (searchFilter && !task.title.toLowerCase().includes(searchFilter.toLowerCase())) return false;
    return true;
  });

  // Agrupar tarefas por quadrante
  const tasksByQuadrant = {
    'urgent-important': filteredTasks.filter(task => task.quadrant === 'urgent-important'),
    'not-urgent-important': filteredTasks.filter(task => task.quadrant === 'not-urgent-important'),
    'urgent-not-important': filteredTasks.filter(task => task.quadrant === 'urgent-not-important'),
    'not-urgent-not-important': filteredTasks.filter(task => task.quadrant === 'not-urgent-not-important'),
  };

  const quadrantConfig = {
    'urgent-important': {
      title: 'Fazer Agora',
      subtitle: 'Urgente + Importante',
      description: 'Crises, emergências, problemas urgentes',
      color: 'bg-red-50 border-red-200',
      headerColor: 'bg-red-100',
      icon: AlertTriangle,
      iconColor: 'text-red-600',
      badgeColor: 'bg-red-100 text-red-800',
    },
    'not-urgent-important': {
      title: 'Agendar',
      subtitle: 'Não Urgente + Importante',
      description: 'Planejamento, prevenção, desenvolvimento',
      color: 'bg-blue-50 border-blue-200',
      headerColor: 'bg-blue-100',
      icon: Target,
      iconColor: 'text-blue-600',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    'urgent-not-important': {
      title: 'Delegar',
      subtitle: 'Urgente + Não Importante',
      description: 'Interrupções, algumas ligações, emails',
      color: 'bg-yellow-50 border-yellow-200',
      headerColor: 'bg-yellow-100',
      icon: Clock,
      iconColor: 'text-yellow-600',
      badgeColor: 'bg-yellow-100 text-yellow-800',
    },
    'not-urgent-not-important': {
      title: 'Eliminar',
      subtitle: 'Não Urgente + Não Importante',
      description: 'Distrações, atividades triviais, desperdícios',
      color: 'bg-gray-50 border-gray-200',
      headerColor: 'bg-gray-100',
      icon: Archive,
      iconColor: 'text-gray-600',
      badgeColor: 'bg-gray-100 text-gray-800',
    },
  };

  const handleToggleStatus = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const isCompleted = task.status !== 'completed';
    
    if (isCompleted) {
      // Usar o novo fluxo de conclusão
      await startCompletionFlow(taskId, 'eisenhower');
    } else {
      // Reativar tarefa
      await syncTaskCompletion(taskId, 'eisenhower', false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    removeTask(taskId);
    // Tarefa removida
  };

  const TaskCard = ({ task, quadrantColor }: { task: EisenhowerTask; quadrantColor: string }) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
    const isCompleted = task.status === 'completed';

    return (
      <div className={cn(
        "group p-3 rounded-lg border transition-all duration-200 hover:shadow-sm bg-white/80 backdrop-blur-sm",
        isCompleted ? "opacity-60" : "",
        isOverdue ? "border-red-300 bg-red-50/80" : "border-gray-200 hover:border-gray-300"
      )}>
        <div className="flex items-start gap-2">
          {/* Status Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="flex-shrink-0 p-0 h-auto mt-0.5"
            onClick={() => handleToggleStatus(task.id)}
          >
            {isCompleted ? (
              <CheckCircle2 className={`h-4 w-4 ${quadrantColor}`} />
            ) : (
              <Circle className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            )}
          </Button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={cn(
                "font-medium text-sm leading-tight",
                isCompleted ? "line-through text-muted-foreground" : ""
              )}>
                {task.title}
              </h4>
              
              {/* Actions Menu - Compacto */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex-shrink-0 p-0.5 h-auto opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    onClick={() => handleToggleStatus(task.id)}
                    className={quadrantColor}
                  >
                    {isCompleted ? 'Marcar como pendente' : 'Marcar como concluída'}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-red-600"
                  >
                    Remover
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Descrição - Mais compacta */}
            {task.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {task.description}
              </p>
            )}

            {/* Badges - Layout mais compacto */}
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {/* Urgência/Importância - Mais compacto */}
              <Badge variant="outline" className="text-xs px-1.5 py-0.5 h-auto">
                U{task.urgency}/I{task.importance}
              </Badge>

              {/* Data de vencimento */}
              {task.dueDate && (
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs px-1.5 py-0.5 h-auto",
                    isOverdue ? "border-red-300 text-red-600 bg-red-50" : ""
                  )}
                >
                  <Calendar className="h-2.5 w-2.5 mr-1" />
                  {new Date(task.dueDate).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: '2-digit' 
                  })}
                </Badge>
              )}

              {/* Status - Apenas se relevante */}
              {isCompleted && (
                <Badge variant="default" className="text-xs px-1.5 py-0.5 h-auto">
                  ✓
                </Badge>
              )}

              {isOverdue && !isCompleted && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5 h-auto">
                  !
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Filtros */}
      {showFilters && (
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar tarefas..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Todos os status</option>
              <option value="pending">Pendente</option>
              <option value="completed">Concluída</option>
            </select>
          </div>
        </Card>
      )}

      {/* Estatísticas rápidas - Compactas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(tasksByQuadrant).map(([quadrant, quadrantTasks]) => {
          const config = quadrantConfig[quadrant as EisenhowerQuadrant];
          const Icon = config.icon;
          
          return (
            <Card key={quadrant} className="p-3">
              <div className="flex items-center gap-2">
                <Icon className={`h-4 w-4 ${config.iconColor}`} />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{config.title}</p>
                  <p className="text-xl font-bold">{quadrantTasks.length}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Matriz 2x2 - Layout otimizado */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-350px)] min-h-[500px] max-h-[800px]">
        {Object.entries(quadrantConfig).map(([quadrant, config]) => {
          const Icon = config.icon;
          const quadrantTasks = tasksByQuadrant[quadrant as EisenhowerQuadrant];
          
          return (
            <Card 
              key={quadrant} 
              className={`${config.color} flex flex-col transition-all duration-200 hover:shadow-md`}
            >
              {/* Header compacto */}
              <CardHeader className={`${config.headerColor} rounded-t-lg pb-3`}>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.iconColor}`} />
                    <div>
                      <h3 className="font-semibold text-sm">{config.title}</h3>
                      <p className="text-xs font-normal text-muted-foreground">
                        {config.subtitle}
                      </p>
                    </div>
                  </div>
                  <Badge className={`${config.badgeColor} text-xs`}>
                    {quadrantTasks.length}
                  </Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  {config.description}
                </p>
              </CardHeader>
              
              {/* Content com scroll */}
              <CardContent className="flex-1 p-3 overflow-hidden">
                {quadrantTasks.length > 0 ? (
                  <div className="space-y-2 h-full overflow-y-auto pr-1 custom-scrollbar">
                    {quadrantTasks.map((task) => (
                      <TaskCard 
                        key={task.id}
                        task={task}
                        quadrantColor={config.iconColor}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground border-2 border-dashed border-gray-300 rounded-lg py-6">
                    <Icon className={`h-8 w-8 mb-2 opacity-50 ${config.iconColor}`} />
                    <p className="text-sm font-medium">Nenhuma tarefa</p>
                    <p className="text-xs mt-1 text-center">
                      Tarefas do GTD aparecerão<br />aqui automaticamente
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Fluxo de Conclusão Melhorado */}
      <TaskCompletionFlow
        isOpen={completionFlow.isOpen}
        onClose={closeCompletionFlow}
        completedTask={completionFlow.completedTask}
        stats={stats}
        suggestions={completionFlow.completedTask ? generateSuggestions(completionFlow.completedTask) : []}
                 onSelectSuggestion={() => {
           // Navegar para a tarefa sugerida ou abrir para edição
           closeCompletionFlow();
         }}
        onCreateNew={() => {
          // Abrir dialog de criação de nova tarefa
          closeCompletionFlow();
        }}
        onTakeBreak={() => {
          // Sugerir pausa ou abrir Pomodoro
          closeCompletionFlow();
        }}
        onUndo={() => {
          if (completionFlow.completedTask) {
            undoTaskCompletion(completionFlow.completedTask.id, 'eisenhower');
          }
        }}
      />
    </div>
  );
} 