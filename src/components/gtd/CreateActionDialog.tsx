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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, 
  Calendar,
  User,
  Zap,
  Clock
} from 'lucide-react';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';

const CreateActionSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  context: z.string().min(1, 'Contexto é obrigatório'),
  energy: z.enum(['low', 'medium', 'high']),
  estimatedTime: z.number().optional(),
  dueDate: z.string().optional(),
  delegatedTo: z.string().optional(),
});

type CreateActionInput = z.infer<typeof CreateActionSchema>;

interface CreateActionDialogProps {
  onClose: () => void;
  onSuccess: () => void;
  projectId?: string;
}

export function CreateActionDialog({ onClose, onSuccess, projectId }: CreateActionDialogProps) {
  const { user } = useAuth();
  const { create } = useFirestoreGTD(user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreateActionInput>({
    resolver: zodResolver(CreateActionSchema),
    defaultValues: {
      energy: 'medium',
      context: '',
    },
  });

  const onSubmit = async (data: CreateActionInput) => {
    setIsSubmitting(true);
    try {
      const newAction = {
        title: data.title,
        description: data.description,
        type: 'next-action' as const,
        status: 'active' as const,
        context: data.context,
        energy: data.energy || 'medium' as const,
        estimatedTime: data.estimatedTime,
        projectId: projectId,
        tags: [],
        ...(data.dueDate && data.dueDate.trim() !== '' ? { dueDate: new Date(data.dueDate) } : {})
      };
      
      create(newAction);
      onSuccess();
    } catch (error) {
      toast.error('Erro ao criar ação');
      console.error('Error creating action:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Criar Nova Ação
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Próxima Ação *</Label>
            <Input
              id="title"
              placeholder="Ex: Ligar para João sobre o projeto"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Descreva uma ação específica e executável
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Detalhes adicionais sobre a ação..."
              rows={3}
              {...register('description')}
            />
          </div>

          {/* Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Contexto *</Label>
            <Select onValueChange={(value) => setValue('context', value)} {...register('context')}>
              <SelectTrigger className={errors.context ? 'border-red-500' : ''}>
                <SelectValue placeholder="Onde/quando fazer esta ação?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="@computer">@computador</SelectItem>
                <SelectItem value="@phone">@telefone</SelectItem>
                <SelectItem value="@office">@escritório</SelectItem>
                <SelectItem value="@home">@casa</SelectItem>
                <SelectItem value="@errands">@rua</SelectItem>
                <SelectItem value="@meeting">@reunião</SelectItem>
                <SelectItem value="@online">@online</SelectItem>
                <SelectItem value="@anywhere">@qualquer lugar</SelectItem>
              </SelectContent>
            </Select>
            {errors.context && (
              <p className="text-sm text-red-500">{errors.context.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Contexto ajuda a agrupar ações por local ou situação
            </p>
          </div>

          {/* Energy Level */}
          <div className="space-y-3">
            <Label>Nível de Energia Necessário</Label>
            <RadioGroup
              value={watch('energy')}
              onValueChange={(value) => setValue('energy', value as 'low' | 'medium' | 'high')}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="flex items-center gap-2 cursor-pointer">
                  <Zap className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">Baixa</div>
                    <div className="text-xs text-muted-foreground">Tarefas simples</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="flex items-center gap-2 cursor-pointer">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <div>
                    <div className="font-medium">Média</div>
                    <div className="text-xs text-muted-foreground">Tarefas normais</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="flex items-center gap-2 cursor-pointer">
                  <Zap className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="font-medium">Alta</div>
                    <div className="text-xs text-muted-foreground">Tarefas complexas</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Additional Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Estimated Time */}
            <div className="space-y-2">
              <Label htmlFor="estimatedTime" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Tempo Estimado (min)
              </Label>
              <Input
                id="estimatedTime"
                type="number"
                placeholder="Ex: 30"
                {...register('estimatedTime', { valueAsNumber: true })}
              />
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
            </div>
          </div>

          {/* Delegation */}
          <div className="space-y-2">
            <Label htmlFor="delegatedTo" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              Delegado para (opcional)
            </Label>
            <Input
              id="delegatedTo"
              placeholder="Nome da pessoa responsável"
              {...register('delegatedTo')}
            />
            <p className="text-xs text-muted-foreground">
              Se delegado, esta ação irá para a lista &quot;Aguardando Por&quot;
            </p>
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
              {isSubmitting ? 'Criando...' : 'Criar Ação'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 