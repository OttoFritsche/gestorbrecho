import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Calendar as CalendarIcon, UserRound, Loader2 } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatInTimeZone } from 'date-fns-tz';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorDisplay from '@/components/ui/error-display';
import { Label } from "@/components/ui/label";

import { useSales } from '@/hooks/useSales';
import { useFormData } from '@/hooks/useFormData';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { SaleWithRelations, SaleItem, SaleItemInput, SaleDataInput } from '@/types/sales';
import SaleFormItem from '@/components/sales/SaleFormItem';
import { Categoria } from '@/lib/types/categoria';
import { getCategorias } from '@/services/categoriaService';
import { Vendedor, getVendedoresAtivosParaSelect } from '@/services/vendedorService';

type SaleDisplay = SaleWithRelations & { 
  id?: string;
  cliente_nome?: string | null; 
  vendas_items?: ({ produtos?: ({ nome?: string | null } | null); descricao_manual?: string | null } & SaleItem)[]; 
  num_parcelas?: number | null;
  primeiro_vencimento?: string | null;
  data_venda?: string | null;
  categoria_id?: string | null;
};

interface SaleItemState {
  produto_id: string | null;
  quantidade: number;
  preco_unitario: number;
  isManual: boolean;
  descricao_manual: string | null;
}

const VendaFormPage = (): JSX.Element => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const isEditing = Boolean(id) && id !== "nova";
  const { createSale, updateSale, getSaleById, error: submissionErrorHook, clearSaleError } = useSales();
  const { clients, paymentMethods, products, loading: formDataLoading } = useFormData();

  const [vendedorId, setVendedorId] = useState<string | null>(null);
  const [clienteId, setClienteId] = useState<string | null>(null);
  const [formaPagamentoId, setFormaPagamentoId] = useState<string | null>(null);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [items, setItems] = useState<SaleItemState[]>([{
    produto_id: null,
    quantidade: 1,
    preco_unitario: 0,
    isManual: false,
    descricao_manual: null
  }]);
  const [numParcelas, setNumParcelas] = useState<number | undefined>(undefined);
  const [primeiroVencimento, setPrimeiroVencimento] = useState<Date | undefined>(undefined);
  const [dataVenda, setDataVenda] = useState<Date>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { 
    data: vendedores = [], 
    isLoading: isLoadingVendedores, 
    isError: isErrorVendedores,
    error: errorVendedores 
  } = useQuery<{ id: string; nome: string }[], Error>({
    queryKey: ['vendedoresAtivosSelect'],
    queryFn: getVendedoresAtivosParaSelect,
    staleTime: 1000 * 60 * 15,
  });

  const { data: categorias = [], isLoading: isLoadingCategorias } = useQuery<Categoria[], Error>({
    queryKey: ['categorias', 'receita', 'vendas_servicos'],
    queryFn: async () => {
      const todasCategorias = await getCategorias('receita', true);
      
      const palavrasChaveRelevantes = ['venda', 'vendas', 'serviço', 'servico', 'serviços', 'servicos', 'customização', 'customizacao'];
      
      return todasCategorias.filter(categoria => {
        const nomeMinusculo = categoria.nome.toLowerCase();
        return palavrasChaveRelevantes.some(palavra => nomeMinusculo.includes(palavra)) || 
               nomeMinusculo === 'outras receitas';
      });
    },
    staleTime: 1000 * 60 * 15,
  });

  const { data: saleData, isLoading: isLoadingSale, error: saleError } = useQuery<SaleDisplay | null, Error>({
    queryKey: ['sale', id],
    queryFn: () => {
      if (id && id !== 'nova') {
        return getSaleById(id);
      } 
      return Promise.resolve(null); 
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (isEditing && saleData) {
      console.log("[VendaFormPage] Dados da venda carregados:", saleData);
      
      const itemsFromProps = saleData.vendas_items;
      
      setClienteId(saleData.cliente_id || null);
      setFormaPagamentoId(saleData.forma_pagamento_id || null);
      setCategoriaId(saleData.categoria_id || null);
      setVendedorId(saleData.vendedor_id || null);

      const itemsParaEstado = Array.isArray(itemsFromProps) ? itemsFromProps.map((item) => {
        const isManualCalculado = !item?.produto_id;
        
        return {
          produto_id: item?.produto_id ?? null,
          quantidade: item?.quantidade ?? 1,
          preco_unitario: item?.preco_unitario ?? 0,
          isManual: isManualCalculado,
          descricao_manual: item?.descricao_manual ?? null
        };
      }) : [];

      setItems(itemsParaEstado.length > 0 ? itemsParaEstado : [{
        produto_id: null, 
        quantidade: 1, 
        preco_unitario: 0, 
        isManual: false, 
        descricao_manual: null
      }]);

      const dataVendaStr = saleData.data_venda;
      if (dataVendaStr) {
        try {
          let parsedDate = new Date(dataVendaStr.includes('T') ? dataVendaStr : dataVendaStr.replace(/-/g, '/'));
          if (!isNaN(parsedDate.getTime())) {
            setDataVenda(parsedDate);
          } else {
            setDataVenda(new Date());
          }
        } catch (e) {
          console.error("[VendaFormPage] Erro ao parsear data_venda:", e);
          setDataVenda(new Date());
        }
      }

      const primeiroVencimentoStr = saleData.primeiro_vencimento;
      if (primeiroVencimentoStr) {
        try {
          let parsedVencimento = new Date(primeiroVencimentoStr.includes('T') ? primeiroVencimentoStr : primeiroVencimentoStr.replace(/-/g, '/'));
          if (!isNaN(parsedVencimento.getTime())) {
            setPrimeiroVencimento(parsedVencimento);
          }
        } catch (e) {
          console.error("[VendaFormPage] Erro ao parsear primeiro_vencimento:", e);
        }
      }

      setNumParcelas(saleData.num_parcelas || undefined);
    }
  }, [saleData, isEditing]);

  const clearErrorOnChange = () => {
    if (submissionErrorHook) {
      clearSaleError();
    }
  };

  const formaPagamentoSelecionada = paymentMethods.find(f => f.id === formaPagamentoId);
  const isAPrazo = formaPagamentoSelecionada?.nome === 'A Prazo (Fiado)';

  const handleAddItem = () => {
    clearErrorOnChange();
    setItems([...items, { 
      produto_id: null, 
      quantidade: 1, 
      preco_unitario: 0, 
      isManual: false, 
      descricao_manual: null 
    }]);
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    clearErrorOnChange();
    const newItems = [...items]; 
    if (newItems[index]) {
      (newItems[index] as any)[field] = value; 
      setItems(newItems);
    } else {
      console.warn(`Tentativa de atualizar item inválido no índice ${index}`);
    }
  };

  const handleRemoveItem = (index: number) => {
    clearErrorOnChange();
    setItems(items.filter((_, i) => i !== index));
  };

  const valorTotal = items.reduce((total, item) => {
    return total + (Number(item.quantidade || 0) * Number(item.preco_unitario || 0));
  }, 0);

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado.');
      return;
    }
    
    if (!(dataVenda instanceof Date) || isNaN(dataVenda.getTime())) {
      toast.error('Selecione uma data de venda válida.');
      return;
    }
    
    if (!formaPagamentoId) { 
      toast.error('Selecione forma de pagamento.'); 
      return; 
    }
    
    if (!categoriaId) {
      toast.error('Selecione uma categoria para a venda.');
      return;
    }
    
    const isAPrazo = paymentMethods?.find(pm => pm.id === formaPagamentoId)?.nome === 'A Prazo (Fiado)';

    if (items.length === 0) {
      toast.error('Adicione pelo menos um item à venda.');
      return;
    }

    const invalidItems = items.filter(item => {
      if (item.isManual) {
        return !item.descricao_manual || !item.preco_unitario || !item.quantidade;
      }
      return !item.produto_id || !item.preco_unitario || !item.quantidade;
    });

    if (invalidItems.length > 0) {
      toast.error(`${invalidItems.length} item(s) com dados incompletos.`);
      return;
    }

    setIsSubmitting(true);
    clearErrorOnChange();

    const saleItemsInput: SaleItemInput[] = items.map(item => ({
      produto_id: item.isManual ? null : item.produto_id,
      descricao_manual: item.isManual ? item.descricao_manual : null,
      quantidade: Number(item.quantidade || 0),
      preco_unitario: Number(item.preco_unitario || 0),
      subtotal: Number(item.quantidade || 0) * Number(item.preco_unitario || 0),
      user_id: user.id
    }));

    const salePayload: SaleDataInput = {
      data_venda: formatInTimeZone(dataVenda, 'America/Sao_Paulo', "yyyy-MM-dd'T'HH:mm:ss.SSSxxx"),
      cliente_id: clienteId,
      forma_pagamento_id: formaPagamentoId,
      categoria_id: categoriaId,
      valor_total: valorTotal,
      items: saleItemsInput,
      observacoes: null,
      user_id: user.id,
      num_parcelas: isAPrazo ? numParcelas : null,
      primeiro_vencimento: isAPrazo && primeiroVencimento 
        ? format(primeiroVencimento, 'yyyy-MM-dd') 
        : null,
      vendedor_id: vendedorId,
    };

    try {
      let result;
      if (isEditing && id) {
        console.log("[VendaFormPage] Atualizando venda:", id);
        console.log("[VendaFormPage] Data com timezone:", salePayload.data_venda);
        result = await updateSale(id, salePayload);
        toast.success('Venda atualizada com sucesso!');
      } else {
        console.log("[VendaFormPage] Criando nova venda:");
        console.log("[VendaFormPage] Data com timezone:", salePayload.data_venda);
        result = await createSale(salePayload);
        toast.success('Venda registrada com sucesso!');
      }
      console.log("[VendaFormPage] Resposta da operação:", result);
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sale', id] });
      queryClient.invalidateQueries({ queryKey: ['produtosDisponiveis'] });
      queryClient.invalidateQueries({ queryKey: ['fluxo_caixa'] });
      navigate('/app/vendas');
    } catch (error) {
      console.error("[VendaFormPage] Erro ao salvar venda:", error);
      
      // Uma forma segura para o TypeScript entender a verificação
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido ao salvar a venda.";
      toast.error(errorMessage);
      
      // Não precisamos da lógica de comparação com o erro do hook
      // já que estamos mostrando diretamente o erro capturado
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = (isEditing && isLoadingSale) || formDataLoading || isLoadingCategorias || isLoadingVendedores;
  if (isLoading) {
    return (
      <div className="p-8 w-full h-48 flex items-center justify-center">
        <LoadingSpinner size={32} />
        <p className="ml-2 text-gray-500">Carregando dados...</p>
      </div>
    );
  }

  if (isEditing && saleError) {
    return <ErrorDisplay error={saleError} title="Erro ao carregar venda" />;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between mb-6 pb-4 border-b w-full">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate(-1)} 
          aria-label="Voltar"
          className="flex-shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-grow text-center px-4">
          <h2 className="text-3xl font-bold tracking-tight font-serif text-[#92400e]">
            {isEditing ? 'Editar Venda' : 'Nova Venda'}
          </h2>
          <p className="text-muted-foreground mt-1 mb-4">
            {isEditing ? 'Modifique os detalhes da venda selecionada.' : 'Registre uma nova venda no sistema.'}
          </p>
        </div>
        <div className="w-[40px] flex-shrink-0"></div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-xl">Dados da Venda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data da Venda</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dataVenda && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataVenda ? format(dataVenda, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dataVenda}
                    onSelect={setDataVenda}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <label htmlFor="categoria" className="block text-sm font-medium text-gray-700 mb-1">Categoria da Venda</label>
              <Select value={categoriaId || ''} onValueChange={(value) => { setCategoriaId(value); clearErrorOnChange(); }}>
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Selecione o tipo de venda" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.filter(c => c.ativa).map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                  {isLoadingCategorias && <SelectItem value="loading" disabled>Carregando...</SelectItem>}
                  {!isLoadingCategorias && categorias.length === 0 && (
                    <SelectItem value="no-category" disabled>Nenhuma categoria disponível</SelectItem>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">Classifique se é uma venda de produtos ou prestação de serviços.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cliente" className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <Select value={clienteId || ''} onValueChange={(value) => { setClienteId(value); clearErrorOnChange(); }}>
                <SelectTrigger id="cliente">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum (Consumidor)</SelectItem>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vendedor">Vendedor (Opcional)</Label>
              <Select 
                value={vendedorId || undefined} 
                onValueChange={(value) => { setVendedorId(value === 'null' ? null : value); clearErrorOnChange(); }}
                disabled={isLoadingVendedores}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={isLoadingVendedores ? "Carregando..." : "Selecionar Vendedor"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="null">Nenhum</SelectItem>
                  {vendedores.map(vendedor => (
                    <SelectItem key={vendedor.id} value={vendedor.id}>
                      {vendedor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isErrorVendedores && <p className="text-sm text-red-500 mt-1">Erro ao carregar vendedores.</p>}
            </div>

            <div>
              <label htmlFor="forma-pagamento" className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
              <Select value={formaPagamentoId || ''} onValueChange={(value) => { setFormaPagamentoId(value); clearErrorOnChange(); }}>
                <SelectTrigger id="forma-pagamento">
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>{method.nome}</SelectItem>
                  ))}
                  {paymentMethods.length === 0 && !formDataLoading && <SelectItem value="no-payment" disabled>Nenhuma forma cadastrada</SelectItem>}
                  {formDataLoading && <SelectItem value="loading" disabled>Carregando...</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isAPrazo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
              <div>
                <label htmlFor="num-parcelas" className="block text-sm font-medium text-gray-700 mb-1">Número de Parcelas</label>
                <Input 
                  id="num-parcelas"
                  type="number" 
                  placeholder="Ex: 3"
                  value={numParcelas || ''}
                  onChange={(e) => { setNumParcelas(parseInt(e.target.value, 10)); clearErrorOnChange(); }}
                  min="1"
                />
              </div>
              <div>
                <label htmlFor="primeiro-vencimento" className="block text-sm font-medium text-gray-700 mb-1">Primeiro Vencimento</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !primeiroVencimento && "text-muted-foreground"
                      )}
                      id="primeiro-vencimento"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {primeiroVencimento ? format(primeiroVencimento, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={primeiroVencimento}
                      onSelect={(date) => { setPrimeiroVencimento(date); clearErrorOnChange(); }}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </CardContent>

        <CardHeader className="pt-6 border-t mt-4">
          <CardTitle className="font-serif text-xl">Itens da Venda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <SaleFormItem
              key={index}
              item={item}
              index={index}
              products={products}
              onUpdate={handleUpdateItem}
              onRemove={handleRemoveItem}
            />
          ))}
          <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="mt-2">
            <Plus className="mr-2 h-4 w-4" /> Adicionar Item
          </Button>
        </CardContent>

        <CardFooter className="flex flex-col items-end space-y-2 border-t pt-4">
          <p className="text-lg font-semibold">Valor Total: {formatCurrency(valorTotal)}</p>
          {submissionErrorHook && (
            <p className="text-red-500 text-sm">Erro: {submissionErrorHook}</p>
          )}
          <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoadingSale || formDataLoading || isLoadingVendedores}
            className="bg-[#a16207] hover:bg-[#854d0e] text-white"
          >
            {isSubmitting ? 'Salvando...' : (isEditing ? 'Atualizar Venda' : 'Registrar Venda')}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default VendaFormPage;
