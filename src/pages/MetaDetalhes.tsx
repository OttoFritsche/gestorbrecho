import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  ArrowLeft, Edit, Trash2, PlusCircle, CheckCircle, XCircle, AlertTriangle, Calendar as CalendarIcon, Loader2, Info,
} from 'lucide-react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { Meta, ProgressoMeta } from '@/types/financeiro';
import { getMetaById, getProgressoMeta, addProgressoMeta, deleteMeta } from '@/services/metas';
import { progressoMetaSchema, ProgressoMetaFormData } from '@/lib/validations/metaSchema';
import { formatCurrency, cn } from '@/lib/utils';
import MetaFormDialog from '@/components/financeiro/MetaFormDialog'; // Para edição

// Reutiliza o helper da página de listagem
const calcularDetalhesMeta = (meta: Meta): { percentual: number; diasStatus: number; statusLabel: string; statusVariant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning" } => {
    const hoje = new Date();
    const dataFim = parseISO(meta.data_fim);
    const percentual = meta.valor_meta > 0 ? Math.min(100, Math.round((meta.valor_atual / meta.valor_meta) * 100)) : 0;

    let diasStatus = 0;
    let statusLabel = '';
    let statusVariant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "success" | "warning" = 'secondary';

    if (meta.status === 'atingida') {
        statusLabel = 'Atingida';
        statusVariant = 'success';
        diasStatus = differenceInDays(dataFim, parseISO(meta.data_inicio)); // Dias de duração total
    } else if (meta.status === 'nao_atingida') {
        statusLabel = 'Não Atingida';
        statusVariant = 'destructive';
        diasStatus = differenceInDays(hoje, dataFim); // Dias de atraso
    } else { // Em andamento
        if (dataFim < hoje) {
            statusLabel = 'Atrasada';
            statusVariant = 'warning';
            diasStatus = differenceInDays(hoje, dataFim);
        } else {
            statusLabel = 'Em Andamento';
            statusVariant = 'default';
            diasStatus = differenceInDays(dataFim, hoje); // Dias restantes
        }
    }
    return { percentual, diasStatus, statusLabel, statusVariant };
};

