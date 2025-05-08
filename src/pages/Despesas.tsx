import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDespesas, deleteDespesa, getCategoriasDespesa } from '@/services/despesas'; // Importa funções do serviço
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlusCircle, Edit, Trash2, MoreHorizontal, Calendar as CalendarIcon, ArrowLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner"; // Para notificações
import { Despesa } from '@/types/financeiro'; // Importa o tipo Despesa
import { format, parseISO } from 'date-fns'; // Para formatar datas
import { ptBR } from 'date-fns/locale'; // Para formato de data brasileiro
import { Checkbox } from "@/components/ui/checkbox"; // Importar Checkbox
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
// Importar o modal de detalhes da despesa
import DespesaDetalhesModal from '@/components/financeiro/DespesaDetalhesModal';
import { useNavigate } from 'react-router-dom';
import { useSelectionState } from '@/hooks/useSelectionState'; // Importar o hook

// Componente principal da página de Despesas
const DespesasPage: React.FC = () => {
  const navigate = useNavigate();
  // Hook para acessar o cliente de query (invalidar cache, etc.)
  const queryClient = useQueryClient();
  // Estado para controlar o diálogo de confirmação de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // Estado para armazenar o ID da despesa a ser excluída
  const [despesaToDelete, setDespesaToDelete] = useState<string | null>(null);
  // Estado para controlar o modal de detalhes
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDespesaId, setSelectedDespesaId] = useState<string | null>(null);

  // Busca os dados das despesas usando TanStack Query
  const { data: despesas = [], isLoading, error } = useQuery<Despesa[]>({ // Especifica o tipo de dado esperado
    queryKey: ['despesas'], // Chave única para esta query
    queryFn: getDespesas, // Função que busca os dados
  });

  // Usar o hook de seleção
  const {
    selectedItems: selectedDespesas, // Renomear para clareza no contexto
    handleSelectAll,
    handleSelectSingle,
    selectAllState,
    resetSelection
  } = useSelectionState(despesas);

  // Busca as categorias de despesa (para mostrar o nome na tabela)
  const { data: categorias = [] } = useQuery<{ id: string; nome: string }[]>({ // Especifica o tipo de dado esperado
    queryKey: ['categoriasDespesa'],
    queryFn: getCategoriasDespesa,
  });

  // Cria um mapa de categorias para busca rápida do nome pelo ID
  const categoriasMap = React.useMemo(() => {
    return new Map(categorias.map(cat => [cat.id, cat.nome]));
  }, [categorias]);

  // Mutação para excluir despesa
  const deleteMutation = useMutation({
    mutationFn: deleteDespesa, // Função que executa a exclusão
    onSuccess: () => {
      // Exibe notificação de sucesso
      toast.success("Despesa excluída com sucesso!");
      // Invalida o cache da query 'despesas' para buscar dados atualizados
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
    },
    onError: (err) => {
      // Exibe notificação de erro
      toast.error(`Erro ao excluir despesa: ${err.message}`);
    },
    onSettled: () => {
      // Fecha o diálogo de confirmação após sucesso ou erro
      setShowDeleteDialog(false);
      setDespesaToDelete(null);
    }
  });

  // Função para abrir o diálogo de confirmação de exclusão
  const handleDeleteClick = (id: string) => {
    setDespesaToDelete(id); // Define qual despesa excluir
    setShowDeleteDialog(true); // Mostra o diálogo
  };

  // Função para confirmar a exclusão
  const confirmDelete = () => {
    if (despesaToDelete) {
      deleteMutation.mutate(despesaToDelete); // Executa a mutação de exclusão
    }
  };

  // Navega para a página de edição
  const handleEdit = (despesa: Despesa) => {
    navigate(`/app/despesas/${despesa.id}/editar`);
  };

  // Função para abrir o diálogo de confirmação (adaptada)
  const openDeleteConfirmation = (id?: string) => {
    if (id) {
      setDespesaToDelete(id); // Modo exclusão única
      resetSelection(); // Limpa seleção múltipla ao abrir para exclusão única
    } else {
      setDespesaToDelete(null); // Modo exclusão múltipla
    }
    setShowDeleteDialog(true);
  };

  // Função para confirmar a exclusão (adaptada para bulk)
  const handleConfirmDelete = async () => {
    const isMultiple = selectedDespesas.size > 0 && !despesaToDelete;
    const idsToDelete = isMultiple ? Array.from(selectedDespesas) : (despesaToDelete ? [despesaToDelete] : []);

    if (idsToDelete.length === 0) return;

    // Usar Promise.allSettled para tentar excluir todas
    const results = await Promise.allSettled(idsToDelete.map(id => deleteDespesa(id)));

    const successfulDeletes = results.filter(result => result.status === 'fulfilled').length;
    const failedDeletes = results.filter(result => result.status === 'rejected');

    if (successfulDeletes > 0) {
      toast.success(`${successfulDeletes} despesa${successfulDeletes > 1 ? 's' : ''} excluída${successfulDeletes > 1 ? 's' : ''} com sucesso!`);
    }

    if (failedDeletes.length > 0) {
      console.error("Falhas ao excluir despesas:", failedDeletes);
      toast.error(`Falha ao excluir ${failedDeletes.length} despesa${failedDeletes.length > 1 ? 's' : ''}. Verifique o console.`);
    }

    // Limpar estados e invalidar query em qualquer caso (sucesso parcial ou total)
    setShowDeleteDialog(false);
    setDespesaToDelete(null);
    resetSelection(); // Limpa a seleção usando a função do hook
    queryClient.invalidateQueries({ queryKey: ['despesas'] }); // Atualiza a lista
  };

  // Função para abrir o modal de detalhes da despesa
  const handleRowClick = (despesa: Despesa) => {
    console.log('Linha clicada, despesa:', despesa);
    setSelectedDespesaId(despesa.id);
    setIsModalOpen(true);
  };

  // Renderização do componente
  return (
    <div className="container mx-auto py-8">
      {/* Cabeçalho centralizado com botões abaixo */}
      <div className="flex flex-col items-center justify-center mb-6 pb-4 border-b w-full">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Despesas</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          Gerencie as despesas do seu brechó.
        </p>
        
        {/* Botões de ação abaixo do título */}
        <div className="flex items-center gap-2 mt-2">
          {selectedDespesas.size > 0 && (
            <Button
              variant="destructive"
              onClick={() => openDeleteConfirmation()}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir ({selectedDespesas.size})
            </Button>
          )}
          <Button 
            onClick={() => navigate('/app/despesas/nova')} 
            className="bg-[#a16207] hover:bg-[#854d0e] text-white gap-2"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Despesa
          </Button>
          <Button 
            onClick={() => navigate('/app/despesas/recorrente')} 
            variant="outline"
            className="border-[#a16207] text-[#a16207] hover:bg-amber-50 gap-2"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Despesa Recorrente
          </Button>
        </div>
      </div>

      {/* Feedback de Carregamento e Erro */}
      {isLoading && (
        <div className="w-full flex justify-center my-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-700"></div>
        </div>
      )}
      {error && <p className="text-red-500">Erro ao carregar despesas: {error.message}</p>}

      {/* Tabela de Despesas */}
      {!isLoading && !error && (
        <Table>
          <TableHeader>
            {/* Cabeçalho Checkbox Selecionar Todos */}
            <TableRow>
              <TableHead className="w-[40px] px-2">
                <Checkbox
                  checked={selectAllState}
                  onCheckedChange={handleSelectAll}
                  aria-label="Selecionar todas as despesas"
                  className="border-stone-400"
                />
              </TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Data Pag.</TableHead>
              <TableHead>Data Venc.</TableHead>
              <TableHead>Pago?</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {despesas.map((despesa) => (
              // Adiciona data-state e classe condicional para highlight e onClick para abrir o modal
              <TableRow 
                key={despesa.id} 
                data-state={selectedDespesas.has(despesa.id) ? "selected" : ""}
                className={`${selectedDespesas.has(despesa.id) ? 'bg-blue-50' : ''} cursor-pointer hover:bg-gray-50`}
                onClick={() => {
                  console.log('Clique na linha detectado');
                  handleRowClick(despesa);
                }}
              >
                {/* Célula Checkbox Individual - Evitar propagação do clique */}
                <TableCell className="px-2">
                   <Checkbox
                      checked={selectedDespesas.has(despesa.id)}
                      onCheckedChange={(checked) => {
                        // Evitar que o evento se propague para a linha
                        handleSelectSingle(despesa.id, checked)
                      }}
                      aria-label={`Selecionar despesa ${despesa.descricao}`}
                      className="border-stone-400"
                      onClick={(e) => e.stopPropagation()}
                   />
                </TableCell>
                <TableCell className="font-medium">{despesa.descricao}</TableCell>
                <TableCell>{categoriasMap.get(despesa.categoria_id) || 'N/A'}</TableCell>
                <TableCell className="text-right">
                  {/* Formata o valor como moeda brasileira */}
                  {despesa.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </TableCell>
                <TableCell>
                  {/* Formata a data de pagamento - corrigido para usar parseISO */}
                  {despesa.data ? format(parseISO(despesa.data), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                </TableCell>
                <TableCell>
                  {/* Formata a data de vencimento (se existir) - corrigido para usar parseISO */}
                  {despesa.data_vencimento ? format(parseISO(despesa.data_vencimento), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                </TableCell>
                <TableCell>{despesa.pago ? 'Sim' : 'Não'}</TableCell>
                <TableCell className="text-right">
                  {/* Menu de Ações (Editar, Excluir) - Evitar propagação do clique */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="h-8 w-8 p-0" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="sr-only">Abrir menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(despesa);
                      }}>
                        <Edit className="mr-2 h-4 w-4" /> Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(despesa.id);
                      }} className="text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

       {/* Diálogo de Confirmação de Exclusão (Adaptado) */}
       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             {/* Título dinâmico */}
             <AlertDialogTitle>
                {despesaToDelete ? 'Confirmar Exclusão' : `Confirmar Exclusão (${selectedDespesas.size})`}
            </AlertDialogTitle>
             {/* Descrição dinâmica */}
             <AlertDialogDescription>
               {despesaToDelete
                 ? 'Tem certeza que deseja excluir esta despesa? Esta ação não pode ser desfeita.'
                 : `Tem certeza que deseja excluir as ${selectedDespesas.size} despesas selecionadas? Esta ação não pode ser desfeita.`}
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Cancelar</AlertDialogCancel>
             {/* Chama handleConfirmDelete */}
             <AlertDialogAction onClick={handleConfirmDelete} disabled={deleteMutation.isPending}>
               {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>

      {/* Modal de Detalhes da Despesa */}
      <DespesaDetalhesModal
        isOpen={isModalOpen}
        onClose={() => {
          console.log('Fechando modal');
          setIsModalOpen(false);
        }}
        despesaId={selectedDespesaId}
      />

    </div>
  );
};

export default DespesasPage; 