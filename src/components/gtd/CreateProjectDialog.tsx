'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  FolderOpen, 
  Calendar,
  Target
} from 'lucide-react';
import { useGTDItems } from '@/lib/hooks/useLocalStorage';
import { toast } from 'sonner';

const CreateProjectSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  outcome: z.string().optional(),
});

type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

interface CreateProjectDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateProjectDialog({ onClose, onSuccess }: CreateProjectDialogProps) {
  const { create } = useGTDItems();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProjectSchema),
  });

  const onSubmit = async (data: CreateProjectInput) => {
    setIsSubmitting(true);
    try {
      const newProject = {
        title: data.title,
        description: data.description,
        type: 'project' as const,
        status: 'active' as const,
        energy: 'medium' as const,
        tags: [],
      };
      
      create(newProject);
      onSuccess();
    } catch (error) {
      toast.error('Erro ao criar projeto');
      console.error('Error creating project:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Criar Novo Projeto
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Nome do Projeto *</Label>
            <Input
              id="title"
              placeholder="Ex: Lançar novo produto"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Descreva o resultado final que você quer alcançar
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Detalhes sobre o projeto, contexto, motivação..."
              rows={4}
              {...register('description')}
            />
            <p className="text-xs text-muted-foreground">
              Adicione contexto que ajude a entender o projeto
            </p>
          </div>

          {/* Outcome */}
          <div className="space-y-2">
            <Label htmlFor="outcome" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Resultado Esperado (opcional)
            </Label>
            <Textarea
              id="outcome"
              placeholder="Como você saberá que o projeto foi concluído com sucesso?"
              rows={3}
              {...register('outcome')}
            />
            <p className="text-xs text-muted-foreground">
              Defina critérios claros de sucesso para o projeto
            </p>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Data Limite (opcional)
            </Label>
            <Input
              id="dueDate"
              type="date"
              {...register('dueDate')}
            />
            <p className="text-xs text-muted-foreground">
              Quando este projeto precisa estar concluído?
            </p>
          </div>

          {/* GTD Project Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">💡 Dicas para Projetos GTD</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p>• <strong>Resultado específico:</strong> O que exatamente você quer alcançar?</p>
              <p>• <strong>Múltiplas ações:</strong> Se precisa de mais de uma ação, é um projeto</p>
              <p>• <strong>Próxima ação:</strong> Sempre defina a primeira ação concreta</p>
              <p>• <strong>Revisão regular:</strong> Revise semanalmente o progresso</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Criando...' : 'Criar Projeto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 