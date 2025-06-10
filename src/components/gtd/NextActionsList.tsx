'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Zap,
  Calendar,
  Edit,
  Trash2,
  Grid3X3,
  ArrowRight
} from 'lucide-react';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useFirestoreMatrix } from '@/lib/hooks/useFirestoreMatrix';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useCrossMethodologySync } from '@/lib/hooks/useCrossMethodologySync';
import { EditActionDialog } from './EditActionDialog';
import { GTDItem, EisenhowerQuadrant } from '@/lib/types';
import { useNotificationContext } from '@/lib/contexts/NotificationContext';
import { useTaskCompletionFlow } from '@/lib/hooks/useTaskCompletionFlow';
import { TaskCompletionFlow } from '@/components/ui/TaskCompletionFlow';

export function NextActionsList() {
  const { user } = useAuth();
  const { data: gtdItems } = useFirestoreGTD(user);
  const { data: eisenhowerTasks, create: createEisenhowerTask } = useFirestoreMatrix(user);
  const { syncTaskDeletion } = useCrossMethodologySync();
  const { notifySuccess, notifyError } = useNotificationContext();
  const { 
    completionFlow, 
    stats, 
    startCompletionFlow, 
    closeCompletionFlow, 
    undoTaskCompletion, 
    generateSuggestions 
  } = useTaskCompletionFlow();
  const [searchTerm, setSearchTerm] = useState('');
  const [contextFilter, setContextFilter] = useState('all');
  const [energyFilter, setEnergyFilter] = useState('all');
  const [editingAction, setEditingAction] = useState<string | null>(null);

  // Filter next actions
  const nextActions = gtdItems.filter((item: GTDItem) => 
    item.type === 'next-action' && item.status === 'active'
  );

  // Apply filters
  const filteredActions = nextActions.filter((action: GTDItem) => {
    const matchesSearch = action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (action.description && action.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesContext = contextFilter === 'all' || action.context === contextFilter;
    const matchesEnergy = energyFilter === 'all' || action.energy === energyFilter;
    
    return matchesSearch && matchesContext && matchesEnergy;
  });

  // Get unique contexts
  const contexts = [...new Set(nextActions.map((action: GTDItem) => action.context).filter(Boolean))] as string[];

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

  // Verificar se tarefa já está na matriz
  const isTaskInMatrix = (gtdItemId: string) => {
    return eisenhowerTasks.some(task => task.gtdItemId === gtdItemId);
  };

  const handleCompleteAction = async (actionId: string) => {
    try {
      // Usar o novo fluxo de conclusão
      await startCompletionFlow(actionId, 'gtd');
    } catch (error) {
      notifyError('Erro', 'Não foi possível concluir a ação');
      console.error('Error completing action:', error);
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (confirm('Tem certeza que deseja excluir esta ação?')) {
      try {
        await syncTaskDeletion(actionId, 'gtd');
      } catch (error) {
        notifyError('Erro', 'Não foi possível excluir a ação');
        console.error('Error deleting action:', error);
      }
    }
  };

  const handlePrioritizeInMatrix = async (action: GTDItem) => {
    try {
      // Verificar se já está na matriz
      if (isTaskInMatrix(action.id)) {
        return;
      }

      const suggestedQuadrant = suggestQuadrant(action);
      const { urgency, importance } = getQuadrantValues(suggestedQuadrant);
      
      const eisenhowerTask = {
        gtdItemId: action.id,
        title: action.title,
        description: action.description,
        quadrant: suggestedQuadrant,
        urgency,
        importance,
        status: 'pending' as const,
        dueDate: action.dueDate,
      };
      
      createEisenhowerTask(eisenhowerTask);
      
      // Feedback com informação do quadrante sugerido
      const quadrantNames = {
        'urgent-important': 'Fazer Agora (Urgente + Importante)',
        'not-urgent-important': 'Agendar (Importante)',
        'urgent-not-important': 'Delegar (Urgente)',
        'not-urgent-not-important': 'Eliminar (Baixa prioridade)'
      };
      
      notifySuccess('Tarefa adicionada à Matriz', `Sugerido: ${quadrantNames[suggestedQuadrant]}`);
    } catch (error) {
      notifyError('Erro', 'Não foi possível priorizar na matriz');
      console.error('Error prioritizing in matrix:', error);
    }
  };

  const getEnergyColor = (energy: string) => {
    switch (energy) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getEnergyIcon = (energy: string) => {
    switch (energy) {
      case 'low': return <Zap className="h-3 w-3" />;
      case 'medium': return <Zap className="h-3 w-3" />;
      case 'high': return <Zap className="h-3 w-3" />;
      default: return <Zap className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';
    if (diffDays < 0) return `${Math.abs(diffDays)} dias atrás`;
    if (diffDays <= 7) return `Em ${diffDays} dias`;
    
    return date.toLocaleDateString('pt-BR');
  };

  if (nextActions.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma próxima ação</h3>
            <p className="text-muted-foreground mb-4">
              Processe itens do inbox ou crie ações diretamente aqui
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Próximas Ações</h3>
          <p className="text-sm text-muted-foreground">
            {filteredActions.length} de {nextActions.length} ação{nextActions.length !== 1 ? 'ões' : ''} 
            {filteredActions.length !== nextActions.length && ' (filtradas)'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Context Filter */}
            <Select value={contextFilter} onValueChange={setContextFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os contextos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os contextos</SelectItem>
                {contexts.map((context) => (
                  <SelectItem key={context} value={context}>
                    {context}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Energy Filter */}
            <Select value={energyFilter} onValueChange={setEnergyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Toda energia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toda energia</SelectItem>
                <SelectItem value="low">Baixa energia</SelectItem>
                <SelectItem value="medium">Média energia</SelectItem>
                <SelectItem value="high">Alta energia</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {(searchTerm || contextFilter !== 'all' || energyFilter !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setContextFilter('all');
                  setEnergyFilter('all');
                }}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions List */}
      <div className="space-y-3">
        {filteredActions.map((action: GTDItem) => {
          const inMatrix = isTaskInMatrix(action.id);
          const suggestedQuadrant = suggestQuadrant(action);
          
          return (
          <Card key={action.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                {/* Complete Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCompleteAction(action.id)}
                  className="flex-shrink-0 h-8 w-8 p-0 rounded-full hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                  title="Marcar como concluída"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
                
                <div className="flex-1 min-w-0">
                  {/* Title and Description */}
                  <h4 className="font-medium text-sm mb-1 line-clamp-2">
                    {action.title}
                  </h4>
                  
                  {action.description && (
                    <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap break-words">
                      {action.description}
                    </p>
                  )}
                  
                  {/* Metadata */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Context */}
                    {action.context && (
                      <Badge variant="secondary" className="text-xs">
                        {action.context}
                      </Badge>
                    )}
                    
                    {/* Energy Level */}
                    {action.energy && (
                      <Badge variant="outline" className={`text-xs ${getEnergyColor(action.energy)}`}>
                        {getEnergyIcon(action.energy)}
                        <span className="ml-1 capitalize">{action.energy}</span>
                      </Badge>
                    )}
                    
                    {/* Due Date */}
                    {action.dueDate && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(action.dueDate.toISOString())}
                      </Badge>
                    )}
                    
                    {/* Estimated Time */}
                    {action.estimatedTime && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {action.estimatedTime}min
                      </Badge>
                    )}

                      {/* Matrix Status */}
                      {inMatrix && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          <Grid3X3 className="h-3 w-3 mr-1" />
                          Na Matriz
                        </Badge>
                      )}

                      {/* Suggested Quadrant Preview for non-matrix items */}
                      {!inMatrix && (
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-200">
                          <Target className="h-3 w-3 mr-1" />
                          Sugestão: {suggestedQuadrant.replace('urgent-', 'U+').replace('not-urgent-', '').replace('important', 'I').replace('not-important', 'NI')}
                        </Badge>
                      )}
                    </div>
                </div>
                
                {/* Actions Menu */}
                <div className="flex items-center gap-1">
                    {/* Prioritize in Matrix Button */}
                    {!inMatrix && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrioritizeInMatrix(action)}
                        className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                        title={`Priorizar na Matriz (sugestão: ${suggestedQuadrant})`}
                      >
                        <Grid3X3 className="h-3 w-3 mr-1" />
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                    
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingAction(action.id)}
                    className="h-8 px-2"
                    title="Editar ação"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteAction(action.id)}
                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Excluir ação"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* No results */}
      {filteredActions.length === 0 && nextActions.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium mb-1">Nenhuma ação encontrada</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar os filtros ou termo de busca
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {editingAction && (
        <EditActionDialog
          actionId={editingAction}
          onClose={() => setEditingAction(null)}
          onSuccess={() => {
            setEditingAction(null);
            // Ação atualizada
          }}
        />
      )}

      {/* Fluxo de Conclusão */}
      <TaskCompletionFlow
        isOpen={completionFlow.isOpen}
        onClose={closeCompletionFlow}
        completedTask={completionFlow.completedTask}
        stats={stats}
        suggestions={completionFlow.completedTask ? generateSuggestions(completionFlow.completedTask) : []}
        onSelectSuggestion={() => {
          closeCompletionFlow();
        }}
        onCreateNew={() => {
          closeCompletionFlow();
        }}
        onTakeBreak={() => {
          closeCompletionFlow();
        }}
        onUndo={() => {
          if (completionFlow.completedTask) {
            undoTaskCompletion(completionFlow.completedTask.id, 'gtd');
          }
        }}
      />
    </div>
  );
} 