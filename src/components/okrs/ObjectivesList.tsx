'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useObjectives } from '@/lib/hooks/useLocalStorage';
import { Objective } from '@/lib/types';
import { CreateObjectiveForm } from './CreateObjectiveForm';
import { ObjectiveDetail } from './ObjectiveDetail';

export function ObjectivesList() {
  const { data: objectives, isLoading, error, remove } = useObjectives();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);

  const getStatusColor = (status: Objective['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: Objective['status']) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Rascunho';
    }
  };

  const calculateProgress = (objective: Objective) => {
    if (!objective.keyResults || objective.keyResults.length === 0) {
      return 0;
    }
    
    const totalProgress = objective.keyResults.reduce((sum, kr) => {
      const progress = kr.targetValue > 0 ? (kr.currentValue / kr.targetValue) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);
    
    return Math.round(totalProgress / objective.keyResults.length);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este objetivo?')) {
      try {
        remove(id);
      } catch (error) {
        console.error('Error deleting objective:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Carregando objetivos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <span>Erro ao carregar objetivos: {error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showCreateForm) {
    return (
      <CreateObjectiveForm
        onSuccess={() => setShowCreateForm(false)}
        onCancel={() => setShowCreateForm(false)}
      />
    );
  }

  if (selectedObjective) {
    return (
      <ObjectiveDetail
        objectiveId={selectedObjective.id}
        onBack={() => setSelectedObjective(null)}
      />
    );
  }

  if (objectives.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum objetivo criado</h3>
            <p className="text-muted-foreground mb-4">
              Comece definindo seus objetivos estratégicos para o trimestre
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Objetivo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Seus Objetivos</h2>
          <p className="text-muted-foreground">
            {objectives.length} objetivo{objectives.length !== 1 ? 's' : ''} definido{objectives.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Objetivo
        </Button>
      </div>

      {/* Objectives Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {objectives.map((objective) => {
          const progress = calculateProgress(objective);
          
          return (
            <Card key={objective.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2 mb-2">
                      {objective.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{objective.quarter}</span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(objective.status)}>
                    {getStatusLabel(objective.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Description */}
                {objective.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {objective.description}
                  </p>
                )}

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Key Results Count */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>
                    {objective.keyResults?.length || 0} Key Result{(objective.keyResults?.length || 0) !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedObjective(objective)}
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Ver Detalhes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(objective.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 