import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import ClientesTable from '@/components/clientes/ClientesTable';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { useToast } from "@/components/ui/use-toast";
import { Loader2, UserCheck, UserX, Trash2, PlusCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useSelectionState } from '@/hooks/useSelectionState';

// Importar serviço e tipos de cliente
import { fetchClientes, toggleClienteStatus, Cliente } from '@/services/clienteService';

const ClientesPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Estados para AlertDialog de alternar status (Único)
  const [isToggleStatusAlertOpen, setIsToggleStatusAlertOpen] = useState(false); 
  const [clienteParaAlterarStatus, setClienteParaAlterarStatus] = useState<{ id: string; ativo: boolean; nome: string } | null>(null);
  
  // Novos estados para AlertDialog de ações em MASSA
  const [isBulkActionAlertOpen, setIsBulkActionAlertOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'activate' | 'deactivate' | null>(null);
  const [isProcessingBulkAction, setIsProcessingBulkAction] = useState(false); // Para loading do botão bulk

  // useQuery usando a função de serviço
  const { 
    data: clientes = [], 
    isLoading, 
    isError,
    error 
  } = useQuery<Cliente[], Error>({
    queryKey: ['clientes'], 
    queryFn: fetchClientes,
  });

  // Usar o hook de seleção
  const {
    selectedItems: selectedClientes,
    handleSelectAll,
    handleSelectSingle,
    selectAllState,
    resetSelection
  } = useSelectionState(clientes);

  // Mutação para alternar status (usada internamente pelas lógicas)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, novoStatus }: { id: string; novoStatus: boolean }) => 
      toggleClienteStatus(id, novoStatus),
    // onSuccess e onError serão tratados pelas funções de confirmação
    onError: (error, variables) => {
      console.error(`Erro ao alterar status do cliente ${variables.id}:`, error);
      // Toast de erro genérico pode ser adicionado aqui se desejado
    }
  });

  // Função para navegar para edição
  const handleEdit = (clienteId: string) => {
    navigate(`/app/clientes/${clienteId}/editar`);
  };

  // Abre o AlertDialog de confirmação para Inativar/Reativar (ÚNICO)
  const handleOpenToggleStatusAlert = (cliente: Cliente) => {
    setClienteParaAlterarStatus({ id: cliente.id, ativo: cliente.ativo, nome: cliente.nome });
    resetSelection(); // Garante que não estamos em modo de seleção múltipla
    setIsToggleStatusAlertOpen(true);
  };

  // Função chamada ao confirmar a alteração de status no AlertDialog (ÚNICO)
  const handleConfirmToggleStatus = async () => {
    if (!clienteParaAlterarStatus) return;

    const { id, ativo: statusAtual, nome } = clienteParaAlterarStatus;
    const novoStatus = !statusAtual;

    setIsProcessingBulkAction(true); // Reutiliza o estado de loading
    try {
      await toggleStatusMutation.mutateAsync({ id, novoStatus });

      toast({
        title: `Cliente ${novoStatus ? 'reativado' : 'inativado'}!`,
        description: `O cliente "${nome}" foi ${novoStatus ? 'reativado' : 'inativado'} com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ['clientes'] }); 
      setIsToggleStatusAlertOpen(false); 
      setClienteParaAlterarStatus(null); 

    } catch (error: any) {
      toast({
        title: "Erro ao alterar status",
        description: error.message || `Não foi possível atualizar o status do cliente "${nome}".`,
        variant: "destructive",
      });
    } finally {
      setIsProcessingBulkAction(false);
    }
  };

  // Função para abrir o diálogo de confirmação de AÇÃO EM MASSA
  const openBulkActionConfirmation = (action: 'activate' | 'deactivate') => {
    setBulkActionType(action);
    setClienteParaAlterarStatus(null); // Garante que não estamos em modo único
    setIsBulkActionAlertOpen(true);
  };

  // Função para confirmar a AÇÃO EM MASSA
  const handleConfirmBulkAction = async () => {
    if (!bulkActionType || selectedClientes.size === 0) return;

    const idsToProcess = Array.from(selectedClientes);
    const targetStatus = bulkActionType === 'activate'; // true para ativar, false para inativar
    const actionVerb = targetStatus ? 'reativar' : 'inativar';
    const actionPast = targetStatus ? 'reativado' : 'inativado';

    setIsProcessingBulkAction(true);

    const results = await Promise.allSettled(
      idsToProcess.map(id => toggleStatusMutation.mutateAsync({ id, novoStatus: targetStatus }))
    );

    const successfulActions = results.filter(result => result.status === 'fulfilled').length;
    const failedActions = results.filter(result => result.status === 'rejected');

    if (successfulActions > 0) {
      toast({ 
        title: "Ação em massa concluída!",
        description: `${successfulActions} cliente${successfulActions > 1 ? 's' : ''} ${actionPast}${successfulActions > 1 ? 's' : ''} com sucesso.`
      });
    }

    if (failedActions.length > 0) {
      console.error(`Falhas ao ${actionVerb} clientes:`, failedActions);
      toast({ 
        title: `Erro ao ${actionVerb} ${failedActions.length > 1 ? 'alguns' : 'um'} cliente${failedActions.length > 1 ? 's' : ''}.`,
        description: `Verifique o console para detalhes. ${successfulActions} foram ${actionPast}s.`, 
        variant: "destructive"
       });
    }

    setIsBulkActionAlertOpen(false);
    setBulkActionType(null);
    resetSelection();
    queryClient.invalidateQueries({ queryKey: ['clientes'] });
    setIsProcessingBulkAction(false);
  };

  // Filtra os clientes selecionados para saber quais podem ser ativados/inativados
  const selectedClientesDetails = useMemo(() => { 
    const map = new Map(clientes.map(c => [c.id, c]));
    return Array.from(selectedClientes).map(id => map.get(id)).filter(Boolean) as Cliente[];
  }, [selectedClientes, clientes]);
  
  const canActivateSelected = useMemo(() => selectedClientesDetails.some(c => !c.ativo), [selectedClientesDetails]);
  const canDeactivateSelected = useMemo(() => selectedClientesDetails.some(c => c.ativo), [selectedClientesDetails]);

  return (
    <div className="container mx-auto py-8">
      {/* Cabeçalho centralizado com botão abaixo */}
      <div className="flex flex-col items-center justify-center mb-6 pb-4 border-b w-full">
        <h2 className="text-3xl font-bold font-serif text-[#92400e]">Clientes</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          Gerencie os clientes cadastrados no seu brechó.
        </p>
        
        {/* Botões de ação agora abaixo do título */}
        <div className="flex items-center gap-2 mt-4">
          {selectedClientes.size > 0 && (
            <>
              {canDeactivateSelected && (
                <Button 
                  variant="destructive"
                  onClick={() => openBulkActionConfirmation('deactivate')}
                  disabled={isProcessingBulkAction}
                  className="gap-1.5"
                >
                  <UserX className="h-4 w-4" />
                  Inativar ({selectedClientesDetails.filter(c => c.ativo).length})
                </Button>
              )}
              {canActivateSelected && (
                <Button 
                  variant="outline"
                  onClick={() => openBulkActionConfirmation('activate')}
                  disabled={isProcessingBulkAction}
                  className="gap-1.5"
                >
                  <UserCheck className="h-4 w-4" />
                  Reativar ({selectedClientesDetails.filter(c => !c.ativo).length})
                </Button>
              )}
            </>
          )}
          {/* Botão de adicionar novo cliente */}
          <Button onClick={() => navigate('/app/clientes/novo')} className="bg-[#a16207] hover:bg-[#854d0e] text-white gap-2">
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Cliente
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        {isLoading && <p className="p-4">Carregando clientes...</p>}
        {isError && <p className="text-red-500 p-4">Erro ao carregar clientes: {error?.message}</p>}
        {!isLoading && !isError && clientes.length > 0 && (
           <ClientesTable 
             clientes={clientes} 
             onEdit={handleEdit}
             onToggleStatus={handleOpenToggleStatusAlert}
             selectedItems={selectedClientes}
             onSelectAll={handleSelectAll}
             onSelectSingle={handleSelectSingle}
             selectAllState={selectAllState}
           />
        )}
        {!isLoading && !isError && clientes.length === 0 && (
           <p className="text-center text-muted-foreground py-10">Nenhum cliente cadastrado ainda.</p>
        )}
      </div>

      {/* AlertDialog para Ação Única */}
      <AlertDialog open={isToggleStatusAlertOpen} onOpenChange={setIsToggleStatusAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
              {clienteParaAlterarStatus?.ativo ? 'Confirmar Inativação' : 'Confirmar Reativação'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {clienteParaAlterarStatus?.ativo ? 'inativar' : 'reativar'} o cliente "{clienteParaAlterarStatus?.nome}"?
              {clienteParaAlterarStatus?.ativo ? 
                 ' Clientes inativos não aparecerão em algumas operações, mas seu histórico será mantido.' : 
                 ' O cliente voltará a ser considerado ativo no sistema.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingBulkAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmToggleStatus}
              disabled={isProcessingBulkAction}
              className={clienteParaAlterarStatus?.ativo 
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                : "bg-primary text-primary-foreground hover:bg-primary/90"}
            >
              {isProcessingBulkAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {clienteParaAlterarStatus?.ativo ? 'Confirmar Inativação' : 'Confirmar Reativação'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para Ação em Massa */}
      <AlertDialog open={isBulkActionAlertOpen} onOpenChange={setIsBulkActionAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">
                {bulkActionType === 'activate' ? 'Confirmar Reativação em Massa' : 'Confirmar Inativação em Massa'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {bulkActionType === 'activate' ? 'reativar' : 'inativar'} os <strong>{selectedClientes.size}</strong> clientes selecionados?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingBulkAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmBulkAction}
              disabled={isProcessingBulkAction}
              className={bulkActionType === 'deactivate' 
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                : "bg-primary text-primary-foreground hover:bg-primary/90"}
            >
              {isProcessingBulkAction ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {bulkActionType === 'activate' ? `Reativar (${selectedClientes.size})` : `Inativar (${selectedClientes.size})`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default ClientesPage;
