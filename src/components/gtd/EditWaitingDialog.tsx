'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2,
  Phone,
  Mail,
  MessageSquare,
  Users
} from 'lucide-react';
import { useGTDItems } from '@/lib/hooks/useLocalStorage';
import { GTDItem } from '@/lib/types';
import { toast } from 'sonner';

interface EditWaitingDialogProps {
  item: GTDItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditWaitingDialog({ item, open, onOpenChange }: EditWaitingDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [delegatedTo, setDelegatedTo] = useState('');
  const [context, setContext] = useState('@pessoa');
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [delegationType, setDelegationType] = useState<'delegated' | 'waiting' | 'external'>('delegated');

  const { update } = useGTDItems();

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setDescription(item.description || '');
      setDelegatedTo(item.stakeholder || '');
      setContext(item.context || '@pessoa');
      setEnergy(item.energy || 'medium');
      setDueDate(
        item.dueDate ? (typeof item.dueDate === 'string' ? item.dueDate : item.dueDate.toISOString().split('T')[0]) : ''
      );
      
      // Calcular data de follow-up sugerida (3 dias antes do prazo ou em 1 semana se não há prazo)
      if (item.dueDate) {
        const due = new Date(item.dueDate);
        const followUp = new Date(due.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 dias antes
        setFollowUpDate(followUp.toISOString().split('T')[0]);
      } else {
        const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        setFollowUpDate(nextWeek.toISOString().split('T')[0]);
      }
      
      // Determinar tipo baseado no contexto
      if (item.context?.includes('@pessoa') || item.context?.includes('@reuniao')) {
        setDelegationType('delegated');
      } else if (item.context?.includes('@email') || item.context?.includes('@telefone')) {
        setDelegationType('waiting');
      } else {
        setDelegationType('external');
      }
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (!delegatedTo.trim()) {
      toast.error('É necessário especificar para quem foi delegado ou de quem está aguardando');
      return;
    }

    const updates = {
      title: title.trim(),
      description: description.trim() || undefined,
      stakeholder: delegatedTo.trim(),
      context,
      energy,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      updatedAt: new Date(),
      // Adicionar tags para follow-up
      tags: [
        ...((item.tags || []).filter(tag => !tag.startsWith('follow-up:') && !tag.startsWith('priority:') && !tag.startsWith('type:'))),
        followUpDate ? `follow-up:${followUpDate}` : '',
        `priority:${priority}`,
        `type:${delegationType}`
      ].filter(Boolean)
    };

    update(item.id, updates);
    toast.success('Item de delegação atualizado com sucesso');
    onOpenChange(false);
  };

  const getDaysUntilFollowUp = () => {
    if (!followUpDate) return null;
    const today = new Date();
    const followUp = new Date(followUpDate);
    const diffTime = followUp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysUntilDue = () => {
    if (!dueDate) return null;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'delegated': return <Users className="h-4 w-4" />;
      case 'waiting': return <Clock className="h-4 w-4" />;
      case 'external': return <AlertTriangle className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Editar Item Aguardando Por / Delegação
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">O que você está aguardando? *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Resposta do João sobre aprovação do orçamento"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detalhes e contexto</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contexto adicional, o que foi solicitado, quando foi enviado..."
                rows={3}
              />
            </div>
          </div>

          <Separator />

          {/* Informações de Delegação */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações de Delegação
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delegatedTo">Delegado para / Aguardando de *</Label>
                <Input
                  id="delegatedTo"
                  value={delegatedTo}
                  onChange={(e) => setDelegatedTo(e.target.value)}
                  placeholder="Ex: João Silva, Departamento RH, Cliente X"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de delegação</Label>
                <Select value={delegationType} onValueChange={(value: 'delegated' | 'waiting' | 'external') => setDelegationType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="delegated">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Delegado (interno)
                      </div>
                    </SelectItem>
                    <SelectItem value="waiting">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Aguardando resposta
                      </div>
                    </SelectItem>
                    <SelectItem value="external">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Dependência externa
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="urgent">🔴 Urgente</SelectItem>
                    <SelectItem value="high">🟠 Alta</SelectItem>
                    <SelectItem value="medium">🟡 Média</SelectItem>
                    <SelectItem value="low">🟢 Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Contexto de follow-up</Label>
                <Select value={context} onValueChange={setContext}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="@pessoa">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        @pessoa (presencial)
                      </div>
                    </SelectItem>
                    <SelectItem value="@telefone">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        @telefone
                      </div>
                    </SelectItem>
                    <SelectItem value="@email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        @email
                      </div>
                    </SelectItem>
                    <SelectItem value="@reuniao">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        @reunião
                      </div>
                    </SelectItem>
                    <SelectItem value="@online">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        @online (chat/video)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Datas e Follow-up */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Cronograma
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Prazo final (opcional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
                {getDaysUntilDue() !== null && (
                  <p className="text-xs text-muted-foreground">
                    {getDaysUntilDue()! > 0 ? `${getDaysUntilDue()} dias restantes` : 
                     getDaysUntilDue()! === 0 ? 'Vence hoje!' : 
                     `Atrasado há ${Math.abs(getDaysUntilDue()!)} dias`}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUpDate">Data de follow-up</Label>
                <Input
                  id="followUpDate"
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                />
                {getDaysUntilFollowUp() !== null && (
                  <p className="text-xs text-muted-foreground">
                    {getDaysUntilFollowUp()! > 0 ? `Follow-up em ${getDaysUntilFollowUp()} dias` : 
                     getDaysUntilFollowUp()! === 0 ? 'Follow-up hoje!' : 
                     `Follow-up atrasado há ${Math.abs(getDaysUntilFollowUp()!)} dias`}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Energia necessária para follow-up</Label>
              <Select value={energy} onValueChange={(value: 'low' | 'medium' | 'high') => setEnergy(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Baixa - Follow-up simples</SelectItem>
                  <SelectItem value="medium">🟡 Média - Conversa necessária</SelectItem>
                  <SelectItem value="high">🔴 Alta - Negociação/pressão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview das informações */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <h5 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                Resumo da delegação
              </h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  {getTypeIcon(delegationType)}
                  <span className="font-medium">{delegatedTo || 'Não especificado'}</span>
                  <Badge className={getPriorityColor(priority)}>
                    {priority === 'urgent' ? 'Urgente' : 
                     priority === 'high' ? 'Alta' : 
                     priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  Follow-up: {followUpDate ? new Date(followUpDate).toLocaleDateString('pt-BR') : 'Não definido'} | 
                  Prazo: {dueDate ? new Date(dueDate).toLocaleDateString('pt-BR') : 'Sem prazo'}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Salvar Delegação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 