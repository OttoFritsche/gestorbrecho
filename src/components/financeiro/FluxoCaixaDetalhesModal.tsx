import React, { useMemo, useEffect, useState, Fragment } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatInTimeZone, utcToZonedTime } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/constants';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  ShoppingBag,
  Receipt,
  Banknote,
  Info,
  Tag,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ArrowDown,
  MoveDown,
  Trash2
} from "lucide-react";

import { getMovimentosCaixaPorDia, excluirMovimentoCaixa } from '@/services/fluxoCaixa';
import { MovimentoCaixa } from '@/types/financeiro';
import { formatCurrency, formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FluxoCaixaDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string | null; // Data no formato ISO string (UTC)
}

const FluxoCaixaDetalhesModal: React.FC<FluxoCaixaDetalhesModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
}) => {
  const [expandedItems, setExpandedItems] = useState<{[key: string]: boolean}>({});
  const [movimentoParaExcluir, setMovimentoParaExcluir] = useState<string | null>(null);
  const [confirmarExclusaoAberto, setConfirmarExclusaoAberto] = useState(false);
  const queryClient = useQueryClient();
  
  // Toggle função para expandir/colapsar um item
  const toggleItemExpansion = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Query para carregar os movimentos do fluxo de caixa da data selecionada
  const { 
    data: movimentos = [], 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['movimentos_caixa', selectedDate],
    queryFn: () => selectedDate ? getMovimentosCaixaPorDia(selectedDate) : Promise.resolve([]),
    enabled: !!selectedDate && isOpen,
  });

  // Quando o modal fechar, resetar os itens expandidos
  useEffect(() => {
    if (!isOpen) {
      setExpandedItems({});
    }
  }, [isOpen]);

  // Formata o título do modal com a data selecionada, forçando timezone BR
  const formattedDate = useMemo(() => {
    if (!selectedDate) return '';
    try {
      // Parseia a string ISO para um objeto Date
      const dateObject = parseISO(selectedDate);
      // Converte para o fuso horário do Brasil
      const dataBrasil = utcToZonedTime(dateObject, TIMEZONE);
      // Formata para exibição
      return format(dataBrasil, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (e) {
      console.error("[FluxoCaixaDetalhesModal] Erro ao formatar data para o título:", e, "Data recebida:", selectedDate);
      return 'Data inválida';
    }
  }, [selectedDate]);

  // Função para formatar a hora a partir do created_at (ISO string UTC) no fuso do Brasil
  const formatTime = (createdAtISO: string) => {
    try {
      const dateObject = parseISO(createdAtISO);
      const dataBrasil = utcToZonedTime(dateObject, TIMEZONE);
      return format(dataBrasil, 'HH:mm:ss', { locale: ptBR });
    } catch (e) {
      console.error("Erro ao formatar hora:", e);
      return '--:--:--';
    }
  };

  // Separar os movimentos por tipo
  const { entradas, saidas, totalEntradas, totalSaidas } = useMemo(() => {
    const entradas = movimentos.filter(m => m.tipo === 'entrada');
    const saidas = movimentos.filter(m => m.tipo === 'saida');
    
    const totalEntradas = entradas.reduce((sum, m) => sum + Number(m.valor || 0), 0);
    const totalSaidas = saidas.reduce((sum, m) => sum + Number(m.valor || 0), 0);
    
    return { entradas, saidas, totalEntradas, totalSaidas };
  }, [movimentos]);

  // Mutation para excluir movimento
  const excluirMovimentoMutation = useMutation({
    mutationFn: excluirMovimentoCaixa,
    onSuccess: () => {
      toast.success("Movimento excluído com sucesso");
      queryClient.invalidateQueries({ queryKey: ['movimentos_caixa', selectedDate] });
      queryClient.invalidateQueries({ queryKey: ['fluxoCaixaPeriodo'] });
      queryClient.invalidateQueries({ queryKey: ['saldoInicial'] });
      setConfirmarExclusaoAberto(false);
      setMovimentoParaExcluir(null);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir movimento: ${error}`);
      setConfirmarExclusaoAberto(false);
    }
  });

  // Função para abrir o diálogo de confirmação de exclusão
  const abrirConfirmacaoExclusao = (movimentoId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Impedir que o clique propague para o item pai
    setMovimentoParaExcluir(movimentoId);
    setConfirmarExclusaoAberto(true);
  };

  // Função para confirmar exclusão
  const confirmarExclusao = () => {
    if (movimentoParaExcluir) {
      excluirMovimentoMutation.mutate(movimentoParaExcluir);
    }
  };

  // Função para obter descrição simplificada (mantida como utilitária)
  const getDescricaoSimplificada = (mov: MovimentoCaixa, tipoAba: 'todos' | 'entradas' | 'saidas') => {
    if (tipoAba === 'entradas' || tipoAba === 'todos') {
      if (mov.venda_id && mov.venda_itens_detalhes && mov.venda_itens_detalhes.length > 0) {
        const primeiroItemNome = mov.venda_itens_detalhes[0].produtos?.nome || "Item";
        const temMaisItens = mov.venda_itens_detalhes.length > 1;
        return `Venda: ${primeiroItemNome}${temMaisItens ? ' (+...)' : ''}`;
      } else if (mov.venda_id) {
        return "Recebimento Venda";
      } else if (mov.pagamento_prazo_id && mov.descricao?.toLowerCase().includes('venda')) {
        return "Recebimento Parcela (Venda)";
      } else if (mov.receita_id && mov.categoria?.nome) {
        return `Recebimento: ${mov.categoria.nome}`;
      } else if (mov.receita_id) {
        return mov.descricao || "Recebimento Avulso";
      }
    }

    if (tipoAba === 'saidas' || tipoAba === 'todos') {
      if (mov.pagamento_prazo_id) {
        return "Pagamento Parcela";
      } else if (mov.despesa_id && mov.categoria?.nome) {
        return `Pagamento Despesa: ${mov.categoria.nome}`;
      } else if (mov.despesa_id) {
        return mov.descricao?.split('#')[0].trim() || "Pagamento Despesa";
      }
    } 

    // Fallback geral (considera o tipo do movimento como último recurso)
    if (tipoAba === 'entradas') return mov.descricao || "Entrada";
    if (tipoAba === 'saidas') return mov.descricao || "Saída";
    return mov.descricao || "Lançamento";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-[1100px] h-[90vh] max-h-[900px] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 mb-2 border-b shrink-0">
          <div className="flex items-center gap-3 text-xl sm:text-2xl font-semibold text-[#92400e]">
            <Calendar className="h-6 w-6 sm:h-7 sm:w-7" />
            <DialogTitle>Detalhes do Fluxo de Caixa - {formattedDate}</DialogTitle>
          </div>
          <DialogDescription className="text-sm mt-1">
            Movimentos financeiros registrados no dia selecionado.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-10 flex-grow">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando movimentos...</span>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center py-10 text-red-500 flex-grow">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>Erro ao carregar os movimentos financeiros.</span>
          </div>
        ) : (
          <div className="flex flex-col flex-grow overflow-hidden px-6">
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 gap-3 sm:gap-5 mb-4 shrink-0">
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="py-3 pb-1">
                  <CardTitle className="text-base font-medium flex items-center gap-2 text-green-700">
                    <TrendingUp className="h-5 w-5" /> 
                    Entradas do Dia
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 pb-3">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600">
                    {formatCurrency(totalEntradas)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {entradas.length} movimento{entradas.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="py-3 pb-1">
                  <CardTitle className="text-base font-medium flex items-center gap-2 text-red-700">
                    <TrendingDown className="h-5 w-5" /> 
                    Saídas do Dia
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 pb-3">
                  <div className="text-2xl sm:text-3xl font-bold text-red-600">
                    {formatCurrency(totalSaidas)}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {saidas.length} movimento{saidas.length !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>
            </div>

            {!isLoading && !isError && movimentos.length === 0 && (
              <div className="text-center py-8 text-muted-foreground flex flex-col items-center flex-grow">
                <Info className="h-10 w-10 mb-4 text-muted-foreground/60" />
                <p>Nenhum movimento encontrado para este dia.</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  As movimentações financeiras aparecerão aqui quando houver registro de
                  vendas, recebimentos, pagamentos ou outros lançamentos financeiros nesta data.
                </p>
              </div>
            )}

            <Tabs defaultValue="todos" className="flex-grow flex flex-col overflow-hidden">
              <TabsList className="grid w-full grid-cols-3 shrink-0">
                <TabsTrigger value="todos" className="py-2 text-base">Todos</TabsTrigger>
                <TabsTrigger value="entradas" className="py-2 text-base">Entradas</TabsTrigger>
                <TabsTrigger value="saidas" className="py-2 text-base">Saídas</TabsTrigger>
              </TabsList>

              {/* Container principal com overflow */}
              <div className="mt-3 flex-grow relative overflow-hidden border rounded-md">
                {/* Lista simples para telas menores */}
                <div className="md:hidden h-[calc(100%-24px)] overflow-y-auto scrollbar-thin">
                  <TabsContent value="todos" className="m-0 p-0 h-full data-[state=active]:block">
                    {movimentos.length === 0 ? (
                      <div className="p-8 text-center">
                        <Info className="h-8 w-8 mb-2 text-muted mx-auto" />
                        <p>Nenhum movimento registrado neste dia.</p>
                      </div>
                    ) : (
                      <div className="pb-24">
                        {movimentos.map((movimento) => (
                          <Fragment key={movimento.id}>
                            <TableRow className={`group hover:bg-muted/20`}>
                              {/* Célula: Hora */}
                              <TableCell className="font-mono text-sm py-3 align-top">{movimento.created_at ? formatTime(movimento.created_at) : '--:--:--'}</TableCell>
                              {/* Célula: Tipo */}
                              <TableCell className="py-3 align-top">
                                <Badge
                                  variant="outline"
                                  className={`px-2 py-0.5 text-xs ${
                                    movimento.tipo === 'entrada' ? 'border-green-500 bg-green-50 text-green-700' : ''
                                  } ${movimento.tipo === 'saida' ? 'border-red-500 bg-red-50 text-red-700' : ''}`}
                                >
                                  {movimento.tipo === 'entrada' ? <><TrendingUp className="h-3 w-3 mr-1 inline" /> Entrada</> : <><TrendingDown className="h-3 w-3 mr-1 inline" /> Saída</>}
                                </Badge>
                              </TableCell>
                              {/* Célula: Descrição */}
                              <TableCell className="py-3 align-top">
                                <div className="text-sm font-medium">{getDescricaoSimplificada(movimento, 'todos')}</div>
                                {movimento.observacoes && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={movimento.observacoes}>{movimento.observacoes}</div>}
                              </TableCell>
                              {/* Célula: Categoria */}
                              <TableCell className="text-right py-3 align-top">
                                {(movimento.categoria_id && movimento.categoria?.nome) ? <Badge variant="outline" className="text-xs">{movimento.categoria.nome}</Badge> : movimento.venda_id ? <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-300">Venda</Badge> : <span className="text-xs text-muted-foreground">N/A</span>}
                              </TableCell>
                              {/* Célula: Forma Pagto. */}
                              <TableCell className="text-right py-3 align-top">
                                {movimento.forma_pagamento_nome ? <span className="text-sm">{movimento.forma_pagamento_nome}</span> : <span className="text-xs text-muted-foreground">N/A</span>}
                              </TableCell>
                              {/* Célula: Valor */}
                              <TableCell className={`text-right font-mono font-medium text-base py-3 align-top ${movimento.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(Number(movimento.valor) || 0)}</TableCell>
                              {/* Célula: Ações */}
                              <TableCell className="text-center py-3 align-top">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => abrirConfirmacaoExclusao(movimento.id, e)} title="Excluir movimento"><Trash2 className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleItemExpansion(movimento.id); }} title={expandedItems[movimento.id] ? "Recolher detalhes" : "Expandir detalhes"}>{expandedItems[movimento.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {/* Linha Expansível (Todos) */}
                            {expandedItems[movimento.id] && (
                              <TableRow className="bg-muted/10 hover:bg-muted/20 border-t-0">
                                <TableCell className="py-2"></TableCell> {/* Hora */}
                                <TableCell className="py-2"></TableCell> {/* Tipo */}
                                <TableCell colSpan={5} className="py-2 pl-4 pr-2">
                                  {/* ... Conteúdo dos detalhes ... */} 
                                  <div className="pt-1 pb-1">
                                      {/* IDs e detalhes dos produtos */} 
                                      {movimento.venda_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1"><ShoppingBag className="h-3 w-3 text-[#92400e]" /><span className="font-medium">Venda ID:</span><span className="font-mono break-all">{movimento.venda_id}</span></div>)}
                                      {movimento.venda_id && movimento.venda_itens_detalhes && movimento.venda_itens_detalhes.length > 0 && (<div className="mt-1"><div className="text-xs font-medium mb-0.5">Produtos da Venda:</div><ul className="text-xs text-muted-foreground pl-4">{movimento.venda_itens_detalhes.map((item, index) => (<li key={index} className="list-disc">{item.produtos?.nome || 'Item sem nome'}<span className="font-mono"> x{item.quantidade}</span>{item.preco_unitario && (<span className="ml-1">({formatCurrency(Number(item.preco_unitario))})</span>)}</li>))}</ul></div>)}
                                      {movimento.receita_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><Banknote className="h-3 w-3 text-green-600" /><span className="font-medium">Receita ID:</span><span className="font-mono break-all">{movimento.receita_id}</span></div>)}
                                      {movimento.despesa_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><Receipt className="h-3 w-3 text-red-600" /><span className="font-medium">Despesa ID:</span><span className="font-mono break-all">{movimento.despesa_id}</span></div>)}
                                      {movimento.pagamento_prazo_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><CreditCard className="h-3 w-3 text-blue-600" /><span className="font-medium">Parcela ID:</span><span className="font-mono break-all">{movimento.pagamento_prazo_id}</span></div>)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="entradas" className="m-0 p-0 h-full data-[state=active]:block">
                    {entradas.length === 0 ? (
                      <div className="p-8 text-center">
                        <TrendingUp className="h-8 w-8 mb-2 text-muted mx-auto" />
                        <p>Nenhuma entrada registrada neste dia.</p>
                      </div>
                    ) : (
                      <div className="pb-24">
                        {entradas.map((movimento) => (
                          <Fragment key={movimento.id}>
                            <TableRow className={`group hover:bg-green-50/30`}>
                              {/* Célula: Hora */}
                              <TableCell className="font-mono text-sm py-3 align-top">{movimento.created_at ? formatTime(movimento.created_at) : '--:--:--'}</TableCell>
                              {/* Célula: Descrição */}
                              <TableCell className="py-3 align-top">
                                <div className="text-sm font-medium">{getDescricaoSimplificada(movimento, 'entradas')}</div>
                                {movimento.observacoes && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={movimento.observacoes}>{movimento.observacoes}</div>}
                              </TableCell>
                              {/* Célula: Categoria */}
                              <TableCell className="text-right py-3 align-top">
                                {(movimento.categoria_id && movimento.categoria?.nome) ? <Badge variant="outline" className="text-xs">{movimento.categoria.nome}</Badge> : movimento.venda_id ? <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-300">Venda</Badge> : <span className="text-xs text-muted-foreground">N/A</span>}
                              </TableCell>
                              {/* Célula: Forma Pagto. */}
                              <TableCell className="text-right py-3 align-top">
                                {movimento.forma_pagamento_nome ? <span className="text-sm">{movimento.forma_pagamento_nome}</span> : <span className="text-xs text-muted-foreground">N/A</span>}
                              </TableCell>
                              {/* Célula: Valor */}
                              <TableCell className={`text-right font-mono font-medium text-base text-green-600 py-3 align-top`}>{formatCurrency(Number(movimento.valor) || 0)}</TableCell>
                              {/* Célula: Ações */}
                              <TableCell className="text-center py-3 align-top">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => abrirConfirmacaoExclusao(movimento.id, e)} title="Excluir movimento"><Trash2 className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleItemExpansion(movimento.id); }} title={expandedItems[movimento.id] ? "Recolher detalhes" : "Expandir detalhes"}>{expandedItems[movimento.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {/* Linha Expansível (Entradas) */}
                            {expandedItems[movimento.id] && (
                              <TableRow className="bg-muted/10 hover:bg-muted/20 border-t-0">
                                <TableCell className="py-2"></TableCell> {/* Hora */}
                                <TableCell colSpan={5} className="py-2 pl-4 pr-2"> {/* Descrição, Cat, Forma, Valor, Ações */} 
                                  <div className="pt-1 pb-1">
                                      {/* Detalhes relevantes para Entradas */} 
                                      {movimento.venda_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1"><ShoppingBag className="h-3 w-3 text-[#92400e]" /><span className="font-medium">Venda ID:</span><span className="font-mono break-all">{movimento.venda_id}</span></div>)}
                                      {movimento.venda_id && movimento.venda_itens_detalhes && movimento.venda_itens_detalhes.length > 0 && (<div className="mt-1"><div className="text-xs font-medium mb-0.5">Produtos da Venda:</div><ul className="text-xs text-muted-foreground pl-4">{movimento.venda_itens_detalhes.map((item, index) => (<li key={index} className="list-disc">{item.produtos?.nome || 'Item sem nome'}<span className="font-mono"> x{item.quantidade}</span>{item.preco_unitario && (<span className="ml-1">({formatCurrency(Number(item.preco_unitario))})</span>)}</li>))}</ul></div>)}
                                      {movimento.receita_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><Banknote className="h-3 w-3 text-green-600" /><span className="font-medium">Receita ID:</span><span className="font-mono break-all">{movimento.receita_id}</span></div>)}
                                      {movimento.pagamento_prazo_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><CreditCard className="h-3 w-3 text-blue-600" /><span className="font-medium">Parcela ID (Entrada):</span><span className="font-mono break-all">{movimento.pagamento_prazo_id}</span></div>)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="saidas" className="m-0 p-0 h-full data-[state=active]:block">
                    {saidas.length === 0 ? (
                      <div className="p-8 text-center">
                        <TrendingDown className="h-8 w-8 mb-2 text-muted mx-auto" />
                        <p>Nenhuma saída registrada neste dia.</p>
                      </div>
                    ) : (
                      <div className="pb-24">
                        {saidas.map((movimento) => (
                          <Fragment key={movimento.id}>
                            <TableRow className={`group hover:bg-red-50/30`}>
                              {/* Célula: Hora */}
                              <TableCell className="font-mono text-sm py-3 align-top">{movimento.created_at ? formatTime(movimento.created_at) : '--:--:--'}</TableCell>
                              {/* Célula: Descrição */}
                              <TableCell className="py-3 align-top">
                                <div className="text-sm font-medium">{getDescricaoSimplificada(movimento, 'saidas')}</div>
                                {movimento.observacoes && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={movimento.observacoes}>{movimento.observacoes}</div>}
                              </TableCell>
                              {/* Célula: Categoria */}
                              <TableCell className="text-right py-3 align-top">
                                {movimento.categoria?.nome ? <Badge variant="outline" className="text-xs">{movimento.categoria.nome}</Badge> : <span className="text-xs text-muted-foreground">N/A</span>}
                              </TableCell>
                              {/* Célula: Forma Pagto. */}
                              <TableCell className="text-right py-3 align-top">
                                {movimento.forma_pagamento_nome ? <span className="text-sm">{movimento.forma_pagamento_nome}</span> : <span className="text-xs text-muted-foreground">N/A</span>}
                              </TableCell>
                              {/* Célula: Valor */}
                              <TableCell className={`text-right font-mono font-medium text-base text-red-600 py-3 align-top`}>{formatCurrency(Number(movimento.valor) || 0)}</TableCell>
                              {/* Célula: Ações */}
                              <TableCell className="text-center py-3 align-top">
                                <div className="flex items-center justify-center gap-1">
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => abrirConfirmacaoExclusao(movimento.id, e)} title="Excluir movimento"><Trash2 className="h-3.5 w-3.5" /></Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleItemExpansion(movimento.id); }} title={expandedItems[movimento.id] ? "Recolher detalhes" : "Expandir detalhes"}>{expandedItems[movimento.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
                                </div>
                              </TableCell>
                            </TableRow>
                            {/* Linha Expansível (Saídas) */}
                            {expandedItems[movimento.id] && (
                              <TableRow className="bg-muted/10 hover:bg-muted/20 border-t-0">
                                <TableCell className="py-2"></TableCell> {/* Hora */} 
                                <TableCell colSpan={5} className="py-2 pl-4 pr-2"> {/* Descrição, Cat, Forma, Valor, Ações */} 
                                  <div className="pt-1 pb-1">
                                    {/* Detalhes relevantes para Saídas */} 
                                    {movimento.despesa_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><Receipt className="h-3 w-3 text-red-600" /><span className="font-medium">Despesa ID:</span><span className="font-mono break-all">{movimento.despesa_id}</span></div>)}
                                    {movimento.pagamento_prazo_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><CreditCard className="h-3 w-3 text-blue-600" /><span className="font-medium">Parcela ID (Saída):</span><span className="font-mono break-all">{movimento.pagamento_prazo_id}</span></div>)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </Fragment>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </div>

                {/* Tabela para telas maiores */}
                <div className="hidden md:block h-[calc(100%-24px)] overflow-y-auto scrollbar-thin">
                  <TabsContent value="todos" className="m-0 p-0 data-[state=active]:block">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-[90px] py-3">Hora</TableHead>
                          <TableHead className="w-[110px] py-3">Tipo</TableHead>
                          <TableHead className="py-3">Descrição</TableHead>
                          <TableHead className="w-[120px] text-right py-3">Categoria</TableHead>
                          <TableHead className="w-[140px] text-right py-3">Forma Pagto.</TableHead>
                          <TableHead className="w-[130px] text-right py-3">Valor</TableHead>
                          <TableHead className="w-[80px] text-center py-3">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {movimentos.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                              <div className="flex flex-col items-center justify-center">
                                <Info className="h-8 w-8 mb-2 text-muted" />
                                <p>Nenhum movimento registrado neste dia.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {movimentos.map((movimento) => {
                              const isExpanded = expandedItems[movimento.id];
                              return (
                                <Fragment key={movimento.id}>
                                  <TableRow className={`group hover:bg-muted/20`}>
                                    {/* Célula: Hora */}
                                    <TableCell className="font-mono text-sm py-3 align-top">{movimento.created_at ? formatTime(movimento.created_at) : '--:--:--'}</TableCell>
                                    {/* Célula: Tipo */}
                                    <TableCell className="py-3 align-top">
                                      <Badge
                                        variant="outline"
                                        className={`px-2 py-0.5 text-xs ${
                                          movimento.tipo === 'entrada' ? 'border-green-500 bg-green-50 text-green-700' : ''
                                        } ${movimento.tipo === 'saida' ? 'border-red-500 bg-red-50 text-red-700' : ''}`}
                                      >
                                        {movimento.tipo === 'entrada' ? <><TrendingUp className="h-3 w-3 mr-1 inline" /> Entrada</> : <><TrendingDown className="h-3 w-3 mr-1 inline" /> Saída</>}
                                      </Badge>
                                    </TableCell>
                                    {/* Célula: Descrição */}
                                    <TableCell className="py-3 align-top">
                                      <div className="text-sm font-medium">{getDescricaoSimplificada(movimento, 'todos')}</div>
                                      {movimento.observacoes && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={movimento.observacoes}>{movimento.observacoes}</div>}
                                    </TableCell>
                                    {/* Célula: Categoria */}
                                    <TableCell className="text-right py-3 align-top">
                                      {(movimento.categoria_id && movimento.categoria?.nome) ? <Badge variant="outline" className="text-xs">{movimento.categoria.nome}</Badge> : movimento.venda_id ? <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-300">Venda</Badge> : <span className="text-xs text-muted-foreground">N/A</span>}
                                    </TableCell>
                                    {/* Célula: Forma Pagto. */}
                                    <TableCell className="text-right py-3 align-top">
                                      {movimento.forma_pagamento_nome ? <span className="text-sm">{movimento.forma_pagamento_nome}</span> : <span className="text-xs text-muted-foreground">N/A</span>}
                                    </TableCell>
                                    {/* Célula: Valor */}
                                    <TableCell className={`text-right font-mono font-medium text-base py-3 align-top ${movimento.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(Number(movimento.valor) || 0)}</TableCell>
                                    {/* Célula: Ações */}
                                    <TableCell className="text-center py-3 align-top">
                                      <div className="flex items-center justify-center gap-1">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => abrirConfirmacaoExclusao(movimento.id, e)} title="Excluir movimento"><Trash2 className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleItemExpansion(movimento.id); }} title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  {/* Linha Expansível (Todos) */}
                                  {isExpanded && (
                                    <TableRow className="bg-muted/10 hover:bg-muted/20 border-t-0">
                                      <TableCell className="py-2"></TableCell> {/* Hora */}
                                      <TableCell className="py-2"></TableCell> {/* Tipo */}
                                      <TableCell colSpan={5} className="py-2 pl-4 pr-2">
                                        {/* ... Conteúdo dos detalhes ... */} 
                                        <div className="pt-1 pb-1">
                                            {/* IDs e detalhes dos produtos */} 
                                            {movimento.venda_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1"><ShoppingBag className="h-3 w-3 text-[#92400e]" /><span className="font-medium">Venda ID:</span><span className="font-mono break-all">{movimento.venda_id}</span></div>)}
                                            {movimento.venda_id && movimento.venda_itens_detalhes && movimento.venda_itens_detalhes.length > 0 && (<div className="mt-1"><div className="text-xs font-medium mb-0.5">Produtos da Venda:</div><ul className="text-xs text-muted-foreground pl-4">{movimento.venda_itens_detalhes.map((item, index) => (<li key={index} className="list-disc">{item.produtos?.nome || 'Item sem nome'}<span className="font-mono"> x{item.quantidade}</span>{item.preco_unitario && (<span className="ml-1">({formatCurrency(Number(item.preco_unitario))})</span>)}</li>))}</ul></div>)}
                                            {movimento.receita_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><Banknote className="h-3 w-3 text-green-600" /><span className="font-medium">Receita ID:</span><span className="font-mono break-all">{movimento.receita_id}</span></div>)}
                                            {movimento.despesa_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><Receipt className="h-3 w-3 text-red-600" /><span className="font-medium">Despesa ID:</span><span className="font-mono break-all">{movimento.despesa_id}</span></div>)}
                                            {movimento.pagamento_prazo_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><CreditCard className="h-3 w-3 text-blue-600" /><span className="font-medium">Parcela ID:</span><span className="font-mono break-all">{movimento.pagamento_prazo_id}</span></div>)}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Fragment>
                              );
                            })}
                          </>
                        )}
                      </TableBody>
                    </Table>
                    <div className="h-24"></div>
                  </TabsContent>

                  <TabsContent value="entradas" className="m-0 p-0 data-[state=active]:block">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-[90px] py-3">Hora</TableHead>
                          <TableHead className="py-3">Descrição</TableHead>
                          <TableHead className="w-[120px] text-right py-3">Categoria</TableHead>
                          <TableHead className="w-[140px] text-right py-3">Forma Pagto.</TableHead>
                          <TableHead className="w-[130px] text-right py-3">Valor</TableHead>
                          <TableHead className="w-[80px] text-center py-3">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entradas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                              <div className="flex flex-col items-center justify-center">
                                <TrendingUp className="h-8 w-8 mb-2 text-muted" />
                                <p>Nenhuma entrada registrada neste dia.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {entradas.map((movimento) => {
                              const isExpanded = expandedItems[movimento.id];
                              return (
                                <Fragment key={movimento.id}>
                                  <TableRow className={`group hover:bg-green-50/30`}>
                                    {/* Célula: Hora */}
                                    <TableCell className="font-mono text-sm py-3 align-top">{movimento.created_at ? formatTime(movimento.created_at) : '--:--:--'}</TableCell>
                                    {/* Célula: Descrição */}
                                    <TableCell className="py-3 align-top">
                                      <div className="text-sm font-medium">{getDescricaoSimplificada(movimento, 'entradas')}</div>
                                      {movimento.observacoes && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={movimento.observacoes}>{movimento.observacoes}</div>}
                                    </TableCell>
                                    {/* Célula: Categoria */}
                                    <TableCell className="text-right py-3 align-top">
                                      {(movimento.categoria_id && movimento.categoria?.nome) ? <Badge variant="outline" className="text-xs">{movimento.categoria.nome}</Badge> : movimento.venda_id ? <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border-blue-300">Venda</Badge> : <span className="text-xs text-muted-foreground">N/A</span>}
                                    </TableCell>
                                    {/* Célula: Forma Pagto. */}
                                    <TableCell className="text-right py-3 align-top">
                                      {movimento.forma_pagamento_nome ? <span className="text-sm">{movimento.forma_pagamento_nome}</span> : <span className="text-xs text-muted-foreground">N/A</span>}
                                    </TableCell>
                                    {/* Célula: Valor */}
                                    <TableCell className={`text-right font-mono font-medium text-base text-green-600 py-3 align-top`}>{formatCurrency(Number(movimento.valor) || 0)}</TableCell>
                                    {/* Célula: Ações */}
                                    <TableCell className="text-center py-3 align-top">
                                      <div className="flex items-center justify-center gap-1">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => abrirConfirmacaoExclusao(movimento.id, e)} title="Excluir movimento"><Trash2 className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleItemExpansion(movimento.id); }} title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  {/* Linha Expansível (Entradas) */}
                                  {isExpanded && (
                                    <TableRow className="bg-muted/10 hover:bg-muted/20 border-t-0">
                                      <TableCell className="py-2"></TableCell> {/* Hora */}
                                      <TableCell colSpan={5} className="py-2 pl-4 pr-2"> {/* Descrição, Cat, Forma, Valor, Ações */} 
                                        <div className="pt-1 pb-1">
                                            {/* Detalhes relevantes para Entradas */} 
                                            {movimento.venda_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1"><ShoppingBag className="h-3 w-3 text-[#92400e]" /><span className="font-medium">Venda ID:</span><span className="font-mono break-all">{movimento.venda_id}</span></div>)}
                                            {movimento.venda_id && movimento.venda_itens_detalhes && movimento.venda_itens_detalhes.length > 0 && (<div className="mt-1"><div className="text-xs font-medium mb-0.5">Produtos da Venda:</div><ul className="text-xs text-muted-foreground pl-4">{movimento.venda_itens_detalhes.map((item, index) => (<li key={index} className="list-disc">{item.produtos?.nome || 'Item sem nome'}<span className="font-mono"> x{item.quantidade}</span>{item.preco_unitario && (<span className="ml-1">({formatCurrency(Number(item.preco_unitario))})</span>)}</li>))}</ul></div>)}
                                            {movimento.receita_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><Banknote className="h-3 w-3 text-green-600" /><span className="font-medium">Receita ID:</span><span className="font-mono break-all">{movimento.receita_id}</span></div>)}
                                            {movimento.pagamento_prazo_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><CreditCard className="h-3 w-3 text-blue-600" /><span className="font-medium">Parcela ID (Entrada):</span><span className="font-mono break-all">{movimento.pagamento_prazo_id}</span></div>)}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Fragment>
                              );
                            })}
                          </>
                        )}
                      </TableBody>
                    </Table>
                    <div className="h-24"></div>
                  </TabsContent>

                  <TabsContent value="saidas" className="m-0 p-0 data-[state=active]:block">
                    <Table>
                      <TableHeader className="bg-muted/50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="w-[90px] py-3">Hora</TableHead>
                          <TableHead className="py-3">Descrição</TableHead>
                          <TableHead className="w-[120px] text-right py-3">Categoria</TableHead>
                          <TableHead className="w-[140px] text-right py-3">Forma Pagto.</TableHead>
                          <TableHead className="w-[130px] text-right py-3">Valor</TableHead>
                          <TableHead className="w-[80px] text-center py-3">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saidas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                              <div className="flex flex-col items-center justify-center">
                                <TrendingDown className="h-8 w-8 mb-2 text-muted" />
                                <p>Nenhuma saída registrada neste dia.</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          <>
                            {saidas.map((movimento) => {
                              const isExpanded = expandedItems[movimento.id];
                              return (
                                <Fragment key={movimento.id}>
                                  <TableRow className={`group hover:bg-red-50/30`}>
                                    {/* Célula: Hora */}
                                    <TableCell className="font-mono text-sm py-3 align-top">{movimento.created_at ? formatTime(movimento.created_at) : '--:--:--'}</TableCell>
                                    {/* Célula: Descrição */}
                                    <TableCell className="py-3 align-top">
                                      <div className="text-sm font-medium">{getDescricaoSimplificada(movimento, 'saidas')}</div>
                                      {movimento.observacoes && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1" title={movimento.observacoes}>{movimento.observacoes}</div>}
                                    </TableCell>
                                    {/* Célula: Categoria */}
                                    <TableCell className="text-right py-3 align-top">
                                      {movimento.categoria?.nome ? <Badge variant="outline" className="text-xs">{movimento.categoria.nome}</Badge> : <span className="text-xs text-muted-foreground">N/A</span>}
                                    </TableCell>
                                    {/* Célula: Forma Pagto. */}
                                    <TableCell className="text-right py-3 align-top">
                                      {movimento.forma_pagamento_nome ? <span className="text-sm">{movimento.forma_pagamento_nome}</span> : <span className="text-xs text-muted-foreground">N/A</span>}
                                    </TableCell>
                                    {/* Célula: Valor */}
                                    <TableCell className={`text-right font-mono font-medium text-base text-red-600 py-3 align-top`}>{formatCurrency(Number(movimento.valor) || 0)}</TableCell>
                                    {/* Célula: Ações */}
                                    <TableCell className="text-center py-3 align-top">
                                      <div className="flex items-center justify-center gap-1">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={(e) => abrirConfirmacaoExclusao(movimento.id, e)} title="Excluir movimento"><Trash2 className="h-3.5 w-3.5" /></Button>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full flex-shrink-0" onClick={(e) => { e.stopPropagation(); toggleItemExpansion(movimento.id); }} title={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}>{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}</Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  {/* Linha Expansível (Saídas) */}
                                  {isExpanded && (
                                    <TableRow className="bg-muted/10 hover:bg-muted/20 border-t-0">
                                      <TableCell className="py-2"></TableCell> {/* Hora */} 
                                      <TableCell colSpan={5} className="py-2 pl-4 pr-2"> {/* Descrição, Cat, Forma, Valor, Ações */} 
                                        <div className="pt-1 pb-1">
                                          {/* Detalhes relevantes para Saídas */} 
                                          {movimento.despesa_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><Receipt className="h-3 w-3 text-red-600" /><span className="font-medium">Despesa ID:</span><span className="font-mono break-all">{movimento.despesa_id}</span></div>)}
                                          {movimento.pagamento_prazo_id && (<div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mb-1 mt-1"><CreditCard className="h-3 w-3 text-blue-600" /><span className="font-medium">Parcela ID (Saída):</span><span className="font-mono break-all">{movimento.pagamento_prazo_id}</span></div>)}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </Fragment>
                              );
                            })}
                          </>
                        )}
                      </TableBody>
                    </Table>
                    <div className="h-24"></div>
                  </TabsContent>
                </div>

                {/* Indicador de scroll para o fim */}
                {movimentos.length > 4 && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white/90 to-transparent h-24 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <MoveDown className="h-6 w-6 mx-auto text-[#92400e] animate-bounce" />
                      <span className="text-sm text-muted-foreground block mt-1">Role para ver mais itens</span>
                    </div>
                  </div>
                )}
              </div>
            </Tabs>
          </div>
        )}

        <div className="flex justify-between items-center px-6 py-4 mt-auto border-t shrink-0">
          <div className="text-sm text-muted-foreground">
            {movimentos.length} movimento{movimentos.length !== 1 ? 's' : ''} no dia
          </div>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>

        {/* Diálogo de Confirmação de Exclusão */}
        <AlertDialog open={confirmarExclusaoAberto} onOpenChange={setConfirmarExclusaoAberto}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este movimento do fluxo de caixa? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 hover:bg-red-700" 
                onClick={confirmarExclusao}
                disabled={excluirMovimentoMutation.isPending}
              >
                {excluirMovimentoMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>
  );
};

export default FluxoCaixaDetalhesModal; 