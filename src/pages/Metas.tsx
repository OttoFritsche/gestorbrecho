import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom'; // Para linkar para detalhes e navegar
import { format, differenceInDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash2, Eye, ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Para filtrar status
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

import { Meta } from '@/types/financeiro';
import { getMetas, deleteMeta } from '@/services/metas';
import { formatCurrency } from '@/lib/utils';

// Helper para calcular progresso e status
const calcularDetalhesMeta = (meta: Meta): {
  percentual: number;
  diasStatus: number;
  statusLabel: string;
  statusVariant: "default" | "destructive" | "outline" | "secondary" | "success" | "warning";
  dataFim: Date;
} => {
  const hoje = new Date();
  const dataFim = parseISO(meta.data_fim);
  const percentual = meta.valor_meta > 0 ? Math.min(100, Math.round((meta.valor_atual / meta.valor_meta) * 100)) : 0;

  let diasStatus = 0;
  let statusLabel = '';
  let statusVariant: "default" | "destructive" | "outline" | "secondary" | "success" | "warning" = 'secondary';

  if (meta.status === 'atingida') {
    statusLabel = 'Atingida';
    statusVariant = 'success';
    diasStatus = 0;
  } else if (meta.status === 'nao_atingida') {
     statusLabel = 'Não Atingida';
     statusVariant = 'destructive';
     diasStatus = differenceInDays(hoje, dataFim);
  } else {
    if (dataFim < hoje) {
        statusLabel = 'Atrasada';
        statusVariant = 'warning';
        diasStatus = differenceInDays(hoje, dataFim);
    } else {
        statusLabel = 'Em Andamento';
        statusVariant = 'default';
        diasStatus = differenceInDays(dataFim, hoje);
    }
  }

  return { percentual, diasStatus, statusLabel, statusVariant, dataFim };
};

const MetasPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [statusFiltro, setStatusFiltro] = useState<'todas' | 'andamento' | 'atingida' | 'nao_atingida'>('todas');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [metaToDelete, setMetaToDelete] = useState<Meta | null>(null);

  // Busca de dados com TanStack Query, refetch quando filtro muda
  const { data: metas = [], isLoading, error } = useQuery<Meta[]>({ // Especifica tipo
    queryKey: ['metas', statusFiltro],
    queryFn: () => getMetas(statusFiltro),
  });

  // Mutação para exclusão
  const deleteMutation = useMutation({
    mutationFn: deleteMeta,
    onSuccess: () => {
      toast.success("Meta excluída com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['metas'] }); // Invalida todas as queries de metas
    },
    onError: (err) => {
      toast.error(`Erro ao excluir meta: ${err.message}`);
    },
    onSettled: () => {
      setShowDeleteDialog(false);
      setMetaToDelete(null);
    }
  });

  // Handlers para ações
  const handleDeleteClick = (meta: Meta) => {
    setMetaToDelete(meta);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (metaToDelete) {
      deleteMutation.mutate(metaToDelete.id);
    }
  };

  return (
    <div className="container mx-auto py-6">
      {/* Cabeçalho Centralizado Padronizado */}
      <div className="flex flex-col items-center justify-center pb-4 border-b w-full mb-6">
        <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">Metas Financeiras</h2>
        <p className="text-muted-foreground mt-1 mb-4">
          Defina e acompanhe seus objetivos financeiros.
        </p>
        {/* Botão Criar Nova Meta abaixo e estilizado */}
        <div className="flex items-center gap-2 mt-2">
          <Button 
            onClick={() => navigate('/app/metas/nova')}
            className="bg-[#a16207] hover:bg-[#854d0e] text-white gap-2"
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Nova Meta
          </Button>
        </div>
      </div>

      {/* Filtro de Status */}
      <Tabs value={statusFiltro} onValueChange={(value) => setStatusFiltro(value as any)} className="mb-6">
        <TabsList>
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="andamento">Em Andamento</TabsTrigger>
          <TabsTrigger value="atingida">Atingidas</TabsTrigger>
          <TabsTrigger value="nao_atingida">Não Atingidas / Atrasadas</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Feedback de Carregamento e Erro */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Carregando metas...</span>
        </div>
      )}
      {error && (
        <div className="flex justify-center items-center py-10 text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          <span>Erro ao carregar metas: {error.message}</span>
        </div>
      )}

      {/* Grid de Metas */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metas.length === 0 ? (
            <p className="col-span-full text-center text-muted-foreground py-10">Nenhuma meta encontrada para este filtro.</p>
          ) : (
            metas.map((meta) => {
              const { percentual, diasStatus, statusLabel, statusVariant, dataFim } = calcularDetalhesMeta(meta);
              return (
                <Card key={meta.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="font-serif text-lg mb-1">{meta.nome}</CardTitle>
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                    </div>
                    <CardDescription>{meta.descricao || 'Sem descrição detalhada.'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span>Progresso:</span>
                      <span className="font-semibold">{formatCurrency(meta.valor_atual)} / {formatCurrency(meta.valor_meta)}</span>
                    </div>
                    <Progress value={percentual} aria-label={`${percentual}% concluído`} />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                       <span>Início: {format(parseISO(meta.data_inicio), 'dd/MM/yy')}</span>
                       <span>Fim: {format(dataFim, 'dd/MM/yy')}</span>
                     </div>
                      <div className="text-xs text-muted-foreground text-center">
                         {meta.status === 'atingida' && `Concluída`}
                         {meta.status === 'andamento' && dataFim >= new Date() && `${diasStatus} dias restantes`}
                         {(meta.status === 'nao_atingida' || (meta.status === 'andamento' && dataFim < new Date())) && `${diasStatus} dias de atraso`}
                      </div>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                     <Button variant="outline" size="sm" asChild>
                       <Link to={`/app/metas/${meta.id}`}>
                         <Eye className="mr-1 h-4 w-4" /> Detalhes
                       </Link>
                     </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(`/app/metas/${meta.id}/editar`)}>
                       <Edit className="h-4 w-4" />
                       <span className="sr-only">Editar Meta</span>
                     </Button>
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDeleteClick(meta)}>
                       <Trash2 className="h-4 w-4" />
                       <span className="sr-only">Excluir Meta</span>
                     </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{metaToDelete?.nome}"?
              Todo o histórico de progresso será perdido. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending} className="bg-red-600 hover:bg-red-700">
              {deleteMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Excluir Meta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default MetasPage; 