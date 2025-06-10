'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateObjectiveSchema, type CreateObjectiveInput } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { useFirestoreObjectives } from '@/lib/hooks/useFirestoreOKRs';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';

interface CreateObjectiveFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateObjectiveForm({ onSuccess, onCancel }: CreateObjectiveFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { create } = useFirestoreObjectives(user);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<CreateObjectiveInput>({
    resolver: zodResolver(CreateObjectiveSchema),
    defaultValues: {
      status: 'draft',
      year: new Date().getFullYear(),
      quarter: `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`,
    },
  });

  const currentYear = new Date().getFullYear();
  const quarters = [
    `Q1 ${currentYear}`,
    `Q2 ${currentYear}`,
    `Q3 ${currentYear}`,
    `Q4 ${currentYear}`,
    `Q1 ${currentYear + 1}`,
    `Q2 ${currentYear + 1}`,
  ];

  const onSubmit = async (data: CreateObjectiveInput) => {
    setIsSubmitting(true);
    try {
      create({
        ...data,
        keyResults: [], // Inicialmente sem key results
      });
      
      toast.success('Objetivo criado com sucesso!');
      reset();
      onSuccess?.();
    } catch (error) {
      toast.error('Erro ao criar objetivo');
      console.error('Error creating objective:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Criar Novo Objetivo</CardTitle>
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
            <Label htmlFor="title">Título do Objetivo *</Label>
            <Input
              id="title"
              placeholder="Ex: Aumentar a produtividade pessoal"
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
              placeholder="Descreva o objetivo em mais detalhes..."
              rows={3}
              {...register('description')}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description.message}</p>
            )}
          </div>

          {/* Quarter e Ano */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quarter">Trimestre *</Label>
              <Select
                value={watch('quarter')}
                onValueChange={(value) => setValue('quarter', value)}
              >
                <SelectTrigger className={errors.quarter ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o trimestre" />
                </SelectTrigger>
                <SelectContent>
                  {quarters.map((quarter) => (
                    <SelectItem key={quarter} value={quarter}>
                      {quarter}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.quarter && (
                <p className="text-sm text-red-500">{errors.quarter.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="year">Ano *</Label>
              <Select
                value={watch('year')?.toString()}
                onValueChange={(value) => setValue('year', parseInt(value))}
              >
                <SelectTrigger className={errors.year ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={currentYear.toString()}>{currentYear}</SelectItem>
                  <SelectItem value={(currentYear + 1).toString()}>{currentYear + 1}</SelectItem>
                </SelectContent>
              </Select>
              {errors.year && (
                <p className="text-sm text-red-500">{errors.year.message}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={watch('status')}
              onValueChange={(value: 'draft' | 'active' | 'completed' | 'cancelled') => 
                setValue('status', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Rascunho</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Info sobre Key Results */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2">📊 Próximo passo</h4>
            <p className="text-sm text-blue-700">
              Após criar o objetivo, você poderá adicionar Key Results (resultados-chave) 
              para medir o progresso de forma específica e mensurável.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Criando...' : 'Criar Objetivo'}
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