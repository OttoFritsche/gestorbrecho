import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from "sonner";
import { PlusCircle, Edit, Trash2, MoreHorizontal, FileText, ArrowLeft, Eye, RefreshCw } from "lucide-react";
import { useNavigate } from 'react-router-dom';

import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

import { Receita } from '@/types/financeiro';
import { getReceitas, deleteReceita, getCategoriasReceita, getFormasPagamento } from '@/services/receitas';

// Componente da Página de Receitas atualizado
const ReceitasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [receitaToDelete, setReceitaToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  // Busca de dados com TanStack Query
  const { data: receitas = [], isLoading: isLoadingReceitas, error: errorReceitas } = useQuery<Receita[]>({ // Especifica tipo
    queryKey: ['receitas'],
    queryFn: getReceitas,
  });

  const { data: categorias = [], isLoading: isLoadingCategorias } = useQuery<{ id: string; nome: string }[]>({ // Especifica tipo
    queryKey: ['categoriasReceita'],
    queryFn: getCategoriasReceita,
  });

  const { data: formasPagamento = [], isLoading: isLoadingFormas } = useQuery<{ id: string; nome: string }[]>({ // Especifica tipo
    queryKey: ['formasPagamento'],
    queryFn: getFormasPagamento,
  });

  // Mapeamento para fácil lookup de nomes
  const categoriasMap = useMemo(() => new Map(categorias.map(cat => [cat.id, cat.nome])), [categorias]);
  const formasPagamentoMap = useMemo(() => new Map(formasPagamento.map(fp => [fp.id, fp.nome])), [formasPagamento]);

  // Mutação para exclusão
  const deleteMutation = useMutation({
    mutationFn: deleteReceita,
    onSuccess: () => {
      toast.success("Receita excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['receitas'] });
    },
    onError: (err) => {
      toast.error(`Erro ao excluir receita: ${err.message}`);
    },
    onSettled: () => {
      setShowDeleteDialog(false);
      setReceitaToDelete(null);
    }
  });

  // Handlers para ações
  const handleDeleteClick = (id: string) => {
    setReceitaToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (receitaToDelete) {
      deleteMutation.mutate(receitaToDelete);
    }
  };

  const handleAddClick = () => {
    navigate('/app/receitas/nova');
  };

  const handleEditClick = (receita: Receita) => {
    navigate(`/app/receitas/${receita.id}/editar`);
  };

  // Determina o estado geral de carregamento
  const isLoading = isLoadingReceitas || isLoadingCategorias || isLoadingFormas;

  return (
    <div className="container mx-auto py-6">
      {/* Cabeçalho Centralizado Padronizado */}
      <div className="flex flex-col items-center justify-center pb-4 border-b w-full mb-6">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Receitas</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          Gerencie as receitas do seu brechó.
        </p>
        {/* Botões para Adicionar Receita normal e recorrente */}
        <div className="flex items-center gap-2 mt-2">
          <Button 
            onClick={handleAddClick}
            className="bg-[#a16207] hover:bg-[#854d0e] text-white gap-2"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Receita
          </Button>
          <Button 
            onClick={() => navigate('/app/receitas/recorrente')}
            variant="outline"
            className="border-[#a16207] text-[#a16207] hover:bg-amber-50 gap-2"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Receita Recorrente
          </Button>
        </div>
      </div>

      {/* Feedback de Carregamento e Erro */}
      {isLoading && <p>Carregando dados...</p>}
      {errorReceitas && <p className="text-red-500">Erro ao carregar receitas: {errorReceitas.message}</p>}
      {/* TODO: Adicionar tratamento de erro para categorias e formas de pagamento se necessário */}

      {/* Tabela de Receitas */}
      {!isLoading && !errorReceitas && (
        <Table>
          <TableCaption>Lista das suas últimas receitas.</TableCaption>
          <TableHeader>
            {/* Estilo do cabeçalho mantido do código original */}
            <TableRow>
              <TableHead className="text-[#92400e] bg-[#fef3c7]">Descrição</TableHead>
              <TableHead className="text-[#92400e] bg-[#fef3c7]">Categoria</TableHead>
              <TableHead className="text-[#92400e] bg-[#fef3c7]">Data</TableHead>
              <TableHead className="text-[#92400e] bg-[#fef3c7]">Tipo</TableHead>
              <TableHead className="text-[#92400e] bg-[#fef3c7]">Forma Pag.</TableHead>
              <TableHead className="text-[#92400e] bg-[#fef3c7] w-24">Recorrente</TableHead>
              <TableHead className="text-right text-[#92400e] bg-[#fef3c7]">Valor</TableHead>
              <TableHead className="text-right text-[#92400e] bg-[#fef3c7]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receitas.length === 0 ? (
              // Estado Vazio
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8" />
                    Nenhuma receita adicionada ainda.
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              // Lista de Receitas
              receitas.map((receita) => (
                <TableRow key={receita.id}>
                  <TableCell className="font-medium">{receita.descricao}</TableCell>
                  <TableCell>{categoriasMap.get(receita.categoria_id) || 'N/A'}</TableCell>
                  <TableCell>
                    {/* Formata a data (adiciona +1 dia visualmente se necessário devido a UTC) */}
                     {format(new Date(receita.data + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>{receita.tipo === 'venda' ? 'Venda' : receita.tipo}</TableCell>
                  <TableCell>{formasPagamentoMap.get(receita.forma_pagamento_id ?? '') || '-'}</TableCell>
                  <TableCell>{receita.recorrente ? 'Sim' : 'Não'}</TableCell>
                  <TableCell className="text-right">
                    {receita.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Renderização Condicional das Ações */}
                    {receita.tipo === 'venda' && receita.venda_id ? (
                      // Se for receita de venda, mostra apenas o botão de visualizar
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Visualizar Venda"
                        onClick={() => navigate(`/app/vendas/${receita.venda_id}`)}
                        aria-label="Visualizar Venda"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    ) : (
                      // Se for outro tipo de receita, mostra o DropdownMenu completo
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          {/* Separador opcional se houver mais itens no futuro */}
                          {/* <DropdownMenuSeparator /> */}
                          <DropdownMenuItem onClick={() => handleEditClick(receita)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(receita.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta receita? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ReceitasPage; 