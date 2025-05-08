import React, { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSales } from '@/hooks/useSales'
import { formatCurrency, formatDate } from '@/lib/utils'
import { SaleWithRelations } from '@/types/sales'
import { Plus, Eye, Edit, Trash2, CheckCircle } from 'lucide-react'
import NoDataMessage from '@/components/shared/NoDataMessage'
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from 'sonner'
import { updateSaleStatus } from '@/services/saleService'
import { useSelectionState } from '@/hooks/useSelectionState'

type SaleDisplay = SaleWithRelations & { 
  cliente_nome?: string | null;
  venda_items?: any[]; 
  forma_pagamento?: { nome: string };
};

const Vendas = () => {
  const { sales, loading, fetchSales, deleteSale, error } = useSales()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [saleToDelete, setSaleToDelete] = useState<SaleDisplay | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const {
    selectedItems: selectedSales,
    handleSelectAll,
    handleSelectSingle,
    selectAllState,
    resetSelection
  } = useSelectionState(sales);

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  // --- Funções de Exclusão --- 
  const handleDelete = async () => {
    const isMultiple = selectedSales.size > 0 && !saleToDelete;
    const idsToDelete = isMultiple ? Array.from(selectedSales) : (saleToDelete ? [saleToDelete.id] : []);

    if (idsToDelete.length === 0) return;

    // Usar Promise.allSettled para tentar excluir todas
    const results = await Promise.allSettled(idsToDelete.map(id => deleteSale(id)));

    const successfulDeletes = results.filter(result => result.status === 'fulfilled').length;
    const failedDeletes = results.filter(result => result.status === 'rejected');

    if (successfulDeletes > 0) {
      toast.success(`${successfulDeletes} venda${successfulDeletes > 1 ? 's' : ''} excluída${successfulDeletes > 1 ? 's' : ''} com sucesso!`);
    }

    if (failedDeletes.length > 0) {
      console.error("Falhas ao excluir vendas:", failedDeletes);
      toast.error(`Falha ao excluir ${failedDeletes.length} venda${failedDeletes.length > 1 ? 's' : ''}. Verifique o console.`);
    }

    setIsDeleteDialogOpen(false);
    setSaleToDelete(null);
    resetSelection();
    // fetchSales será chamado pelo hook useSales após delete bem-sucedido
    // Se houver falhas, podemos forçar um refetch: if (failedDeletes.length > 0) fetchSales();
  };

  const openDeleteConfirmation = (sale?: SaleDisplay) => {
    if (sale) {
      setSaleToDelete(sale);
      resetSelection();
    } else {
      setSaleToDelete(null);
    }
    setIsDeleteDialogOpen(true);
  };

  // --- Funções de Edição/Criação ---
  const handleEdit = (sale: SaleDisplay) => {
    navigate(`/app/vendas/${sale.id}/editar`);
  }

  const handleAddNew = () => {
    navigate('/app/vendas/nova');
  }

  // --- Mutação para atualizar status ---
  const { mutate: confirmPaymentMutation, isPending: isConfirmingPayment } = useMutation({
    mutationFn: (saleId: string) => updateSaleStatus(saleId, 'pago'),
    onSuccess: (data) => {
      toast.success(`Pagamento da venda #${data.id.substring(0, 8)} confirmado!`);
      queryClient.invalidateQueries({ queryKey: ['vendas'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] });
    },
    onError: (error, saleId) => {
      toast.error(`Erro ao confirmar pagamento da venda #${saleId.substring(0, 8)}.`, {
        description: error.message,
      });
    },
  });

  // --- Função para chamar a mutação ---
  const handleConfirmPayment = (saleId: string) => {
    confirmPaymentMutation(saleId);
  };

  const renderSalesTable = () => {
    if (sales.length === 0 && !loading && !error) {
      return (
        <NoDataMessage 
          message="Nenhuma venda registrada" 
          description="Clique em 'Nova Venda' para começar" 
        />
      )
    }
    if (error && !loading) {
      return <p className="text-red-600 text-center">Erro ao carregar vendas: {error}</p>
    }

    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] text-[#92400e] font-semibold border-b bg-[#fef3c7] px-2">
                <Checkbox
                  checked={selectAllState}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todas as vendas"
                  className="border-stone-400"
                />
              </TableHead>
              <TableHead className="text-[#92400e] font-semibold border-b bg-[#fef3c7]">Data</TableHead>
              <TableHead className="text-[#92400e] font-semibold border-b bg-[#fef3c7]">Cliente</TableHead>
              <TableHead className="text-[#92400e] font-semibold border-b bg-[#fef3c7]">Itens</TableHead>
              <TableHead className="text-[#92400e] font-semibold border-b bg-[#fef3c7]">Forma de Pagamento</TableHead>
              <TableHead className="text-right text-[#92400e] font-semibold border-b bg-[#fef3c7]">Valor Total</TableHead>
              <TableHead className="text-right text-[#92400e] font-semibold border-b bg-[#fef3c7]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sales as SaleDisplay[]).map((sale, index) => {
              let itemDisplay = '-';
              const items = sale.vendas_items;
              if (items && items.length > 0) {
                const firstItem = items[0];
                if (firstItem.produto && firstItem.produto.nome) {
                  itemDisplay = firstItem.produto.nome;
                } else if (firstItem.produtos && firstItem.produtos.nome) {
                  itemDisplay = firstItem.produtos.nome;
                } else if (firstItem.descricao_manual) {
                  itemDisplay = firstItem.descricao_manual;
                }
                if (items.length > 1) {
                  itemDisplay += ` (+${items.length - 1} item${items.length > 2 ? 's' : ''})`;
                }
              }

              console.log(`[Vendas - renderSalesTable] Venda ID ${sale.id.substring(0,8)} - sale.data_venda (Raw):`, sale.data_venda);

              return (
                <TableRow 
                  key={sale.id} 
                  className={`${index % 2 === 0 ? 'bg-stone-50' : 'bg-white'} ${selectedSales.has(sale.id) ? 'bg-blue-100' : ''}`}
                  data-state={selectedSales.has(sale.id) ? "selected" : ""}
                >
                  <TableCell className="border-b border-stone-200 px-2">
                    <Checkbox
                      checked={selectedSales.has(sale.id)}
                      onCheckedChange={(checked) => handleSelectSingle(sale.id, checked)}
                      aria-label={`Selecionar venda ${sale.id.substring(0, 8)}`}
                      className="border-stone-400"
                    />
                  </TableCell>
                  <TableCell className="border-b border-stone-200 text-stone-700 px-4">
                    {sale.data_venda ? (
                      <div>
                        {formatDate(sale.data_venda)}
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="border-b border-stone-200 text-stone-700 px-4">{sale.clientes?.nome || 'Não identificado'}</TableCell>
                  <TableCell className="border-b border-stone-200 text-stone-700 px-4">{itemDisplay}</TableCell>
                  <TableCell className="border-b border-stone-200 text-stone-700 px-4">{sale.formas_pagamento?.nome || '-'}</TableCell>
                  <TableCell className="border-b border-stone-200 text-right font-medium text-stone-800 px-4">
                    {formatCurrency(sale.valor_total)}
                  </TableCell>
                  <TableCell className="border-b border-stone-200 text-right space-x-1">
                    {sale.status === 'pendente' && sale.formas_pagamento?.nome !== 'A Prazo (Fiado)' && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        title="Confirmar Pagamento" 
                        onClick={() => handleConfirmPayment(sale.id)}
                        disabled={isConfirmingPayment}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" title="Detalhes" 
                            onClick={() => navigate(`/app/vendas/${sale.id}`)}>
                      <Eye className="h-4 w-4 text-blue-600" /> 
                    </Button>
                    <Button variant="ghost" size="icon" title="Editar" 
                            onClick={() => handleEdit(sale)}>
                      <Edit className="h-4 w-4 text-orange-500" />
                    </Button>
                    <Button variant="ghost" size="icon" title="Excluir" 
                            onClick={() => openDeleteConfirmation(sale)}>
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {saleToDelete ? 'Confirmar Exclusão' : `Confirmar Exclusão (${selectedSales.size})`}
              </AlertDialogTitle>
              <AlertDialogDescription>
                <div className="text-sm text-muted-foreground">
                  Tem certeza que deseja excluir{' '}
                  {saleToDelete
                    ? `a venda para ${saleToDelete.clientes?.nome || 'Cliente Desconhecido'} no valor de ${formatCurrency(saleToDelete.valor_total)}?`
                    : `${selectedSales.size} venda${selectedSales.size > 1 ? 's' : ''} selecionada${selectedSales.size > 1 ? 's' : ''}?`}
                  <br />
                  <span className="font-semibold text-destructive">
                    Esta ação não pode ser desfeita e o estoque será revertido.
                  </span>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} disabled={!saleToDelete && selectedSales.size === 0}>Confirmar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Cabeçalho centralizado com botões abaixo */}
      <div className="flex flex-col items-center justify-center mb-6 pb-4 border-b w-full">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Vendas</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          Gerencie as vendas realizadas no seu brechó.
        </p>
        
        {/* Botões de ação abaixo do título */}
        <div className="flex items-center gap-2 mt-2">
          {selectedSales.size > 0 && (
            <Button
              onClick={() => openDeleteConfirmation()}
              variant="destructive"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir ({selectedSales.size})
            </Button>
          )}
          <Button 
            onClick={handleAddNew} 
            className="bg-[#a16207] hover:bg-[#854d0e] text-white gap-2"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Venda
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="w-full flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700"></div>
        </div>
      ) : (
        renderSalesTable()
      )}
    </div>
  )
}

export default Vendas
