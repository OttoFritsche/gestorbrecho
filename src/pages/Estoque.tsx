import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ProdutoDataTable from '@/components/produtos/ProdutoDataTable';
import ProdutoActionModal from '@/components/produtos/ProdutoActionModal';
import { getProdutos, deleteProduto } from '@/services/produtoService';
import { Produto } from '@/lib/types/produto';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorDisplay from '@/components/ui/error-display';
import { useSelectionState } from '@/hooks/useSelectionState';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCategorias } from '@/services/categoriaService';

const Estoque = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [produtoToDelete, setProdutoToDelete] = useState<Produto | null>(null);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('todas');
  
  // Estados para o modal de ações
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  const { data: produtos = [], isLoading, error } = useQuery<Produto[], Error>({
    queryKey: ['produtos'],
    queryFn: getProdutos,
  });
  
  // Buscar categorias do tipo produto para o filtro
  const { data: categorias = [], isLoading: isLoadingCategorias } = useQuery({
    queryKey: ['categorias', 'produto'],
    queryFn: () => getCategorias('produto', true),
    staleTime: 1000 * 60 * 15, // Cache por 15 minutos
  });

  const {
    selectedItems,
    handleSelectAll,
    handleSelectSingle,
    selectAllState,
    resetSelection
  } = useSelectionState(produtos);

  const mutationDelete = useMutation<void, Error, { produtoId: string; imagemUrl?: string | null }>({
    mutationFn: ({ produtoId, imagemUrl }) => deleteProduto(produtoId, imagemUrl),
    onError: (error) => {
      console.error("Erro interno ao tentar excluir produto:", error);
    }
  });

  // Filtragem de produtos por categoria
  const produtosFiltrados = useMemo(() => {
    if (categoriaSelecionada === 'todas') {
      return produtos;
    }
    return produtos.filter(produto => produto.categoria_id === categoriaSelecionada);
  }, [produtos, categoriaSelecionada]);

  const handleEdit = (produto: Produto) => {
    navigate(`/app/estoque/${produto.id}/editar`);
  };

  const openDeleteConfirmation = (produto?: Produto) => {
    if (produto) {
      setProdutoToDelete(produto);
      resetSelection();
    } else {
      setProdutoToDelete(null);
    }
    setIsDeleteDialogOpen(true);
  };
  
  // Manipulador para abrir o modal de ações
  const handleOpenActionModal = (produto: Produto) => {
    setSelectedProduto(produto);
    setIsActionModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    const isMultiple = selectedItems.size > 0 && !produtoToDelete;
    let idsToDelete: string[] = [];
    let itemsToDelete: { produtoId: string; imagemUrl?: string | null }[] = [];

    if (isMultiple) {
      idsToDelete = Array.from(selectedItems);
      const productsMap = new Map(produtos.map(p => [p.id, p]));
      itemsToDelete = idsToDelete.map(id => {
        const product = productsMap.get(id);
        return { produtoId: id, imagemUrl: product?.imagem_url };
      });
    } else if (produtoToDelete) {
      idsToDelete = [produtoToDelete.id];
      itemsToDelete = [{ produtoId: produtoToDelete.id, imagemUrl: produtoToDelete.imagem_url }];
    }

    if (itemsToDelete.length === 0) return;

    const results = await Promise.allSettled(itemsToDelete.map(item => 
        deleteProduto(item.produtoId, item.imagemUrl)
    ));

    const successfulDeletes = results.filter(result => result.status === 'fulfilled').length;
    const failedDeletes = results.filter(result => result.status === 'rejected');

    if (successfulDeletes > 0) {
      toast.success(`${successfulDeletes} produto${successfulDeletes > 1 ? 's' : ''} inativado${successfulDeletes > 1 ? 's' : ''} com sucesso!`);
    }
    if (failedDeletes.length > 0) {
      console.error("Falhas ao inativar produtos:", failedDeletes);
      toast.error(`Falha ao inativar ${failedDeletes.length} produto${failedDeletes.length > 1 ? 's' : ''}.`);
    }

    setIsDeleteDialogOpen(false);
    setProdutoToDelete(null);
    resetSelection();
    queryClient.invalidateQueries({ queryKey: ['produtos'] });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex flex-col items-center justify-center mb-6 pb-4 border-b w-full">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Estoque de Produtos</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          Gerencie os itens disponíveis no seu brechó.
        </p>
        
        <div className="flex items-center gap-4 mt-2">
          {/* Filtro por categoria */}
          <div className="flex items-center gap-2">
            <Label htmlFor="filtro-categoria" className="mr-1">Filtrar por categoria:</Label>
            <Select
              value={categoriaSelecionada}
              onValueChange={setCategoriaSelecionada}
              disabled={isLoadingCategorias}
            >
              <SelectTrigger className="w-[200px]" id="filtro-categoria">
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map(categoria => (
                  <SelectItem key={categoria.id} value={categoria.id}>{categoria.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Limpar filtro quando houver filtro aplicado */}
          {categoriaSelecionada !== 'todas' && (
            <Button 
              variant="ghost" 
              onClick={() => setCategoriaSelecionada('todas')}
              className="h-8 px-2 text-xs"
            >
              Limpar filtro
            </Button>
          )}
          
          {/* Botões de ação */}
          {selectedItems.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => openDeleteConfirmation()}
              className="gap-2 ml-2"
              disabled={mutationDelete.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Inativar ({selectedItems.size})
            </Button>
          )}
          <Button onClick={() => navigate('/app/estoque/novo')} className="bg-[#a16207] hover:bg-[#854d0e] text-white gap-2 ml-2">
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      </div>

      {isLoading && <LoadingSpinner text="Carregando estoque..." />}
      {error && <ErrorDisplay message={error.message} />}
      {produtos && !isLoading && (
        <ProdutoDataTable
          data={produtosFiltrados}
          onEdit={handleEdit}
          onDelete={(produto) => openDeleteConfirmation(produto)}
          onAction={handleOpenActionModal}
          isLoading={mutationDelete.isPending}
          selectedItems={selectedItems}
          onSelectAll={handleSelectAll}
          onSelectSingle={handleSelectSingle}
          selectAllState={selectAllState}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {produtoToDelete ? 'Confirmar Inativação' : `Confirmar Inativação (${selectedItems.size})`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {produtoToDelete
                ? `Tem certeza que deseja inativar o produto "${produtoToDelete.nome}"? Esta ação pode ser revertida.`
                : `Tem certeza que deseja inativar os ${selectedItems.size} produtos selecionados? Esta ação pode ser revertida.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete} 
              disabled={mutationDelete.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {mutationDelete.isPending ? 'Inativando...' : 'Confirmar Inativação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal de Ações do Produto */}
      <ProdutoActionModal 
        open={isActionModalOpen}
        onOpenChange={setIsActionModalOpen}
        produto={selectedProduto}
      />

    </div>
  );
};

export default Estoque;
