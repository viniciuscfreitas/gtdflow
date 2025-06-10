'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Inbox, 
  ArrowRight, 
  Archive, 
  Trash2, 
  AlertCircle
} from 'lucide-react';
import { useFirestoreGTD } from '@/lib/hooks/useFirestoreGTD';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ProcessItemDialog } from './ProcessItemDialog';
import { toast } from 'sonner';
import { GTDItem } from '@/lib/types';

export function InboxList() {
  const { user } = useAuth();
  const { data: gtdItems, update, remove } = useFirestoreGTD(user);
  const [processingItem, setProcessingItem] = useState<string | null>(null);

  // Filter inbox items
  const inboxItems = gtdItems.filter((item: GTDItem) => 
    item.type === 'inbox' && item.status === 'active'
  );

  const handleArchive = async (itemId: string) => {
    try {
      update(itemId, { 
        type: 'reference' as const,
        status: 'active' as const
      });
      toast.success('Item arquivado como referência');
    } catch (error) {
      toast.error('Erro ao arquivar item');
      console.error('Error archiving item:', error);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        remove(itemId);
        toast.success('Item excluído');
      } catch (error) {
        toast.error('Erro ao excluir item');
        console.error('Error deleting item:', error);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (inboxItems.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Inbox vazio</h3>
            <p className="text-muted-foreground">
              Ótimo! Você processou todos os itens do seu inbox.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Inbox</h3>
          <p className="text-sm text-muted-foreground">
            {inboxItems.length} item{inboxItems.length !== 1 ? 's' : ''} para processar
          </p>
        </div>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {inboxItems.map((item: GTDItem) => {
          return (
            <Card key={item.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title and Description */}
                    <h4 className="font-medium text-sm mb-1 line-clamp-2">
                      {item.title}
                    </h4>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
                        {item.description}
                      </p>
                    )}
                    
                    {/* Metadata */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        Capturado {formatDate(item.createdAt.toISOString())}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      onClick={() => setProcessingItem(item.id)}
                      className="h-8 px-3"
                    >
                      <ArrowRight className="h-3 w-3 mr-1" />
                      Processar
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleArchive(item.id)}
                      className="h-8 px-2"
                      title="Arquivar como referência"
                    >
                      <Archive className="h-3 w-3" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                      className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Excluir item"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Processing Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Como processar o inbox</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>• <strong>É acionável?</strong> Se sim, defina a próxima ação</p>
                <p>• <strong>Leva menos de 2 min?</strong> Faça agora</p>
                <p>• <strong>É um projeto?</strong> Quebre em ações menores</p>
                <p>• <strong>É referência?</strong> Archive para consulta futura</p>
                <p>• <strong>Novo:</strong> Defina conscientemente importância e urgência durante o processamento</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processing Dialog */}
      {processingItem && (
        <ProcessItemDialog
          itemId={processingItem}
          onClose={() => setProcessingItem(null)}
          onSuccess={() => {
            setProcessingItem(null);
            toast.success('Item processado com sucesso!');
          }}
        />
      )}
    </div>
  );
} 