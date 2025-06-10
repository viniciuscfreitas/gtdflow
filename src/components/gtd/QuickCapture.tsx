'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreateGTDItemSchema, type CreateGTDItemInput } from '@/lib/schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Inbox, Plus, Send } from 'lucide-react';
import { useGTDItems } from '@/lib/hooks/useLocalStorage';
import { toast } from 'sonner';

interface QuickCaptureProps {
  onSuccess?: () => void;
  compact?: boolean;
}

export function QuickCapture({ onSuccess, compact = false }: QuickCaptureProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(!compact);
  const { create } = useGTDItems();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CreateGTDItemInput>({
    resolver: zodResolver(CreateGTDItemSchema),
    defaultValues: {
      type: 'inbox',
      status: 'active',
      energy: 'medium',
      tags: [],
    },
  });

  const onSubmit = async (data: CreateGTDItemInput) => {
    setIsSubmitting(true);
    try {
      create(data);
      
      toast.success('Item capturado no inbox!');
      reset();
      onSuccess?.();
      
      if (compact) {
        setIsExpanded(false);
      }
    } catch (error) {
      toast.error('Erro ao capturar item');
      console.error('Error creating GTD item:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSubmit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(onSubmit)();
    }
  };

  if (compact && !isExpanded) {
    return (
      <Card className="border-dashed border-2 hover:border-primary/50 transition-colors cursor-pointer">
        <CardContent 
          className="pt-6 text-center"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <Plus className="h-5 w-5" />
            <span>Capturar ideia rapidamente...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? 'border-primary' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Inbox className="h-5 w-5" />
          Captura Rápida
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Capture qualquer ideia, tarefa ou pensamento aqui. Organize depois.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Título */}
          <div className="space-y-2">
            <Input
              placeholder="O que está na sua mente? (Cmd/Ctrl + Enter para enviar)"
              {...register('title')}
              className={errors.title ? 'border-red-500' : ''}
              onKeyDown={handleQuickSubmit}
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Descrição expandida (opcional) */}
          {watch('title') && watch('title').length > 0 && (
            <div className="space-y-2">
              <Textarea
                placeholder="Adicione mais detalhes se necessário..."
                rows={3}
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || !watch('title')}
              className="flex-1"
            >
              {isSubmitting ? (
                'Capturando...'
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Capturar no Inbox
                </>
              )}
            </Button>
            
            {compact && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpanded(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
            )}
          </div>

          {/* Quick tip */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            💡 <strong>Dica:</strong> Não se preocupe em organizar agora. O objetivo é capturar tudo que vem à mente.
            Use Cmd/Ctrl + Enter para enviar rapidamente.
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 