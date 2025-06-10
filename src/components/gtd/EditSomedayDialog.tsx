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
  Clock,
  Tag,
  Lightbulb
} from 'lucide-react';
import { useGTDItems } from '@/lib/hooks/useLocalStorage';
import { toast } from 'sonner';
import { GTDItem } from '@/lib/types';

const EditSomedaySchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  area: z.string().optional(),
  tags: z.string().optional(), // Como string separada por vírgulas
});

type EditSomedayInput = z.infer<typeof EditSomedaySchema>;

interface EditSomedayDialogProps {
  somedayId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditSomedayDialog({ somedayId, onClose, onSuccess }: EditSomedayDialogProps) {
  const { data: gtdItems, update } = useGTDItems();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const somedayItem = gtdItems.find((item: GTDItem) => item.id === somedayId);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditSomedayInput>({
    resolver: zodResolver(EditSomedaySchema),
  });

  // Load someday item data when component mounts
  useEffect(() => {
    if (somedayItem) {
      reset({
        title: somedayItem.title || '',
        description: somedayItem.description || '',
        area: somedayItem.area || '',
        tags: somedayItem.tags ? somedayItem.tags.join(', ') : '',
      });
    }
  }, [somedayItem, reset]);

  const onSubmit = async (data: EditSomedayInput) => {
    setIsSubmitting(true);
    try {
      const updatedSomeday = {
        title: data.title,
        description: data.description,
        area: data.area || undefined,
        tags: data.tags 
          ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
          : [],
      };
      
      update(somedayId, updatedSomeday);
      toast.success('Item atualizado com sucesso!');
      onSuccess();
    } catch (error) {
      toast.error('Erro ao atualizar item');
      console.error('Error updating someday item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!somedayItem) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Editar Item &quot;Talvez/Algum Dia&quot;
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Ideia ou Projeto *</Label>
            <Input
              id="title"
              placeholder="Ex: Aprender francês, Viajar para o Japão"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Descreva brevemente a ideia ou projeto que você pode querer fazer no futuro
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição Detalhada</Label>
            <Textarea
              id="description"
              placeholder="Detalhes sobre a ideia, motivação, possíveis primeiros passos..."
              rows={4}
              {...register('description')}
            />
            <p className="text-xs text-muted-foreground">
              Inclua informações que ajudem você a lembrar por que isso é interessante
            </p>
          </div>

          {/* Area */}
          <div className="space-y-2">
            <Label htmlFor="area" className="flex items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Área de Vida
            </Label>
            <Input
              id="area"
              placeholder="Ex: Desenvolvimento Pessoal, Viagens, Hobbies, Carreira"
              {...register('area')}
            />
            <p className="text-xs text-muted-foreground">
              Categoria ou área de vida relacionada a esta ideia
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags" className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              Tags
            </Label>
            <Input
              id="tags"
              placeholder="Ex: aprendizado, viagem, criativo, longo prazo"
              {...register('tags')}
            />
            <p className="text-xs text-muted-foreground">
              Separe as tags com vírgulas para facilitar a organização
            </p>
          </div>

          {/* GTD Tip */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-purple-900 mb-1">Dica GTD</h4>
                <p className="text-sm text-purple-800">
                  Itens &quot;Talvez/Algum Dia&quot; devem ser revisados regularmente. 
                  Quando estiver pronto para agir, use o botão &quot;Reprocessar&quot; para 
                  mover de volta ao Inbox e decidir os próximos passos.
                </p>
              </div>
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
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 