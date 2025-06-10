'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  FolderOpen, 
  Plus, 
  Search,
  Filter,
  Clock,
  Target,
  Edit,
  Trash2,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CreateProjectDialog } from './CreateProjectDialog';
import { EditProjectDialog } from './EditProjectDialog';
import { ProjectDetailDialog } from './ProjectDetailDialog';
import { toast } from 'sonner';
import { GTDItem } from '@/lib/types';

export function ProjectsList() {
  const { user } = useAuth();
  const { data: gtdItems, remove } = useFirestoreGTD(user);
  const [searchTerm, setSearchTerm] = useState('');
  // const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [viewingProject, setViewingProject] = useState<string | null>(null);

  // Filter projects
  const projects = gtdItems.filter((item: GTDItem) => 
    item.type === 'project' && item.status === 'active'
  );

  // Apply filters
  const filteredProjects = projects.filter((project: GTDItem) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  // Get related actions for each project
  const getProjectActions = (projectId: string) => {
    return gtdItems.filter((item: GTDItem) => 
      item.type === 'next-action' && 
      item.projectId === projectId &&
      item.status === 'active'
    );
  };

  const getProjectProgress = (projectId: string) => {
    const allActions = gtdItems.filter((item: GTDItem) => 
      item.type === 'next-action' && item.projectId === projectId
    );
    const completedActions = allActions.filter((item: GTDItem) => item.status === 'completed');
    
    if (allActions.length === 0) return 0;
    return Math.round((completedActions.length / allActions.length) * 100);
  };

  // const handleCompleteProject = async (projectId: string) => {
  //   try {
  //     update(projectId, { 
  //       status: 'completed',
  //       completedAt: new Date().toISOString()
  //     } as any);
  //     toast.success('Projeto concluído!');
  //   } catch (error) {
  //     toast.error('Erro ao concluir projeto');
  //     console.error('Error completing project:', error);
  //   }
  // };

  const handleDeleteProject = async (projectId: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto? Todas as ações relacionadas serão mantidas.')) {
      try {
        remove(projectId);
        toast.success('Projeto excluído');
      } catch (error) {
        toast.error('Erro ao excluir projeto');
        console.error('Error deleting project:', error);
      }
    }
  };

  const getStatusColor = (progress: number) => {
    if (progress === 0) return 'text-gray-600 bg-gray-50 border-gray-200';
    if (progress < 30) return 'text-red-600 bg-red-50 border-red-200';
    if (progress < 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (progress < 100) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getStatusText = (progress: number) => {
    if (progress === 0) return 'Não iniciado';
    if (progress < 30) return 'Iniciando';
    if (progress < 70) return 'Em progresso';
    if (progress < 100) return 'Quase pronto';
    return 'Concluído';
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

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum projeto ativo</h3>
            <p className="text-muted-foreground mb-4">
              Projetos são resultados que requerem múltiplas ações para serem concluídos
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Projeto
            </Button>
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
          <h3 className="text-lg font-semibold">Projetos Ativos</h3>
          <p className="text-sm text-muted-foreground">
            {filteredProjects.length} de {projects.length} projeto{projects.length !== 1 ? 's' : ''} 
            {filteredProjects.length !== projects.length && ' (filtrados)'}
          </p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar projetos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Clear Filters */}
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.map((project: GTDItem) => {
          const actions = getProjectActions(project.id);
          const progress = getProjectProgress(project.id);
          
          return (
            <Card key={project.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium text-base line-clamp-1">
                          {project.title}
                        </h4>
                        <Badge variant="outline" className={`text-xs ${getStatusColor(progress)}`}>
                          {getStatusText(progress)}
                        </Badge>
                      </div>
                      
                      {project.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Actions Menu */}
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingProject(project.id)}
                        className="h-8 px-3"
                      >
                        <ArrowRight className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingProject(project.id)}
                        className="h-8 px-2"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProject(project.id)}
                        className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>{actions.length} ação{actions.length !== 1 ? 'ões' : ''} ativa{actions.length !== 1 ? 's' : ''}</span>
                    </div>
                    
                    {project.dueDate && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Prazo: {formatDate(project.dueDate.toISOString())}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Criado {formatDate(project.createdAt.toISOString())}</span>
                    </div>
                  </div>

                  {/* Next Actions Preview */}
                  {actions.length > 0 && (
                    <div className="border-t pt-3">
                      <h5 className="text-sm font-medium mb-2">Próximas ações:</h5>
                      <div className="space-y-1">
                        {actions.map((action: GTDItem) => (
                          <div key={action.id} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                            <span className="line-clamp-1">{action.title}</span>
                            {action.context && (
                              <Badge variant="secondary" className="text-xs px-1 py-0">
                                {action.context}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* No results */}
      {filteredProjects.length === 0 && projects.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium mb-1">Nenhum projeto encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar o termo de busca
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      {showCreateDialog && (
        <CreateProjectDialog
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            toast.success('Projeto criado com sucesso!');
          }}
        />
      )}

      {editingProject && (
        <EditProjectDialog
          project={projects.find(p => p.id === editingProject)!}
          open={!!editingProject}
          onOpenChange={(open: boolean) => !open && setEditingProject(null)}
        />
      )}

      {viewingProject && (
        <ProjectDetailDialog
          project={projects.find(p => p.id === viewingProject)!}
          open={!!viewingProject}
          onOpenChange={(open: boolean) => !open && setViewingProject(null)}
        />
      )}
    </div>
  );
} 