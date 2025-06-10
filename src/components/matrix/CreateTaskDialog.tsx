'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useEisenhowerTasks } from '@/lib/hooks/useLocalStorage';
import { EisenhowerQuadrant } from '@/lib/types';
import { toast } from 'sonner';

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultQuadrant?: EisenhowerQuadrant | null;
}

export function CreateTaskDialog({ open, onOpenChange, defaultQuadrant }: CreateTaskDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState([3]);
  const [importance, setImportance] = useState([3]);
  const [status, setStatus] = useState<'pending' | 'in-progress' | 'completed'>('pending');
  const [dueDate, setDueDate] = useState('');

  const { create } = useEisenhowerTasks();

  // Calcular quadrante baseado em urgência e importância
  const calculateQuadrant = (urgencyValue: number, importanceValue: number): EisenhowerQuadrant => {
    const isUrgent = urgencyValue >= 3;
    const isImportant = importanceValue >= 3;
    
    if (isUrgent && isImportant) return 'urgent-important';
    if (!isUrgent && isImportant) return 'not-urgent-important';
    if (isUrgent && !isImportant) return 'urgent-not-important';
    return 'not-urgent-not-important';
  };

  // Definir valores baseado no quadrante padrão
  useEffect(() => {
    if (defaultQuadrant && open) {
      switch (defaultQuadrant) {
        case 'urgent-important':
          setUrgency([4]);
          setImportance([4]);
          break;
        case 'not-urgent-important':
          setUrgency([2]);
          setImportance([4]);
          break;
        case 'urgent-not-important':
          setUrgency([4]);
          setImportance([2]);
          break;
        case 'not-urgent-not-important':
          setUrgency([2]);
          setImportance([2]);
          break;
      }
    }
  }, [defaultQuadrant, open]);

  const currentQuadrant = calculateQuadrant(urgency[0], importance[0]);

  const getQuadrantInfo = (quadrant: EisenhowerQuadrant) => {
    switch (quadrant) {
      case 'urgent-important':
        return { name: 'Fazer Agora', color: 'text-red-600', bg: 'bg-red-50' };
      case 'not-urgent-important':
        return { name: 'Agendar', color: 'text-blue-600', bg: 'bg-blue-50' };
      case 'urgent-not-important':
        return { name: 'Delegar', color: 'text-yellow-600', bg: 'bg-yellow-50' };
      case 'not-urgent-not-important':
        return { name: 'Eliminar', color: 'text-gray-600', bg: 'bg-gray-50' };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const newTask = {
      title: title.trim(),
      description: description.trim() || undefined,
      quadrant: currentQuadrant,
      urgency: urgency[0],
      importance: importance[0],
      status,
      dueDate: dueDate ? new Date(dueDate) : undefined,
    };

    create(newTask);
    toast.success('Tarefa criada com sucesso');
    
    // Reset form
    setTitle('');
    setDescription('');
    setUrgency([3]);
    setImportance([3]);
    setStatus('pending');
    setDueDate('');
    onOpenChange(false);
  };

  const quadrantInfo = getQuadrantInfo(currentQuadrant);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Tarefa</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Revisar relatório mensal"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes sobre a tarefa..."
              rows={3}
            />
          </div>

          {/* Urgência */}
          <div className="space-y-3">
            <Label>Urgência: {urgency[0]}/5</Label>
            <Slider
              value={urgency}
              onValueChange={setUrgency}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Baixa</span>
              <span>Média</span>
              <span>Alta</span>
            </div>
          </div>

          {/* Importância */}
          <div className="space-y-3">
            <Label>Importância: {importance[0]}/5</Label>
            <Slider
              value={importance}
              onValueChange={setImportance}
              max={5}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Baixa</span>
              <span>Média</span>
              <span>Alta</span>
            </div>
          </div>

          {/* Quadrante calculado */}
          <div className={`p-3 rounded-lg ${quadrantInfo.bg} border`}>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${quadrantInfo.color.replace('text-', 'bg-')}`} />
              <span className={`font-medium ${quadrantInfo.color}`}>
                Quadrante: {quadrantInfo.name}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(value: 'pending' | 'in-progress' | 'completed') => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in-progress">Em andamento</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data limite */}
            <div className="space-y-2">
              <Label htmlFor="dueDate">Data Limite</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Criar Tarefa
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 