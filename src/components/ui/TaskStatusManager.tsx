'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  MoreHorizontal,
  UserCheck,
  RotateCcw,
  Eye
} from 'lucide-react';
import { GTDItem, EisenhowerTask } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TaskWithStatus = GTDItem | EisenhowerTask;
type TaskStatus = 'active' | 'completed' | 'cancelled' | 'pending-approval' | 'needs-revision' | 'pending' | 'in-progress';

interface TaskStatusManagerProps {
  task: TaskWithStatus;
  onStatusChange: (newStatus: TaskStatus, metadata?: {
    stakeholder?: string;
    rejectionReason?: string;
    approvedAt?: string;
    rejectedAt?: string;
  }) => void;
  showAdvancedOptions?: boolean;
}

export function TaskStatusManager({ 
  task, 
  onStatusChange, 
  showAdvancedOptions = true 
}: TaskStatusManagerProps) {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [stakeholder, setStakeholder] = useState(task.stakeholder || '');
  const [rejectionReason, setRejectionReason] = useState('');

  const getStatusInfo = (status: TaskStatus) => {
    switch (status) {
      case 'active':
        return { 
          label: 'Ativo', 
          color: 'bg-blue-100 text-blue-800', 
          icon: <Clock className="h-3 w-3" /> 
        };
      case 'completed':
        return { 
          label: 'Concluído', 
          color: 'bg-green-100 text-green-800', 
          icon: <CheckCircle2 className="h-3 w-3" /> 
        };
      case 'pending-approval':
        return { 
          label: 'Aguardando Aprovação', 
          color: 'bg-yellow-100 text-yellow-800', 
          icon: <UserCheck className="h-3 w-3" /> 
        };
      case 'needs-revision':
        return { 
          label: 'Precisa Revisão', 
          color: 'bg-orange-100 text-orange-800', 
          icon: <RotateCcw className="h-3 w-3" /> 
        };
      case 'cancelled':
        return { 
          label: 'Cancelado', 
          color: 'bg-red-100 text-red-800', 
          icon: <XCircle className="h-3 w-3" /> 
        };
      case 'pending':
        return { 
          label: 'Pendente', 
          color: 'bg-gray-100 text-gray-800', 
          icon: <Clock className="h-3 w-3" /> 
        };
      case 'in-progress':
        return { 
          label: 'Em Andamento', 
          color: 'bg-blue-100 text-blue-800', 
          icon: <AlertCircle className="h-3 w-3" /> 
        };
      default:
        return { 
          label: status, 
          color: 'bg-gray-100 text-gray-800', 
          icon: <Clock className="h-3 w-3" /> 
        };
    }
  };

  const currentStatusInfo = getStatusInfo(task.status as TaskStatus);

  const handleStatusChange = (newStatus: TaskStatus) => {
    if (newStatus === 'pending-approval') {
      setShowApprovalDialog(true);
    } else if (newStatus === 'needs-revision') {
      setShowRejectionDialog(true);
    } else {
      onStatusChange(newStatus);
      toast.success(`Status alterado para "${getStatusInfo(newStatus).label}"`);
    }
  };

  const handleApprovalSubmit = () => {
    onStatusChange('pending-approval', { stakeholder });
    setShowApprovalDialog(false);
    toast.success('Tarefa enviada para aprovação');
  };

  const handleRejectionSubmit = () => {
    onStatusChange('needs-revision', { 
      rejectionReason,
      rejectedAt: new Date().toISOString()
    });
    setShowRejectionDialog(false);
    setRejectionReason('');
    toast.success('Tarefa marcada para revisão');
  };

  const handleApprove = () => {
    onStatusChange('completed', { 
      approvedAt: new Date().toISOString()
    });
    toast.success('Tarefa aprovada e concluída!');
  };

  const handleReject = () => {
    setShowRejectionDialog(true);
  };

  const getAvailableStatuses = (): TaskStatus[] => {
    const currentStatus = task.status as TaskStatus;
    
    switch (currentStatus) {
      case 'active':
      case 'pending':
        return ['completed', 'pending-approval', 'cancelled'];
      case 'in-progress':
        return ['completed', 'pending-approval', 'active', 'cancelled'];
      case 'completed':
        return ['active', 'needs-revision'];
      case 'pending-approval':
        return ['completed', 'needs-revision', 'active'];
      case 'needs-revision':
        return ['active', 'pending-approval', 'cancelled'];
      case 'cancelled':
        return ['active'];
      default:
        return ['active', 'completed', 'cancelled'];
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Status Badge */}
      <Badge className={cn("text-xs", currentStatusInfo.color)}>
        {currentStatusInfo.icon}
        <span className="ml-1">{currentStatusInfo.label}</span>
      </Badge>

      {/* Ações Rápidas para Aprovação */}
      {task.status === 'pending-approval' && (
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleApprove}
            className="h-6 px-2 text-xs text-green-700 border-green-300 hover:bg-green-50"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Aprovar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            className="h-6 px-2 text-xs text-red-700 border-red-300 hover:bg-red-50"
          >
            <XCircle className="h-3 w-3 mr-1" />
            Rejeitar
          </Button>
        </div>
      )}

      {/* Menu de Ações */}
      {showAdvancedOptions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {getAvailableStatuses().map((status) => {
              const statusInfo = getStatusInfo(status);
              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className="text-xs"
                >
                  {statusInfo.icon}
                  <span className="ml-2">{statusInfo.label}</span>
                </DropdownMenuItem>
              );
            })}
            
            {task.status === 'completed' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleStatusChange('active')}
                  className="text-xs text-orange-600"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="ml-2">Desfazer Conclusão</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Dialog de Aprovação */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar para Aprovação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="stakeholder">Responsável pela Aprovação</Label>
              <Input
                id="stakeholder"
                value={stakeholder}
                onChange={(e) => setStakeholder(e.target.value)}
                placeholder="Nome do stakeholder"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowApprovalDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleApprovalSubmit}>
                Enviar para Aprovação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Revisão</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Motivo da Revisão</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o que precisa ser revisado..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowRejectionDialog(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleRejectionSubmit}>
                Solicitar Revisão
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Informações Adicionais */}
      {(task.rejectionReason || task.stakeholder) && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Eye className="h-3 w-3" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Informações da Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {task.stakeholder && (
                <div>
                  <Label className="text-sm font-medium">Stakeholder</Label>
                  <p className="text-sm text-gray-600">{task.stakeholder}</p>
                </div>
              )}
              {task.rejectionReason && (
                <div>
                  <Label className="text-sm font-medium">Motivo da Revisão</Label>
                  <p className="text-sm text-gray-600">{task.rejectionReason}</p>
                </div>
              )}
              {task.approvedAt && (
                <div>
                  <Label className="text-sm font-medium">Aprovado em</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(task.approvedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
              {task.rejectedAt && (
                <div>
                  <Label className="text-sm font-medium">Rejeitado em</Label>
                  <p className="text-sm text-gray-600">
                    {new Date(task.rejectedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 