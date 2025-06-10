'use client';

import { useState, useEffect } from 'react';
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
  FileText,
  Tag
} from 'lucide-react';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';
import { GTDItem } from '@/lib/types';

const EditReferenceSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  context: z.string().optional(),
  area: z.string().optional(),
  tags: z.string().optional(), // Como string separada por vírgulas
});

type EditReferenceInput = z.infer<typeof EditReferenceSchema>;

interface EditReferenceDialogProps {
  referenceId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditReferenceDialog({ referenceId, onClose, onSuccess }: EditReferenceDialogProps) {
  const { user } = useAuth();
  const { data: gtdItems, update } = useFirestoreGTD(user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const reference = gtdItems.find((item: GTDItem) => item.id === referenceId);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditReferenceInput>({
    resolver: zodResolver(EditReferenceSchema),
  });

  // Load reference data when component mounts
  useEffect(() => {
    if (reference) {
      reset({
        title: reference.title || '',
        description: reference.description || '',
        context: reference.context || '',
        area: reference.area || '',
        tags: reference.tags ? reference.tags.join(', ') : '',
      });
    }
  }, [reference, reset]);

  const onSubmit = async (data: EditReferenceInput) => {
    setIsSubmitting(true);
    try {
      const updatedReference = {
        title: data.title,
        description: data.description,
        context: data.context || undefined,
        area: data.area || undefined,
        tags: data.tags 
          ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
          : [],
      };
      
      update(referenceId, updatedReference);
      toast.success('Referência atualizada com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao atualizar referência');
      console.error('Error updating reference:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!reference) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Editar Referência
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Manual do usuário do sistema"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Detalhes sobre o conteúdo da referência..."
              rows={4}
              {...register('description')}
            />
            <p className="text-xs text-muted-foreground">
              Inclua informações que ajudem a encontrar e usar esta referência no futuro
            </p>
          </div>

          {/* Context and Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Context */}
            <div className="space-y-2">
              <Label htmlFor="context">Contexto</Label>
              <Input
                id="context"
                placeholder="Ex: @documentos, @links"
                {...register('context')}
              />
              <p className="text-xs text-muted-foreground">
                Onde ou como acessar esta referência
              </p>
            </div>

            {/* Area */}
            <div className="space-y-2">
              <Label htmlFor="area">Área</Label>
              <Input
                id="area"
                placeholder="Ex: Trabalho, Pessoal, Estudos"
                {...register('area')}
              />
              <p className="text-xs text-muted-foreground">
                Categoria ou área de vida relacionada
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Tags
            </Label>
            <Input
              id="tags"
              placeholder="Ex: manual, tutorial, importante"
              {...register('tags')}
            />
            <p className="text-xs text-muted-foreground">
              Separe as tags com vírgulas para facilitar a busca
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
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 