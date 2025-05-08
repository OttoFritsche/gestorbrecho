import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  AlertCircle, 
  TrendingDown, 
  Calendar,
  Receipt, 
  Tag,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  FileText
} from "lucide-react";

import { getDespesaById, updateDespesa } from '@/services/despesas';
import { getFormasPagamento } from '@/services/formasPagamento';
import { Despesa, FormaPagamento } from '@/types/financeiro';
import { formatCurrency } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DespesaDetalhesModalProps {
  isOpen: boolean;
  onClose: () => void;
  despesaId: string | null;
}

const DespesaDetalhesModal: React.FC<DespesaDetalhesModalProps> = ({
  isOpen,
  onClose,
  despesaId,
}) => {
  const queryClient = useQueryClient();
  const [formaPagamentoId, setFormaPagamentoId] = useState<string | null>(null);

  // Log para depuração
  useEffect(() => {
    console.log('Modal aberto:', isOpen);
    console.log('ID da despesa:', despesaId);
  }, [isOpen, despesaId]);

  // Query para carregar a despesa
  const { 
    data: despesa, 
    isLoading, 
    isError,
    error
  } = useQuery({
    queryKey: ['despesa-detalhe', despesaId],
    queryFn: async () => {
      if (!despesaId) return null;
      console.log('Buscando detalhes da despesa ID:', despesaId);
      const resultado = await getDespesaById(despesaId);
      console.log('Resultado da busca:', resultado);
      return resultado;
    },
    enabled: !!despesaId && isOpen,
  });

  // Log o erro se houver
  useEffect(() => {
    if (isError && error) {
      console.error('Erro ao carregar despesa:', error);
    }
  }, [isError, error]);

  // Query para carregar as formas de pagamento
  const { 
    data: formasPagamento = [] 
  } = useQuery<FormaPagamento[]>({
    queryKey: ['formas-pagamento'],
    queryFn: async () => {
      console.log('Carregando formas de pagamento');
      const resultado = await getFormasPagamento();
      console.log('Formas de pagamento:', resultado);
      return resultado;
    },
    enabled: isOpen && (!despesa || !despesa.pago),
  });

  // Mutation para dar baixa na despesa
  const darBaixaMutation = useMutation({
    mutationFn: (formaPagamentoId: string) => {
      if (!despesaId) return Promise.reject(new Error('ID da despesa não fornecido'));
      
      // Preparar os dados para atualização
      // Formato YYYY-MM-DD usando format da date-fns que é consistente no tratamento de timezone
      const dataAtual = new Date();
      const dataFormatada = format(dataAtual, 'yyyy-MM-dd');
      console.log(`Data de pagamento formatada usando format (yyyy-MM-dd): ${dataFormatada}`);
      
      const dadosAtualizacao = {
        pago: true,
        data: dataFormatada, // Data formatada YYYY-MM-DD
        forma_pagamento_id: formaPagamentoId
      };
      
      console.log('Dados para atualização (com data formatada):', dadosAtualizacao);
      return updateDespesa(despesaId, dadosAtualizacao);
    },
    onSuccess: () => {
      toast.success('Pagamento registrado com sucesso!');
      // Invalidar queries relevantes
      queryClient.invalidateQueries({ queryKey: ['despesas'] });
      queryClient.invalidateQueries({ queryKey: ['despesa-detalhe', despesaId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] });
      // Fechar o modal após sucesso
      onClose();
    },
    onError: (error) => {
      console.error('Erro ao dar baixa:', error);
      toast.error(`Erro ao registrar pagamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  });

  // Função para formatar a data
  const formatarData = (dataIso?: string | null) => {
    if (!dataIso) return '-';
    try {
      return format(parseISO(dataIso), 'dd/MM/yyyy', { locale: ptBR });
    } catch (e) {
      console.error('Erro ao formatar data:', e, 'Data recebida:', dataIso);
      return 'Data inválida';
    }
  };

  // Função para lidar com o clique no botão "Dar Baixa"
  const handleDarBaixa = () => {
    if (!formaPagamentoId) {
      toast.error('Selecione uma forma de pagamento');
      return;
    }
    console.log('Iniciando baixa com forma de pagamento:', formaPagamentoId);
    darBaixaMutation.mutate(formaPagamentoId);
  };

  // Log quando os dados da despesa forem carregados
  useEffect(() => {
    if (despesa) {
      console.log('Despesa carregada com sucesso:', despesa);
    }
  }, [despesa]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="flex items-center gap-2 text-xl text-amber-800">
            <Receipt className="h-5 w-5" />
            Detalhes da Despesa
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas e opções de pagamento
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Carregando despesa...</span>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-10 text-red-500">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>Erro ao carregar os detalhes da despesa. {error instanceof Error ? error.message : ''}</span>
          </div>
        )}

        {!isLoading && !isError && despesa ? (
          <>
            {/* Informações principais */}
            <div className="py-2">
              <h3 className="text-lg font-semibold mb-1">{despesa.descricao}</h3>
              
              <div className="flex justify-between items-center mb-4">
                <Badge className={`px-2 py-1 ${despesa.pago 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                  {despesa.pago ? 'Pago' : 'Pendente'}
                </Badge>
                <span className="text-2xl font-bold text-gray-800">
                  {formatCurrency(despesa.valor)}
                </span>
              </div>

              {/* Cards com informações */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Card className="border border-gray-200">
                  <CardHeader className="py-3 pb-1">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <Calendar className="h-4 w-4" /> 
                      Data de Vencimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-base font-semibold">
                      {formatarData(despesa.data_vencimento)}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border border-gray-200">
                  <CardHeader className="py-3 pb-1">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <Tag className="h-4 w-4" /> 
                      Categoria
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-base font-semibold">
                      {despesa.categoria_nome || "Não categorizada"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Segunda linha de cards */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Card className="border border-gray-200">
                  <CardHeader className="py-3 pb-1">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                      <FileText className="h-4 w-4" /> 
                      Tipo de Despesa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2">
                    <div className="text-base font-semibold capitalize">
                      {despesa.tipo_despesa || "Não especificado"}
                    </div>
                  </CardContent>
                </Card>
                
                {despesa.pago ? (
                  <Card className="border border-gray-200">
                    <CardHeader className="py-3 pb-1">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                        <CreditCard className="h-4 w-4" /> 
                        Forma de Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-base font-semibold">
                        {despesa.forma_pagamento_nome || "Não especificada"}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-gray-200">
                    <CardHeader className="py-3 pb-1">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700">
                        <Calendar className="h-4 w-4" /> 
                        Data de Pagamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-base font-semibold">
                        {despesa.pago ? formatarData(despesa.data) : 'Pendente'}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Observações se houver */}
              {despesa.observacoes && (
                <div className="border p-3 rounded-md mb-6 bg-gray-50">
                  <h4 className="text-sm font-medium mb-1">Observações:</h4>
                  <p className="text-sm text-gray-600">{despesa.observacoes}</p>
                </div>
              )}

              {/* Área de Dar Baixa - mostra apenas se a despesa não estiver paga */}
              {!despesa.pago && (
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-base font-semibold mb-3 flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Registrar Pagamento
                  </h3>
                  
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-1 block">
                      Forma de Pagamento: <span className="text-red-500">*</span>
                    </label>
                    <Select onValueChange={(value) => {
                      console.log('Forma de pagamento selecionada:', value);
                      setFormaPagamentoId(value);
                    }}>
                      <SelectTrigger className="w-full border-2 focus:border-amber-500">
                        <SelectValue placeholder="Selecione uma forma de pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {formasPagamento.map((forma) => (
                          <SelectItem key={forma.id} value={forma.id}>
                            {forma.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!formaPagamentoId && (
                      <p className="text-sm text-amber-600 mt-1 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Selecione uma forma de pagamento para ativar o botão
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleDarBaixa} 
                    disabled={darBaixaMutation.isPending || !formaPagamentoId}
                    className={`w-full ${!formaPagamentoId 
                      ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'} text-white`}
                  >
                    {darBaixaMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {!formaPagamentoId ? 'Selecione uma forma de pagamento' : 'Registrar Pagamento'}
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : !isLoading && !isError ? (
          <div className="flex items-center justify-center py-10 text-amber-700">
            <AlertCircle className="h-8 w-8 mr-2" />
            <span>Nenhum dado encontrado para esta despesa.</span>
          </div>
        ) : null}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DespesaDetalhesModal; 