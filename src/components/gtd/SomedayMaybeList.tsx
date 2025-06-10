'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Search,
  Filter,
  Edit,
  Trash2,
  ArrowRight,
  Inbox
} from 'lucide-react';
import { useGTDItems } from '@/lib/hooks/useLocalStorage';
import { toast } from 'sonner';
import { GTDItem } from '@/lib/types';
import { EditSomedayDialog } from './EditSomedayDialog';

export function SomedayMaybeList() {
  const { data: gtdItems, update, remove } = useGTDItems();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<GTDItem | null>(null);

  // Filter someday items
  const somedayItems = gtdItems.filter((item: GTDItem) => 
    item.type === 'someday-maybe' && item.status === 'active'
  );

  // Apply filters
  const filteredItems = somedayItems.filter((item: GTDItem) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const handleActivateItem = async (itemId: string) => {
    try {
      update(itemId, { 
        type: 'inbox',
        status: 'active'
      });
      toast.success('Item movido para Inbox para reprocessamento!');
    } catch (error) {
      toast.error('Erro ao ativar item');
      console.error('Error activating item:', error);
    }
  };

  const handleEditItem = (item: GTDItem) => {
    setEditingItem(item);
  };

  const handleEditSuccess = () => {
    setEditingItem(null);
    toast.success('Item atualizado com sucesso!');
  };

  const handleDeleteItem = async (itemId: string) => {
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
    return date.toLocaleDateString('pt-BR');
  };

  if (somedayItems.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Lista vazia</h3>
            <p className="text-muted-foreground mb-4">
              Ideias e projetos futuros aparecerão aqui
            </p>
            <Button onClick={() => window.location.hash = '#inbox'}>
              <ArrowRight className="h-4 w-4 mr-2" />
              Ir para Inbox
            </Button>
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
          <h3 className="text-lg font-semibold">Talvez / Algum Dia</h3>
          <p className="text-sm text-muted-foreground">
            {filteredItems.length} de {somedayItems.length} item{somedayItems.length !== 1 ? 's' : ''} 
            {filteredItems.length !== somedayItems.length && ' (filtrados)'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar ideias e projetos futuros..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Clear Filters */}
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.map((item: GTDItem) => (
          <Card key={item.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  {/* Title and Description */}
                  <h4 className="font-medium text-sm mb-1 line-clamp-2">
                    {item.title}
                  </h4>
                  
                  {item.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  
                  {/* Metadata */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Created Date */}
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      Criado {formatDate(item.createdAt.toISOString())}
                    </Badge>
                  </div>
                </div>
                
                {/* Actions Menu */}
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleActivateItem(item.id)}
                    className="h-8 px-3 text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Inbox className="h-3 w-3 mr-1" />
                    Reprocessar
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditItem(item)}
                    className="h-8 px-2"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteItem(item.id)}
                    className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No results */}
      {filteredItems.length === 0 && somedayItems.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-medium mb-1">Nenhum item encontrado</h3>
              <p className="text-sm text-muted-foreground">
                Tente ajustar o termo de busca
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GTD Tips */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-900 mb-1">Dicas para &quot;Talvez/Algum Dia&quot;</h4>
              <div className="text-sm text-purple-800 space-y-1">
                <p>• <strong>Revise regularmente:</strong> Verifique mensalmente se algo se tornou relevante</p>
                <p>• <strong>Seja específico:</strong> Descreva claramente a ideia ou projeto</p>
                <p>• <strong>Reprocesse quando pronto:</strong> Mova para inbox para decidir o que fazer</p>
                <p>• <strong>Mantenha limpo:</strong> Remova itens que não fazem mais sentido</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {editingItem && (
        <EditSomedayDialog
          somedayId={editingItem.id}
          onClose={() => setEditingItem(null)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  );
} 