const MetaDetalhesPage: React.FC = () => {
  const { metaId } = useParams<{ metaId: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Busca dados da meta
  const { data: meta, isLoading: isLoadingMeta, error: errorMeta } = useQuery<Meta | null>({
    queryKey: ['meta', metaId],
    queryFn: () => getMetaById(metaId!),
    enabled: !!metaId,
  });

  // Busca histórico de progresso
  const { data: progresso = [], isLoading: isLoadingProgresso } = useQuery<ProgressoMeta[]>({
    queryKey: ['progressoMeta', metaId],
    queryFn: () => getProgressoMeta(metaId!),
    enabled: !!metaId,
  });

  // Formulário para adicionar progresso
  const progressoForm = useForm<ProgressoMetaFormData>({
    resolver: zodResolver(progressoMetaSchema),
    defaultValues: {
      valor: meta?.valor_atual ?? 0, // Inicia com valor atual
      data: new Date(),
      observacao: '',
    },
  });

   // Reseta o form quando a meta carrega ou muda
   React.useEffect(() => {
    if (meta) {
      progressoForm.reset({ valor: meta.valor_atual, data: new Date(), observacao: '' });
    }
  }, [meta, progressoForm]);

  // Mutação para adicionar progresso
  const addProgressoMutation = useMutation({
    mutationFn: addProgressoMeta,
    onSuccess: () => {
      toast.success('Progresso adicionado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['meta', metaId] });
      queryClient.invalidateQueries({ queryKey: ['progressoMeta', metaId] });
      queryClient.invalidateQueries({ queryKey: ['metas'] }); // Invalida lista geral também
      progressoForm.reset(); // Limpa o form de progresso
    },
    onError: (error) => {
      toast.error(`Erro ao adicionar progresso: ${error.message}`);
    },
  });

   // Mutação para exclusão (reutilizada da página de lista)
   const deleteMutation = useMutation({
     mutationFn: deleteMeta,
     onSuccess: () => {
       toast.success("Meta excluída com sucesso!");
       queryClient.invalidateQueries({ queryKey: ['metas'] });
       navigate('/app/metas'); // Volta para a lista após excluir
     },
     onError: (err) => {
       toast.error(`Erro ao excluir meta: ${err.message}`);
     },
     onSettled: () => {
       setShowDeleteDialog(false);
     }
   });

  const handleAddProgresso = (data: ProgressoMetaFormData) => {
    if (!metaId) return;
    addProgressoMutation.mutate({ ...data, meta_id: metaId });
  };

  const confirmDelete = () => {
    if (meta?.id) {
      deleteMutation.mutate(meta.id);
    }
  };

  const isLoading = isLoadingMeta || isLoadingProgresso;

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 flex justify-center items-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMeta) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Não foi possível carregar os detalhes da meta: {errorMeta.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p>Meta não encontrada.</p>
        <Button asChild variant="link">
          <Link to="/app/metas"><ArrowLeft className="mr-2 h-4 w-4" />Voltar para Metas</Link>
        </Button>
      </div>
    );
  }

  const { percentual, diasStatus, statusLabel, statusVariant } = calcularDetalhesMeta(meta);

  return (
    <div className="container mx-auto py-8 space-y-6">
       {/* Navegação e Ações */}
       <div className="flex justify-between items-center">
         <Button variant="outline" size="sm" asChild>
           <Link to="/app/metas">
             <ArrowLeft className="mr-2 h-4 w-4" />
             Voltar para Metas
           </Link>
         </Button>
         <div className="flex gap-2">
           <Button variant="outline" size="sm" onClick={() => setShowEditDialog(true)}>
             <Edit className="mr-2 h-4 w-4" /> Editar Meta
           </Button>
           <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
             <Trash2 className="mr-2 h-4 w-4" /> Excluir Meta
           </Button>
         </div>
       </div>

      {/* Card Principal de Detalhes */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
             <CardTitle className="text-2xl font-bold font-serif text-[#92400e]">{meta.nome}</CardTitle>
             <Badge variant={statusVariant} className="text-sm">{statusLabel}</Badge>
          </div>
           <CardDescription>{meta.descricao || 'Sem descrição detalhada.'}</CardDescription>
           <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground pt-2">
              <span>Tipo: <Badge variant="secondary">{meta.tipo}</Badge></span>
              <span>Período: <Badge variant="secondary">{meta.periodo}</Badge></span>
              <span>Início: {format(parseISO(meta.data_inicio), 'dd/MM/yyyy')}</span>
              <span>Fim: {format(parseISO(meta.data_fim), 'dd/MM/yyyy')}</span>
           </div>
        </CardHeader>
        <CardContent className="space-y-4">
           <Separator />
           <div className="flex justify-between items-center">
             <span className="text-lg font-medium">Progresso: {percentual}%</span>
             <span className="text-lg font-semibold">{formatCurrency(meta.valor_atual)} / {formatCurrency(meta.valor_meta)}</span>
           </div>
           <Progress value={percentual} className="h-3" />
           <div className="text-center text-muted-foreground text-sm">
             {meta.status === 'atingida' && `Meta atingida em ${diasStatus} dias!`}
             {meta.status === 'andamento' && parseISO(meta.data_fim) >= new Date() && `Faltam ${diasStatus} dias`}
             {(meta.status === 'nao_atingida' || (meta.status === 'andamento' && parseISO(meta.data_fim) < new Date())) && `${diasStatus} dias de atraso`}
           </div>
           {meta.observacoes && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Observações</AlertTitle>
                  <AlertDescription>{meta.observacoes}</AlertDescription>
                </Alert>
           )}
        </CardContent>
      </Card>

      {/* Seção para Adicionar Progresso */}
      <Card>
         <CardHeader>
           <CardTitle className="text-lg">Adicionar Progresso</CardTitle>
           <CardDescription>Registre um novo valor alcançado para esta meta.</CardDescription>
         </CardHeader>
         <CardContent>
           <Form {...progressoForm}>
             <form onSubmit={progressoForm.handleSubmit(handleAddProgresso)} className="flex flex-col md:flex-row gap-4 items-start">
               <FormField
                 control={progressoForm.control}
                 name="valor"
                 render={({ field }) => (
                   <FormItem className="flex-1">
                     <FormLabel>Novo Valor Atingido</FormLabel>
                     <FormControl>
                       <Input type="text" inputMode="decimal" placeholder={formatCurrency(meta.valor_atual)} {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <FormField
                 control={progressoForm.control}
                 name="data"
                 render={({ field }) => (
                   <FormItem className="flex flex-col">
                     <FormLabel>Data do Progresso</FormLabel>
                     <Popover>
                       <PopoverTrigger asChild>
                         <FormControl>
                           <Button
                             variant={"outline"}
                             className={cn("w-[180px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                           >
                             {field.value ? format(field.value, "dd/MM/yyyy", { locale: ptBR }) : <span>Escolha data</span>}
                             <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                           </Button>
                         </FormControl>
                       </PopoverTrigger>
                       <PopoverContent className="w-auto p-0" align="start">
                         <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={ptBR} />
                       </PopoverContent>
                     </Popover>
                     <FormMessage />
                   </FormItem>
                 )}
               />
                <FormField
                 control={progressoForm.control}
                 name="observacao"
                 render={({ field }) => (
                   <FormItem className="flex-1">
                     <FormLabel>Observação (Opcional)</FormLabel>
                     <FormControl>
                       <Input placeholder="Ex: Depósito mensal, Vendas da semana" {...field} value={field.value ?? ''} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
               <Button type="submit" disabled={addProgressoMutation.isPending} className="mt-auto md:mt-[28px]"> {/* Alinha botão */}
                 {addProgressoMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
                 Adicionar
               </Button>
             </form>
           </Form>
         </CardContent>
       </Card>

      {/* Histórico de Progresso */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Progresso</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>Registros de atualização do valor da meta.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor Registrado</TableHead>
                <TableHead>Observação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingProgresso ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : progresso.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Nenhum progresso registrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                progresso.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{format(parseISO(p.data), 'dd/MM/yyyy')}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.valor)}</TableCell>
                    <TableCell>{p.observacao || '-'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

       {/* Diálogo de Edição (reutiliza o form dialog) */}
       {meta && (
         <MetaFormDialog
           open={showEditDialog}
           onOpenChange={setShowEditDialog}
           metaToEdit={meta}
         />
       )}

        {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a meta "{meta?.nome}"?
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

export default MetaDetalhesPage; 