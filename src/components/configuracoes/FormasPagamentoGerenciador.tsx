import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFormasPagamento, addFormaPagamento, updateFormaPagamento, deleteFormaPagamento } from '@/services/formasPagamento';
import { FormaPagamento } from '@/types/financeiro';
import { DataTable } from '@/components/ui/data-table'; // Assumindo que DataTable está em ui
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"; // Para add/edit
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formaPagamentoSchema, FormaPagamentoFormData } from '@/lib/validations/formaPagamentoSchema';
import { toast } from 'sonner'; // Para notificações
import { ColumnDef } from '@tanstack/react-table'; // Tipagem para colunas
import LoadingSpinner from '@/components/ui/loading-spinner'; // Feedback de carregamento
import ErrorDisplay from '@/components/ui/error-display'; // Feedback de erro

// Define as colunas para a DataTable
const createColumns = (onEdit: (fp: FormaPagamento) => void, onDelete: (id: string) => void): ColumnDef<FormaPagamento>[] => [
  {
    accessorKey: 'nome',
    header: 'Nome',
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const formaPagamento = row.original;
      return (
        <div className="flex space-x-2">
          {/* // Botão Editar */}
          <Button variant="outline" size="icon" onClick={() => onEdit(formaPagamento)}>
            <Edit className="h-4 w-4" />
          </Button>
          {/* // Botão Excluir (com confirmação) */}
          <Button variant="destructive" size="icon" onClick={() => onDelete(formaPagamento.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

const FormasPagamentoGerenciador: React.FC = () => {
  // Hook para invalidar queries após mutações e atualizar a UI
  const queryClient = useQueryClient();
  // Estado para controlar a abertura dos dialogs
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // Estado para armazenar a forma de pagamento sendo editada ou excluída
  const [editingFormaPagamento, setEditingFormaPagamento] = useState<FormaPagamento | null>(null);
  const [deletingFormaPagamentoId, setDeletingFormaPagamentoId] = useState<string | null>(null);

  // Busca as formas de pagamento usando React Query
  const { data: formasPagamento, isLoading, error } = useQuery<FormaPagamento[], Error>({
    queryKey: ['formasPagamento'], // Chave única para a query
    queryFn: getFormasPagamento, // Função que busca os dados
  });

  // Configuração do formulário React Hook Form com Zod
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm<FormaPagamentoFormData>({
    resolver: zodResolver(formaPagamentoSchema), // Integração com Zod
  });

  // Mutação para adicionar forma de pagamento
  const addMutation = useMutation<FormaPagamento, Error, FormaPagamentoFormData>({
    mutationFn: (data) => addFormaPagamento(data.nome),
    onSuccess: () => {
      // Invalida a query para buscar os dados atualizados
      queryClient.invalidateQueries({ queryKey: ['formasPagamento'] });
      // Fecha o dialog
      setIsAddEditDialogOpen(false);
      // Reseta o formulário
      reset();
      // Exibe notificação de sucesso
      toast.success('Forma de pagamento adicionada com sucesso!');
    },
    onError: (err) => {
      // Exibe notificação de erro
      toast.error(`Erro ao adicionar: ${err.message}`);
    },
  });

  // Mutação para atualizar forma de pagamento
  const updateMutation = useMutation<FormaPagamento, Error, FormaPagamentoFormData>({
    mutationFn: (data) => {
      if (!editingFormaPagamento) throw new Error('Nenhuma forma de pagamento selecionada para edição.');
      return updateFormaPagamento(editingFormaPagamento.id, data.nome);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formasPagamento'] });
      setIsAddEditDialogOpen(false);
      reset();
      setEditingFormaPagamento(null); // Limpa a forma de pagamento em edição
      toast.success('Forma de pagamento atualizada com sucesso!');
    },
    onError: (err) => {
      toast.error(`Erro ao atualizar: ${err.message}`);
    },
  });

  // Mutação para excluir forma de pagamento
  const deleteMutation = useMutation<void, Error, string>({
    mutationFn: deleteFormaPagamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formasPagamento'] });
      setIsDeleteDialogOpen(false);
      setDeletingFormaPagamentoId(null); // Limpa o ID
      toast.success('Forma de pagamento excluída com sucesso!');
    },
    onError: (err) => {
      toast.error(`Erro ao excluir: ${err.message}`);
      setIsDeleteDialogOpen(false); // Fecha o dialog mesmo com erro
    },
  });

  // Função para lidar com a submissão do formulário (Adicionar ou Editar)
  const onSubmit = (data: FormaPagamentoFormData) => {
    if (editingFormaPagamento) {
      // Se estiver editando, chama a mutação de atualização
      updateMutation.mutate(data);
    } else {
      // Se for novo, chama a mutação de adição
      addMutation.mutate(data);
    }
  };

  // Abre o dialog de edição e popula o formulário
  const handleEdit = (formaPagamento: FormaPagamento) => {
    setEditingFormaPagamento(formaPagamento);
    setValue('nome', formaPagamento.nome); // Preenche o campo nome
    setIsAddEditDialogOpen(true);
  };

  // Define o ID a ser excluído e abre o dialog de confirmação
  const handleDelete = (id: string) => {
    setDeletingFormaPagamentoId(id);
    setIsDeleteDialogOpen(true);
  };

  // Confirma a exclusão
  const confirmDelete = () => {
    if (deletingFormaPagamentoId) {
      deleteMutation.mutate(deletingFormaPagamentoId);
    }
  };

  // Cria as definições de coluna passando as funções de editar/excluir
  const columns = createColumns(handleEdit, handleDelete);

  // Feedback visual durante o carregamento
  if (isLoading) return <LoadingSpinner />;
  // Feedback visual em caso de erro na busca inicial
  if (error) return <ErrorDisplay message={error.message} />;

  return (
    <div className="space-y-4">
      {/* // Dialog para Adicionar/Editar Forma de Pagamento */}
      <Dialog open={isAddEditDialogOpen} onOpenChange={(open) => {
        setIsAddEditDialogOpen(open);
        // Reseta o form e o estado de edição ao fechar
        if (!open) {
          reset();
          setEditingFormaPagamento(null);
        }
      }}>
        <DialogTrigger asChild>
          {/* // Botão para abrir o Dialog de Adicionar */}
          <Button onClick={() => {
             reset(); // Garante que o form está limpo ao adicionar
             setEditingFormaPagamento(null);
             setIsAddEditDialogOpen(true);
          }}>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Forma de Pagamento
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            {/* // Título dinâmico do Dialog */}
            <DialogTitle>{editingFormaPagamento ? 'Editar Forma de Pagamento' : 'Adicionar Nova Forma de Pagamento'}</DialogTitle>
            <DialogDescription>
              {editingFormaPagamento ? 'Modifique o nome da forma de pagamento.' : 'Insira o nome da nova forma de pagamento.'}
            </DialogDescription>
          </DialogHeader>
          {/* // Formulário */}
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nome" className="text-right">
                Nome
              </Label>
              {/* // Input do nome com registro do react-hook-form */}
              <Input
                id="nome"
                {...register('nome')}
                className={`col-span-3 ${errors.nome ? 'border-red-500' : ''}`}
              />
            </div>
            {/* // Exibição de erro de validação */}
            {errors.nome && <p className="col-span-4 text-red-500 text-sm text-center">{errors.nome.message}</p>}

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              {/* // Botão de submit com estado de carregamento */}
              <Button type="submit" disabled={isSubmitting || addMutation.isPending || updateMutation.isPending}>
                 {(isSubmitting || addMutation.isPending || updateMutation.isPending) && <LoadingSpinner size="small" className="mr-2" />}
                 {editingFormaPagamento ? 'Salvar Alterações' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* // AlertDialog para Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        {/* // O Trigger é gerenciado manualmente nos botões da tabela */}
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta forma de pagamento?
              Esta ação não pode ser desfeita e pode falhar se a forma de pagamento estiver sendo utilizada em alguma transação.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {/* // Botão Cancelar */}
            <AlertDialogCancel onClick={() => setDeletingFormaPagamentoId(null)}>Cancelar</AlertDialogCancel>
            {/* // Botão Confirmar Exclusão */}
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending && <LoadingSpinner size="small" className="mr-2" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* // Tabela de Formas de Pagamento */}
      <DataTable columns={columns} data={formasPagamento || []} />
    </div>
  );
};

export default FormasPagamentoGerenciador; 