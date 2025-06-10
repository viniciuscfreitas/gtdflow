'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateKeyResultSchema, type CreateKeyResultInput } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Target } from 'lucide-react';
import { useFirestoreKeyResults, useFirestoreObjectives } from '@/lib/hooks/useFirestoreOKRs';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateKeyResultFormProps {
  objectiveId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateKeyResultForm({ objectiveId, onSuccess, onCancel }: CreateKeyResultFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { create } = useFirestoreKeyResults(user);
  const { update, getById } = useFirestoreObjectives(user);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateKeyResultInput>({
    resolver: zodResolver(CreateKeyResultSchema),
    defaultValues: {
      objectiveId,
      status: 'not-started',
      currentValue: 0,
    },
  });

  const objective = getById(objectiveId);

  const onSubmit = async (data: CreateKeyResultInput) => {
    setIsSubmitting(true);
    try {
      // Create the key result
      const newKeyResult = create(data);
      
      // Update the objective to include this key result
      if (objective) {
        const updatedKeyResults = [...(objective.keyResults || []), newKeyResult];
        update(objectiveId, { keyResults: updatedKeyResults });
      }
      
      toast.success('Key Result criado com sucesso!');
      reset();
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao criar Key Result');
      console.error('Error creating key result:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!objective) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-700">Objetivo não encontrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Novo Key Result
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Para: {objective.title}
            </p>
          </div>
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title">Título do Key Result *</Label>
            <Input
              id="title"
              placeholder="Ex: Aumentar vendas em 25%"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Descreva como este resultado será medido..."
              rows={3}
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Valores e Unidade */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetValue">Meta *</Label>
              <Input
                id="targetValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="100"
                {...register('targetValue', { valueAsNumber: true })}
                className={errors.targetValue ? 'border-red-500' : ''}
              />
              {errors.targetValue && (
                <p className="text-sm text-red-500">{errors.targetValue.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentValue">Valor Atual</Label>
              <Input
                id="currentValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                {...register('currentValue', { valueAsNumber: true })}
                className={errors.currentValue ? 'border-red-500' : ''}
              />
              {errors.currentValue && (
                <p className="text-sm text-red-500">{errors.currentValue.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidade *</Label>
              <Input
                id="unit"
                placeholder="vendas, %, pontos..."
                {...register('unit')}
                className={errors.unit ? 'border-red-500' : ''}
              />
              {errors.unit && (
                <p className="text-sm text-red-500">{errors.unit.message}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(value: 'not-started' | 'in-progress' | 'completed' | 'at-risk') => 
                setValue('status', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not-started">Não Iniciado</SelectItem>
                <SelectItem value="in-progress">Em Progresso</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="at-risk">Em Risco</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview do Progresso */}
          {watch('targetValue') > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">📊 Preview do Progresso</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso atual:</span>
                  <span className="font-medium">
                    {Math.round((watch('currentValue') || 0) / watch('targetValue') * 100)}%
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min(Math.round((watch('currentValue') || 0) / watch('targetValue') * 100), 100)}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-blue-700">
                  {watch('currentValue') || 0} de {watch('targetValue')} {watch('unit')}
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Criando...' : 'Criar Key Result'}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 