import React, { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useSales } from '@/hooks/useSales'
import { useFormData } from '@/hooks/useFormData'
import { Plus, Calendar as CalendarIcon } from 'lucide-react'
import SaleFormItem from './SaleFormItem'
import { formatCurrency, cn } from '@/lib/utils'
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import { supabase } from '@/integrations/supabase/client'
import { SaleWithRelations, SaleItem } from '@/types/sales'
import logoSrc from '@/assets/logo/3.png'
import { useQueryClient } from '@tanstack/react-query'

type SaleDisplay = SaleWithRelations & { 
    id?: string;
    cliente_nome?: string | null; 
    vendas_items?: ({ produtos?: ({ nome?: string | null } | null); descricao_manual?: string | null } & SaleItem)[]; 
    num_parcelas?: number | null;
    primeiro_vencimento?: string | null;
    data_venda?: string | null;
};

interface SaleCadastroDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: SaleDisplay | null
}

interface SaleItemState {
    produto_id: string | null;
    quantidade: number;
    preco_unitario: number;
    isManual: boolean;
    descricao_manual: string | null;
}

const SaleCadastroDialog: React.FC<SaleCadastroDialogProps> = ({ 
  open, 
  onOpenChange, 
  initialData
}) => {
  const { createSale, updateSale, error: submissionErrorHook, clearSaleError } = useSales()
  const { clients, paymentMethods, products, loading: formDataLoading } = useFormData()
  const queryClient = useQueryClient()
  
  console.log("Dados do useFormData:", { clients, paymentMethods, products, loading: formDataLoading });
  console.log("Estrutura do primeiro cliente:", clients[0]);
  console.log("Produtos recebidos:", products);

  const isEditing = !!initialData;

  const [clienteId, setClienteId] = useState<string | null>(null)
  const [formaPagamentoId, setFormaPagamentoId] = useState<string | null>(null)
  const [items, setItems] = useState<SaleItemState[]>([{
    produto_id: null,
    quantidade: 1,
    preco_unitario: 0,
    isManual: false,
    descricao_manual: null
  }])
  const [numParcelas, setNumParcelas] = useState<number | undefined>(undefined)
  const [primeiroVencimento, setPrimeiroVencimento] = useState<Date | undefined>(undefined)
  const [dataVenda, setDataVenda] = useState<Date>(new Date());

  useEffect(() => {
    // Log 1: Entrou no useEffect e condições iniciais
    console.log(`[DEBUG Edição Venda] useEffect ativado. isEditing=${isEditing}, open=${open}`);

    if (isEditing && initialData && open) {
      // Log 2: initialData completo recebido
      console.log("[DEBUG Edição Venda] initialData Recebido:", JSON.stringify(initialData, null, 2));

      const itemsFromProps = initialData.vendas_items;

      // Log 3: Dados dos itens crus (itemsFromProps)
      console.log("[DEBUG Edição Venda] itemsFromProps (initialData.vendas_items):", itemsFromProps);
      console.log("[DEBUG Edição Venda] typeof itemsFromProps:", typeof itemsFromProps);
      console.log("[DEBUG Edição Venda] Array.isArray(itemsFromProps):", Array.isArray(itemsFromProps));

      setClienteId(initialData.cliente?.id || null);
      setFormaPagamentoId(initialData.forma_pagamento?.id || null);

      // Log 4: Antes do mapeamento
      console.log("[DEBUG Edição Venda] Iniciando mapeamento de itemsFromProps...");
      const itemsParaEstado = Array.isArray(itemsFromProps) ? itemsFromProps.map((item, index) => {
          // Log 5: Item original sendo mapeado
          console.log(`[DEBUG Edição Venda] Mapeando item[${index}] (original):`, JSON.stringify(item, null, 2));
          
          // Log 6: Verificando a lógica de isManual
          const produtoIdExiste = !!item?.produto_id;
          const descricaoManualExiste = !!item?.descricao_manual;
          const isManualCalculado = !produtoIdExiste; // A lógica original era essa
          console.log(`[DEBUG Edição Venda] Mapeando item[${index}] - produto_id: ${item?.produto_id}, produtoIdExiste: ${produtoIdExiste}`);
          console.log(`[DEBUG Edição Venda] Mapeando item[${index}] - descricao_manual: ${item?.descricao_manual}, descricaoManualExiste: ${descricaoManualExiste}`);
          console.log(`[DEBUG Edição Venda] Mapeando item[${index}] - isManual calculado (baseado em !produto_id): ${isManualCalculado}`);

          const itemMapeado = {
              produto_id: item?.produto_id ?? null,
              quantidade: item?.quantidade ?? 1,
              preco_unitario: item?.preco_unitario ?? 0,
              // Usar a lógica calculada para depuração, ou a original se preferir testar direto
              isManual: isManualCalculado, 
              descricao_manual: item?.descricao_manual ?? null
          };
          // Log 7: Item após mapeamento
          console.log(`[DEBUG Edição Venda] Mapeando item[${index}] (MAPEADO):`, JSON.stringify(itemMapeado, null, 2));
          return itemMapeado;
      }) : [];
      // Log 8: Resultado final do mapeamento
      console.log("[DEBUG Edição Venda] itemsParaEstado (final mapeado):", JSON.stringify(itemsParaEstado, null, 2));

      // Log 9: Verificando se itemsParaEstado está vazio antes de setar
      console.log("[DEBUG Edição Venda] itemsParaEstado.length > 0:", itemsParaEstado.length > 0);
      setItems(itemsParaEstado.length > 0 ? itemsParaEstado : [{ produto_id: null, quantidade: 1, preco_unitario: 0, isManual: false, descricao_manual: null }]);

      const dataVendaStr = initialData.data_venda;
      if (dataVendaStr) {
        try {
          let parsedDate = new Date(dataVendaStr.includes('T') ? dataVendaStr : dataVendaStr.replace(/-/g, '/'));
          if (!isNaN(parsedDate.getTime())) {
             console.log("[SaleCadastroDialog] useEffect - Data Venda parseada:", parsedDate);
            setDataVenda(parsedDate);
          } else {
            console.warn("[SaleCadastroDialog] useEffect - Falha ao parsear data_venda:", dataVendaStr);
            setDataVenda(new Date());
          }
        } catch (e) {
           console.error("[SaleCadastroDialog] useEffect - Erro no catch ao parsear data_venda:", e);
           setDataVenda(new Date());
        }
      } else {
         console.log("[SaleCadastroDialog] useEffect - data_venda não encontrada em initialData.");
        setDataVenda(new Date());
      }

      const primeiroVencimentoStr = initialData.primeiro_vencimento;
      if (primeiroVencimentoStr) {
         try {
           let parsedVencimento = new Date(primeiroVencimentoStr.includes('T') ? primeiroVencimentoStr : primeiroVencimentoStr.replace(/-/g, '/'));
           if (!isNaN(parsedVencimento.getTime())) {
             console.log("[SaleCadastroDialog] useEffect - Primeiro Vencimento parseado:", parsedVencimento);
             setPrimeiroVencimento(parsedVencimento);
           } else {
             console.warn("[SaleCadastroDialog] useEffect - Falha ao parsear primeiro_vencimento:", primeiroVencimentoStr);
             setPrimeiroVencimento(undefined);
           }
         } catch (e) {
            console.error("[SaleCadastroDialog] useEffect - Erro no catch ao parsear primeiro_vencimento:", e);
            setPrimeiroVencimento(undefined);
         }
       } else {
         console.log("[SaleCadastroDialog] useEffect - primeiro_vencimento não encontrado em initialData.");
         setPrimeiroVencimento(undefined);
       }

       console.log("[SaleCadastroDialog] useEffect - Definindo numParcelas:", initialData.num_parcelas);
       setNumParcelas(initialData.num_parcelas || undefined);

       // Log 10: Estados após tentativa de setar os itens
       console.log("[DEBUG Edição Venda] Estados definidos: clienteId=", initialData.cliente?.id || null, "formaPagamentoId=", initialData.forma_pagamento?.id || null);
       console.log("[DEBUG Edição Venda] Tentativa de setar estado 'items' com base em 'itemsParaEstado' acima.");

    } else if (!open) {
      // Log 11: Resetando estados ao fechar
      console.log("[DEBUG Edição Venda] Diálogo fechado (open=false), resetando estados.");
      resetFormStates();
    }
  }, [initialData, isEditing, open]);

  // Função auxiliar para limpar erro ao modificar dados
  const clearErrorOnChange = () => {
    if (submissionErrorHook) {
      clearSaleError();
    }
  };

  const formaPagamentoSelecionada = paymentMethods.find(f => f.id === formaPagamentoId);
  const isAPrazo = formaPagamentoSelecionada?.nome === 'A Prazo (Fiado)';

  const handleAddItem = () => {
    clearErrorOnChange(); // Limpa erro ao adicionar item
    setItems([...items, { 
        produto_id: null, 
        quantidade: 1, 
        preco_unitario: 0, 
        isManual: false, 
        descricao_manual: null 
    }])
  }

  const handleUpdateItem = (index: number, field: string, value: any) => {
    clearErrorOnChange(); // Limpa erro ao atualizar item
    const newItems = [...items]; 
    if (newItems[index]) {
        (newItems[index] as any)[field] = value; 
        setItems(newItems);
    } else {
        console.warn(`Tentativa de atualizar item inválido no índice ${index}`);
    }
  }

  const handleRemoveItem = (index: number) => {
    clearErrorOnChange(); // Limpa erro ao remover item
    setItems(items.filter((_, i) => i !== index))
  }

  const valorTotal = items.reduce((total, item) => {
    return total + (Number(item.quantidade || 0) * Number(item.preco_unitario || 0))
  }, 0)

  const resetFormStates = () => {
    setClienteId(null)
    setFormaPagamentoId(null)
    setItems([{ produto_id: null, quantidade: 1, preco_unitario: 0, isManual: false, descricao_manual: null }])
    setNumParcelas(undefined)
    setPrimeiroVencimento(undefined)
    setDataVenda(new Date())
  }

  const handleSubmit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast.error('Usuário não autenticado.');
        return;
    }
    const userId = user.id;

    if (!formaPagamentoId) { toast.error('Selecione forma pgto.'); return; }
    if (isAPrazo && (!numParcelas || !primeiroVencimento)) { toast.error('Dados de parcelamento inválidos.'); return; }

    if (items.length === 0) {
        toast.error('Adicione pelo menos um item à venda.');
        return;
    }

    for (const item of items) {
        if (item.isManual) {
            if (!item.descricao_manual || item.descricao_manual.trim() === '') {
                toast.error('Preencha a descrição para todos os itens manuais.');
                return;
            }
        } else {
            if (!item.produto_id) {
                toast.error('Selecione o produto para todos os itens não manuais.');
                return;
            }
        }
        if (!item.quantidade || item.quantidade <= 0) {
             toast.error('Quantidade inválida em um dos itens.');
             return;
        }
         if (item.preco_unitario === undefined || item.preco_unitario < 0) {
             toast.error('Preço unitário inválido em um dos itens.');
             return;
        }
    }
    
    const valorTotalCalculado = items.reduce((total, item) => {
        return total + (Number(item.quantidade || 0) * Number(item.preco_unitario || 0))
    }, 0)

    if (valorTotalCalculado <= 0) {
        toast.error('O valor total da venda deve ser maior que zero.');
        return;
    }

    const itemsParaSalvar = items.map(item => ({
        produto_id: item.isManual ? null : item.produto_id,
        descricao_manual: item.isManual ? item.descricao_manual : null,
        quantidade: Number(item.quantidade),
        preco_unitario: Number(item.preco_unitario),
        subtotal: Number(item.quantidade) * Number(item.preco_unitario),
        user_id: userId
    }));

    const salePayload = { 
      data: dataVenda ? dataVenda.toISOString() : new Date().toISOString(), 
      cliente_id: clienteId,
      forma_pagamento_id: formaPagamentoId,
      valor_total: valorTotalCalculado,
      items: itemsParaSalvar,
      observacoes: null,
      user_id: userId,
      num_parcelas: isAPrazo ? numParcelas : undefined,
      primeiro_vencimento: isAPrazo && primeiroVencimento 
                             ? primeiroVencimento.toISOString().split('T')[0]
                             : undefined,
    };

    try {
        let success = false; // Variável para rastrear o sucesso
        if (isEditing && initialData?.id) {
            console.log(`[handleSubmit] Chamando updateSale para ID: ${initialData.id}`);
            success = await updateSale(initialData.id, salePayload); // Captura o retorno
            // Toast de sucesso é esperado vir do hook/serviço
        } else {
            console.log("[handleSubmit] Chamando createSale");
            success = await createSale(salePayload); // Captura o retorno
            // Toast de sucesso é esperado vir do hook/serviço 
        }
        
        // Mostra sucesso e fecha o diálogo APENAS se a operação retornou true
        if (success) {
            toast.success(isEditing ? 'Venda atualizada com sucesso!' : 'Venda registrada com sucesso!'); 
            onOpenChange(false); // Fecha o diálogo
            resetFormStates(); // Reseta o formulário
            queryClient.invalidateQueries({ queryKey: ['vendas'] });
            queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] });
            queryClient.invalidateQueries({ queryKey: ['produtos'] });
            
            // TENTATIVA DE REBUSCAR DADOS DA VENDA (POSSÍVEL CAUSA DO ERRO 400)
            // Se 'resultadoOperacao' não tiver todos os dados necessários (ex: nome do cliente),
            // pode ser necessário buscar novamente.
            // --- Garantir que este bloco esteja comentado ou removido ---
            /* 
            if (resultadoOperacao.id) { 
              try {
                console.log(`[handleSubmit] Rebuscando dados completos da venda ID: ${resultadoOperacao.id}`);
                const { data: vendaCompleta, error: fetchError } = await supabase
                  .from('vendas')
                  .select(`
                    *,
                    clientes ( nome ), 
                    formas_pagamento ( nome ),
                    categorias ( nome ),
                    vendas_items ( *, produtos ( nome ) )
                  `)
                  .eq('id', resultadoOperacao.id)
                  .single();

                if (fetchError) {
                  console.error('[handleSubmit] Erro ao rebuscar dados da venda:', fetchError);
                  toast.error("Venda salva, mas erro ao buscar detalhes atualizados.");
                } else {
                  console.log('[handleSubmit] Dados completos da venda rebuscados:', vendaCompleta);
                }
              } catch (reFetchErr) {
                console.error('[handleSubmit] Erro inesperado no catch ao rebuscar dados:', reFetchErr);
              }
            } 
            */
            
        } else {
            // O erro já foi exibido pelo hook, apenas loga aqui se necessário
             console.log("[handleSubmit] A operação create/update falhou (retornou false).");
        }

    } catch (submissionError) {
        // Este catch provavelmente não será alcançado, mas mantido por segurança
        console.error("Erro na submissão (SaleCadastroDialog):", submissionError);
        toast.error("Erro inesperado ao salvar a venda.");
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      resetFormStates();
    }
  }

  const selectedClientName = clienteId ? clients.find(c => c.id === clienteId)?.nome : 'Nenhum cliente selecionado';

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader className="flex flex-row justify-between items-center space-x-4 mb-4">
          <div>
            <DialogTitle>{isEditing ? 'Editar Venda' : 'Registrar Nova Venda'}</DialogTitle>
            <DialogDescription>
              {isEditing ? 'Modifique os detalhes da venda abaixo.' : 'Preencha os detalhes da nova venda.'}
            </DialogDescription>
          </div>
          <img src={logoSrc} alt="Logo" className="h-16 w-auto" />
        </DialogHeader>
        
        <div className="space-y-6 py-4 px-6 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              <Select value={clienteId || ''} onValueChange={(value) => { setClienteId(value); clearErrorOnChange(); }}>
                <SelectTrigger className="truncate">
                  <SelectValue placeholder="Selecione um cliente (Opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(client => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.nome || `Cliente ID: ${client.id.substring(0, 8)}...`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Forma de Pagamento</label>
              <Select value={formaPagamentoId || ''} onValueChange={(value) => { setFormaPagamentoId(value); clearErrorOnChange(); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isAPrazo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded bg-muted/40">
              <div className="space-y-2">
                  <label htmlFor="num_parcelas" className="text-sm font-medium">Número de Parcelas</label>
                  <Input 
                      id="num_parcelas"
                      type="number" 
                      min="1" 
                      placeholder="Ex: 2"
                      value={numParcelas || ''}
                      onChange={e => { setNumParcelas(parseInt(e.target.value, 10) || undefined); clearErrorOnChange(); }}
                  />
              </div>
              <div className="space-y-2">
                  <label className="text-sm font-medium block mb-2">Data do 1º Vencimento</label>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button
                              variant={"outline"}
                              className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !primeiroVencimento && "text-muted-foreground"
                              )}
                          >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {(primeiroVencimento instanceof Date && !isNaN(primeiroVencimento.getTime())) 
                                ? format(primeiroVencimento, "PPP", { locale: ptBR }) 
                                : <span>Escolha uma data</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                              mode="single"
                              selected={primeiroVencimento}
                              onSelect={(date) => { setPrimeiroVencimento(date); clearErrorOnChange(); }}
                              disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                              initialFocus
                              locale={ptBR}
                          />
                      </PopoverContent>
                  </Popover>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Data da Venda</label>
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
                    {(dataVenda instanceof Date && !isNaN(dataVenda.getTime()))
                      ? format(dataVenda, "PPP", { locale: ptBR }) 
                      : <span>Data inválida</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                    mode="single"
                    selected={dataVenda}
                    onSelect={(date) => { if (date) { setDataVenda(date); clearErrorOnChange(); } }}
                    initialFocus
                    locale={ptBR}
                    />
                </PopoverContent>
                </Popover>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Itens da Venda</h3>
              <Button onClick={handleAddItem} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <SaleFormItem
                  key={index}
                  index={index}
                  item={item}
                  products={products}
                  onUpdate={handleUpdateItem}
                  onRemove={handleRemoveItem}
                />
              ))}
            </div>

            <div className="text-right">
              <p className="text-lg">
                Total: <span className="font-bold">{formatCurrency(valorTotal)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Exibição do Erro de Submissão */} 
        {submissionErrorHook && (
          <p className="text-sm font-medium text-red-600 bg-red-100 p-3 rounded-md border border-red-300">
            Erro ao salvar: {submissionErrorHook}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={formDataLoading || submissionErrorHook !== null}>
            {isEditing ? 'Salvar Alterações' : 'Registrar Venda'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SaleCadastroDialog
