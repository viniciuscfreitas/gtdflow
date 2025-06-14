'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Clock, 
  Zap, 
  Target,
  Plus,
  CheckCircle,
  Circle,
  Filter
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useGTDItemsFirestore } from '@/lib/hooks/useFirestoreCompat';
import { GTDItem } from '@/lib/types';
import { toast } from 'sonner';

interface TaskSelectorProps {
  selectedTask?: { id: string; title: string } | null;
  onTaskSelect: (task: { id: string; title: string } | null) => void;
  onCreateTask?: () => void;
}

export function TaskSelector({ selectedTask, onTaskSelect, onCreateTask }: TaskSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterContext, setFilterContext] = useState<string>('all');
  const [filterEnergy, setFilterEnergy] = useState<string>('all');
  
  const { user } = useAuth();
  
  // Carregar tarefas GTD via Firestore
  const { data: gtdItems = [] } = useGTDItemsFirestore(user);

  // Filtrar tarefas disponíveis para Pomodoro
  const availableTasks = useMemo(() => {
    return gtdItems.filter(item => {
      // Apenas próximas ações ativas
      if (item.type !== 'next-action' || item.status !== 'active') {
        return false;
      }
      
      // Filtro de busca
      if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Filtro de contexto
      if (filterContext !== 'all' && item.context !== filterContext) {
        return false;
      }
      
      // Filtro de energia
      if (filterEnergy !== 'all' && item.energy !== filterEnergy) {
        return false;
      }
      
      return true;
    });
  }, [gtdItems, searchTerm, filterContext, filterEnergy]);

  // Obter contextos únicos
  const contexts = useMemo(() => {
    const uniqueContexts = [...new Set(gtdItems
      .filter(item => item.context)
      .map(item => item.context!)
    )];
    return uniqueContexts.sort();
  }, [gtdItems]);

  // Formatar tempo estimado
  const formatEstimatedTime = (minutes?: number) => {
    if (!minutes) return null;
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  // Determinar cor da energia
  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Determinar emoji da energia
  const getEnergyEmoji = (energy: string) => {
    switch (energy) {
      case 'high':
        return '🔥';
      case 'medium':
        return '⚡';
      case 'low':
        return '🌱';
      default:
        return '📋';
    }
  };

  // Selecionar tarefa
  const handleTaskSelect = (task: GTDItem) => {
    onTaskSelect({ id: task.id, title: task.title });
    toast.success('Tarefa selecionada! 🎯', {
      description: `Foque em: ${task.title}`
    });
  };

  // Desselecionar tarefa
  const handleTaskDeselect = () => {
    onTaskSelect(null);
    toast.info('Tarefa desselecionada');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Selecionar Tarefa
          </div>
          {onCreateTask && (
            <Button onClick={onCreateTask} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Nova Tarefa
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tarefa Selecionada */}
        {selectedTask && (
          <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-primary">Tarefa Selecionada</p>
                  <p className="text-sm text-muted-foreground">{selectedTask.title}</p>
                </div>
              </div>
              <Button 
                onClick={handleTaskDeselect}
                size="sm" 
                variant="ghost"
              >
                Alterar
              </Button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <div className="flex items-center gap-1">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Contexto:</span>
              <select
                value={filterContext}
                onChange={(e) => setFilterContext(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">Todos</option>
                {contexts.map(context => (
                  <option key={context} value={context}>{context}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Energia:</span>
              <select
                value={filterEnergy}
                onChange={(e) => setFilterEnergy(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">Todas</option>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Tarefas */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {availableTasks.length === 0 ? (
            <div className="text-center py-8">
              <Circle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa disponível</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterContext !== 'all' || filterEnergy !== 'all'
                  ? 'Nenhuma tarefa corresponde aos filtros aplicados'
                  : 'Crie tarefas no GTD para focar com Pomodoro'
                }
              </p>
              {onCreateTask && (
                <Button onClick={onCreateTask} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Tarefa
                </Button>
              )}
            </div>
          ) : (
            availableTasks.map(task => (
              <div
                key={task.id}
                className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                  selectedTask?.id === task.id ? 'border-primary bg-primary/5' : 'border-border'
                }`}
                onClick={() => handleTaskSelect(task)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{task.title}</h4>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {task.context && (
                        <Badge variant="outline" className="text-xs">
                          {task.context}
                        </Badge>
                      )}
                      
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getEnergyColor(task.energy)}`}
                      >
                        {getEnergyEmoji(task.energy)} {task.energy}
                      </Badge>
                      
                      {task.estimatedTime && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatEstimatedTime(task.estimatedTime)}
                        </Badge>
                      )}
                      
                      {task.dueDate && (
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
                            new Date(task.dueDate) < new Date() 
                              ? 'bg-red-100 text-red-800 border-red-200' 
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                          }`}
                        >
                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="ml-2">
                    {selectedTask?.id === task.id ? (
                      <CheckCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Estatísticas */}
        {availableTasks.length > 0 && (
          <div className="pt-3 border-t">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{availableTasks.length} tarefas disponíveis</span>
              <span>
                {availableTasks.filter(t => t.estimatedTime).length > 0 && 
                  `Tempo total: ${formatEstimatedTime(
                    availableTasks
                      .filter(t => t.estimatedTime)
                      .reduce((acc, t) => acc + (t.estimatedTime || 0), 0)
                  )}`
                }
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 