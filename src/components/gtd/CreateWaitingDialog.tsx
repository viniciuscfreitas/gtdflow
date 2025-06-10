'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useGTDItems } from '@/lib/hooks/useLocalStorage';
import { GTDItem } from '@/lib/types';
import { toast } from 'sonner';

interface CreateWaitingDialogProps {
  trigger?: React.ReactNode;
}

export function CreateWaitingDialog({ trigger }: CreateWaitingDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('@pessoa');
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');


  const { create } = useGTDItems();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const newItem: Omit<GTDItem, 'id' | 'createdAt' | 'updatedAt'> = {
      title: title.trim(),
      description: description.trim() || undefined,
      type: 'waiting-for',
      status: 'active',
      context,
      energy,
      tags: [],
    };

    create(newItem);
    toast.success('Item adicionado à lista "Aguardando"');
    
    // Reset form
    setTitle('');
    setDescription('');
    setContext('@pessoa');
    setEnergy('medium');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Item à Lista &quot;Aguardando&quot;</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Resposta do João sobre o projeto"
              required
            />
          </div>



          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre o que você está aguardando..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Contexto</Label>
              <Select value={context} onValueChange={setContext}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="@pessoa">@pessoa</SelectItem>
                  <SelectItem value="@telefone">@telefone</SelectItem>
                  <SelectItem value="@email">@email</SelectItem>
                  <SelectItem value="@trabalho">@trabalho</SelectItem>
                  <SelectItem value="@casa">@casa</SelectItem>
                  <SelectItem value="@online">@online</SelectItem>
                  <SelectItem value="@reuniao">@reunião</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível de Energia</Label>
              <Select value={energy} onValueChange={(value: 'low' | 'medium' | 'high') => setEnergy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>



          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Adicionar Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 