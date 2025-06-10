'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowRight, 
  Calendar, 
  Archive, 
  Trash2, 
  Target,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useFirestoreMatrix } from '@/lib/hooks/useFirestoreMatrix';
import { useAuth } from '@/lib/contexts/AuthContext';
import { GTDItem, EisenhowerQuadrant } from '@/lib/types';
import { toast } from 'sonner';

interface ProcessItemDialogProps {
  itemId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProcessItemDialog({ itemId, onClose, onSuccess }: ProcessItemDialogProps) {
  const { user } = useAuth();
  const { data: gtdItems, update, remove } = useFirestoreGTD(user);
  const { create: createEisenhowerTask } = useFirestoreMatrix(user);
  
  const item = gtdItems.find((item: GTDItem) => item.id === itemId);
  
  const [step, setStep] = useState<'clarify' | 'organize' | 'prioritize'>('clarify');
  const [actionType, setActionType] = useState<'action' | 'project' | 'reference' | 'someday' | 'delete' | ''>('');
  
  // Form data
  const [title, setTitle] = useState(item?.title || '');
  const [description, setDescription] = useState(item?.description || '');
  const [context, setContext] = useState('@geral');
  const [energy, setEnergy] = useState<'low' | 'medium' | 'high'>('medium');
  const [dueDate, setDueDate] = useState(
    item?.dueDate ? (typeof item.dueDate === 'string' ? item.dueDate : item.dueDate.toISOString().split('T')[0]) : ''
  );
  
  // Eisenhower Matrix data
  const [urgency, setUrgency] = useState([3]);
  const [importance, setImportance] = useState([3]);

  if (!item) {
    return null;
  }

  const getQuadrantFromValues = (urgencyVal: number, importanceVal: number): EisenhowerQuadrant => {
    const isUrgent = urgencyVal >= 3;
    const isImportant = importanceVal >= 3;
    
    if (isUrgent && isImportant) return 'urgent-important';
    if (!isUrgent && isImportant) return 'not-urgent-important';
    if (isUrgent && !isImportant) return 'urgent-not-important';
    return 'not-urgent-not-important';
  };

  const getQuadrantInfo = (quadrant: EisenhowerQuadrant) => {
    const info = {
      'urgent-important': {
        name: 'Fazer Agora',
        description: 'Urgente + Importante',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: AlertTriangle,
        advice: 'Faça imediatamente. São crises ou deadlines importantes.'
      },
      'not-urgent-important': {
        name: 'Agendar',
        description: 'Importante, mas não urgente',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: Calendar,
        advice: 'Planeje e agende. Foco no crescimento e prevenção.'
      },
      'urgent-not-important': {
        name: 'Delegar',
        description: 'Urgente, mas não importante',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: ArrowRight,
        advice: 'Delegue se possível. São interrupções e urgências dos outros.'
      },
      'not-urgent-not-important': {
        name: 'Eliminar',
        description: 'Nem urgente nem importante',
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        icon: Trash2,
        advice: 'Elimine ou minimize. São distrações e perda de tempo.'
      }
    };
    return info[quadrant];
  };

  const handleClarify = (type: typeof actionType) => {
    setActionType(type);
    if (type === 'delete') {
      // Only delete skips organize step
      handleComplete(type);
    } else {
      // All other types go to organize step
      setStep('organize');
    }
  };

  const handleOrganize = () => {
    if (actionType === 'action') {
      setStep('prioritize');
    } else {
      // reference, someday, project go directly to completion after organize
      handleComplete(actionType);
    }
  };

  const handleComplete = async (finalType?: typeof actionType) => {
    const type = finalType || actionType;
    

    
    try {
      switch (type) {
        case 'delete':
          await remove(item.id);
          toast.success('Item excluído');
          break;
          
        case 'reference':
          await update(item.id, {
            type: 'reference',
            status: 'active',
            title,
            description
          });
          toast.success('Item arquivado como referência');
          break;
          
        case 'someday':
          await update(item.id, {
            type: 'someday-maybe',
            status: 'active',
            title,
            description
          });
          toast.success('Item movido para Algum Dia/Talvez');
          break;
          
        case 'project':
          const projectData: Partial<GTDItem> = {
            type: 'project',
            status: 'active',
            title,
            description
          };
          
          // Só adicionar dueDate se não for vazio
          if (dueDate && dueDate.trim() !== '') {
            projectData.dueDate = new Date(dueDate);
          }
          
          await update(item.id, projectData);
          toast.success('Projeto criado');
          break;
          
        case 'action':
          // Determine quadrant first to decide GTD type
          const quadrant = getQuadrantFromValues(urgency[0], importance[0]);
          
          // If it's "Delegate" quadrant, create as waiting-for, otherwise as next-action
          const gtdType = quadrant === 'urgent-not-important' ? 'waiting-for' : 'next-action';
          
          // Update GTD item
          const updateData: Partial<GTDItem> = {
            type: gtdType,
            status: 'active',
            title,
            description,
            context,
            energy
          };
          
          // Só adicionar dueDate se não for vazio
          if (dueDate && dueDate.trim() !== '') {
            updateData.dueDate = new Date(dueDate);
          }
          
          await update(item.id, updateData);
          
          // Add to Eisenhower Matrix
          const matrixTaskData = {
            gtdItemId: item.id,
            title,
            description,
            quadrant,
            urgency: urgency[0],
            importance: importance[0],
            status: 'pending' as const,
            ...(dueDate && dueDate.trim() !== '' ? { dueDate: new Date(dueDate) } : {})
          };
          
          await createEisenhowerTask(matrixTaskData);
          
          const quadrantInfo = getQuadrantInfo(quadrant);
          const gtdTypeLabel = gtdType === 'waiting-for' ? 'Aguardando Por' : 'Próximas Ações';
          
          toast.success('✅ Ação criada e priorizada!', {
            description: `GTD: ${gtdTypeLabel} | Matriz: ${quadrantInfo.name}`
          });
          break;
      }
      
      onSuccess();
    } catch (error) {
      toast.error('Erro ao processar item');
      console.error('Error processing item:', error);
    }
  };

  const currentQuadrant = getQuadrantFromValues(urgency[0], importance[0]);
  const quadrantInfo = getQuadrantInfo(currentQuadrant);
  const QuadrantIcon = quadrantInfo.icon;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Processar Item do Inbox
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Preview */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-2">{item.title}</h4>
              {item.description && (
                <p className="text-sm text-muted-foreground">{item.description}</p>
              )}
            </CardContent>
          </Card>

          {/* Step 1: Clarify */}
          {step === 'clarify' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">1</div>
                <h3 className="font-semibold">Esclarecer: O que é isso?</h3>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => handleClarify('action')}
                >
                  <CheckCircle2 className="h-5 w-5 mr-3 text-green-600" />
                  <div className="text-left">
                    <div className="font-medium">É uma ação</div>
                    <div className="text-sm text-muted-foreground">Algo específico que posso fazer</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => handleClarify('project')}
                >
                  <Target className="h-5 w-5 mr-3 text-blue-600" />
                  <div className="text-left">
                    <div className="font-medium">É um projeto</div>
                    <div className="text-sm text-muted-foreground">Requer múltiplas ações para completar</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => handleClarify('reference')}
                >
                  <Archive className="h-5 w-5 mr-3 text-purple-600" />
                  <div className="text-left">
                    <div className="font-medium">É referência</div>
                    <div className="text-sm text-muted-foreground">Informação para consulta futura</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => handleClarify('someday')}
                >
                  <Clock className="h-5 w-5 mr-3 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">Algum dia/talvez</div>
                    <div className="text-sm text-muted-foreground">Pode ser interessante no futuro</div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto p-4 justify-start"
                  onClick={() => handleClarify('delete')}
                >
                  <Trash2 className="h-5 w-5 mr-3 text-red-600" />
                  <div className="text-left">
                    <div className="font-medium">Não é relevante</div>
                    <div className="text-sm text-muted-foreground">Pode ser excluído</div>
                  </div>
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Organize */}
          {step === 'organize' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">2</div>
                <h3 className="font-semibold">
                  Organizar: {actionType === 'action' ? 'Como fazer?' : 
                             actionType === 'project' ? 'Definir projeto' :
                             actionType === 'reference' ? 'Organizar referência' :
                             actionType === 'someday' ? 'Definir item' : 'Organizar'}
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">
                    {actionType === 'action' ? 'Título da ação' : 
                     actionType === 'project' ? 'Nome do projeto' :
                     actionType === 'reference' ? 'Título da referência' :
                     actionType === 'someday' ? 'Título do item' : 'Título'}
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={
                      actionType === 'action' ? 'Ex: Ligar para João sobre o projeto' :
                      actionType === 'project' ? 'Ex: Renovar site da empresa' :
                      actionType === 'reference' ? 'Ex: Manual do software X' :
                      actionType === 'someday' ? 'Ex: Aprender francês' : 'Digite o título...'
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detalhes adicionais..."
                    rows={3}
                  />
                </div>

                {actionType === 'action' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="context">Contexto</Label>
                        <Select value={context} onValueChange={setContext}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="@geral">@geral</SelectItem>
                            <SelectItem value="@casa">@casa</SelectItem>
                            <SelectItem value="@trabalho">@trabalho</SelectItem>
                            <SelectItem value="@telefone">@telefone</SelectItem>
                            <SelectItem value="@computador">@computador</SelectItem>
                            <SelectItem value="@compras">@compras</SelectItem>
                            <SelectItem value="@agenda">@agenda</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="energy">Energia necessária</Label>
                        <Select value={energy} onValueChange={(value: 'low' | 'medium' | 'high') => setEnergy(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-green-500" />
                                Baixa
                              </div>
                            </SelectItem>
                            <SelectItem value="medium">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-yellow-500" />
                                Média
                              </div>
                            </SelectItem>
                            <SelectItem value="high">
                              <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-red-500" />
                                Alta
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="dueDate">Data limite (opcional)</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {actionType === 'project' && (
                  <div>
                    <Label htmlFor="dueDate">Data limite do projeto (opcional)</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setStep('clarify')} variant="outline">
                  Voltar
                </Button>
                <Button onClick={handleOrganize} className="flex-1">
                  {actionType === 'action' ? 'Continuar para Priorização' : 'Finalizar'}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Prioritize (only for actions) */}
          {step === 'prioritize' && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">3</div>
                <h3 className="font-semibold">Priorizar: Quão importante e urgente?</h3>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Priorização na Matriz de Eisenhower</p>
                      <p>Defina a importância e urgência para classificar esta ação na Matriz.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6 p-4 border rounded-lg bg-gray-50">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">
                      Urgência: {urgency[0]}/5
                      <span className="text-muted-foreground ml-2">
                        (Precisa ser feito agora?)
                      </span>
                    </Label>
                    <Slider
                      value={urgency}
                      onValueChange={setUrgency}
                      max={5}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Pode esperar</span>
                      <span>Muito urgente</span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Importância: {importance[0]}/5
                      <span className="text-muted-foreground ml-2">
                        (Contribui para seus objetivos?)
                      </span>
                    </Label>
                    <Slider
                      value={importance}
                      onValueChange={setImportance}
                      max={5}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Pouco importante</span>
                      <span>Muito importante</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <Card className={`border-2 ${quadrantInfo.color}`}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      <QuadrantIcon className="h-6 w-6" />
                      <div>
                        <div className="font-semibold">{quadrantInfo.name}</div>
                        <div className="text-sm">{quadrantInfo.description}</div>
                        <div className="text-sm mt-1 opacity-90">{quadrantInfo.advice}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* GTD Integration Info */}
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Target className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-green-800">
                        <p className="font-medium mb-1">Integração GTD</p>
                        <p>
                          Esta ação será criada em: <strong>
                            {currentQuadrant === 'urgent-not-important' ? 'Aguardando Por' : 'Próximas Ações'}
                          </strong>
                        </p>
                        {currentQuadrant === 'urgent-not-important' && (
                          <p className="text-xs mt-1 opacity-90">
                            💡 Tarefas para delegar vão automaticamente para &quot;Aguardando Por&quot;
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setStep('organize')} variant="outline">
                  Voltar
                </Button>
                <Button onClick={() => handleComplete()} className="flex-1">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Criar Ação e Adicionar à Matriz
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 