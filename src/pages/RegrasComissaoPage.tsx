import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { PlusCircle, Edit, Trash2, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table'; // Assumindo que você tem um componente DataTable
import { columns } from '@/components/comissoes/regras/columns'; // Definiremos as colunas em um arquivo separado
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorDisplay from '@/components/ui/error-display';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

import { getRegrasComissao, setRegraComissaoStatus } from '@/services/regrasComissaoService';
import { RegraComissao } from '@/types/comissao';

const RegrasComissaoPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: regras = [], isLoading, isError, error } = useQuery<RegraComissao[], Error>({
    queryKey: ['regrasComissao'],
    queryFn: getRegrasComissao,
  });

  const mutation = useMutation({
    mutationFn: ({ id, ativa }: { id: string; ativa: boolean }) => setRegraComissaoStatus(id, ativa),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['regrasComissao'] });
      toast.success(`Regra "${data.nome}" ${variables.ativa ? 'ativada' : 'desativada'} com sucesso!`);
    },
    onError: (error: Error) => {
      toast.error(`Erro ao alterar status da regra: ${error.message}`);
    },
  });

  const handleToggleStatus = (id: string, nome: string, currentStatus: boolean) => {
    mutation.mutate({ id, ativa: !currentStatus });
  };

  if (isLoading) {
    return <LoadingSpinner className="mt-20" />;
  }

  if (isError) {
    return <ErrorDisplay error={error} title="Erro ao carregar Regras de Comissão" />;
  }

  // Adiciona a função de toggle às colunas
  const tableColumns = columns({ 
    onEdit: (id) => navigate(`/app/comissoes/regras/${id}/editar`), 
    onToggleStatus: handleToggleStatus
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b w-full">
        {/* Botão Voltar */}
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(-1)} 
          aria-label="Voltar"
          className="flex-shrink-0" 
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Button>
        {/* Bloco Título/Subtítulo Centralizado */}
        <div className="flex-grow text-center px-4"> 
          <h2 className="text-3xl font-bold font-serif text-[#92400e]">Regras de Comissão</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie as regras utilizadas para calcular as comissões dos vendedores.
          </p>
        </div>
        {/* Espaço reservado para manter a centralização */}
        <div className="w-[40px] flex-shrink-0"></div>
      </div>
      {/* Botão Nova Regra centralizado */}
      <div className="flex justify-center mb-6">
        <Button onClick={() => navigate('/app/comissoes/regras/nova')} className="bg-[#a16207] hover:bg-[#854d0e] text-white">
          <PlusCircle className="mr-2 h-4 w-4" /> Nova Regra
        </Button>
      </div>

      <DataTable columns={tableColumns} data={regras} searchKey="nome" />
    </div>
  );
};

export default RegrasComissaoPage; 