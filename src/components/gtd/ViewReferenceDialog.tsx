'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  Calendar,
  Tag,
  Archive,
  ExternalLink
} from 'lucide-react';
import { GTDItem } from '@/lib/types';

interface ViewReferenceDialogProps {
  reference: GTDItem;
  onClose: () => void;
  onEdit: () => void;
}

export function ViewReferenceDialog({ reference, onClose, onEdit }: ViewReferenceDialogProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Visualizar Referência
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-xl font-semibold mb-2">{reference.title}</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Archive className="h-4 w-4" />
              <span>Arquivado em {formatDate(reference.createdAt.toISOString())}</span>
            </div>
          </div>

          {/* Description */}
          {reference.description && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm">Descrição</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{reference.description}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Context */}
            {reference.context && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Contexto
                </h3>
                <Badge variant="outline">{reference.context}</Badge>
              </div>
            )}

            {/* Area */}
            {reference.area && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm">Área</h3>
                <Badge variant="outline">{reference.area}</Badge>
              </div>
            )}
          </div>

          {/* Tags */}
          {reference.tags && reference.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-medium text-sm flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {reference.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="space-y-2">
            <h3 className="font-medium text-sm flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Informações de Data
            </h3>
            <div className="bg-muted/50 p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Criado:</span>
                <span>{formatDate(reference.createdAt.toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Atualizado:</span>
                <span>{formatDate(reference.updatedAt.toISOString())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge variant={reference.status === 'active' ? 'default' : 'secondary'}>
                  {reference.status === 'active' ? 'Ativo' : 
                   reference.status === 'completed' ? 'Arquivado' : 'Cancelado'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Fechar
            </Button>
            <Button
              onClick={onEdit}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Editar Referência
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 