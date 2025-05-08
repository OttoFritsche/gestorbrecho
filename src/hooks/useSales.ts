import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { fetchSales, deleteSale, createSale as createSaleService, updateSale as updateSaleService } from '@/services/saleService'
import type { SaleWithRelations, NewSale, SaleItem } from '@/types/sales'
import { supabase } from '@/integrations/supabase/client'

// Tipo extendido para incluir o nome do cliente como string
type SaleWithClientName = SaleWithRelations & {
  cliente_nome?: string | null
}

// Interface para item de venda conforme esperado pelo serviço
interface SaleItemForService {
        produto_id?: string | null; 
        descricao_manual?: string | null; 
    quantidade: number; 
    preco_unitario: number; 
    subtotal: number;
    user_id: string; // Requerido pelo serviço!
}

// Interface para dados da venda conforme esperado pelo serviço
interface SaleDataForService {
    data_venda: string; // Sempre obrigatório
    cliente_id: string | null;
    forma_pagamento_id: string | null;
    valor_total: number;
    observacoes: string | null;
    user_id: string; // Requerido pelo serviço!
    items: SaleItemForService[];
    num_parcelas?: number | null;
    primeiro_vencimento?: string | null;
}

// Adaptado para formulário de entrada (user_id será preenchido antes de chamar serviço)
type SaleCreateParams = Omit<SaleDataForService, 'user_id' | 'items'> & {
    user_id?: string; // Opcional no formulário
    items: Omit<SaleItemForService, 'user_id'>[] & {
      user_id?: string; // Opcional no formulário
    }[];
}

// Usando o mesmo tipo para atualização
type SaleUpdateParams = SaleCreateParams;

export const useSales = () => {
  const queryClient = useQueryClient()
  const [sales, setSales] = useState<SaleWithClientName[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null);
  const [detailedSale, setDetailedSale] = useState<any | null>(null); 
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Função para limpar o estado de erro
  const clearSaleError = useCallback(() => {
    setError(null);
  }, []);

  const fetchSalesData = useCallback(async () => {
    setLoading(true)
    setError(null); // Limpa erro anterior
    try {
      const salesData = await fetchSales()
      // Adaptação para garantir que `clientes` existe antes de acessar `nome`
      const salesWithClientNames = salesData.map(sale => ({
        ...sale,
        cliente_nome: sale.clientes?.nome ?? 'Cliente Desconhecido' // Fallback melhor
      }))
      setSales(salesWithClientNames as unknown as SaleWithClientName[])
    } catch (err: any) { // Captura erro específico
      console.error("Erro ao buscar vendas:", err)
      const errorMessage = err.message || 'Erro desconhecido ao buscar vendas.';
      setError(errorMessage);
      toast.error('Erro ao buscar vendas', { description: errorMessage })
      setSales([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
      fetchSalesData();
  }, [fetchSalesData]);

  const createSale = async (sale: SaleCreateParams) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');
      
      // Se o frontend enviar 'data', renomear para 'data_venda'
      const { data, ...restSale } = sale as any;
      
      const preparedSale: SaleDataForService = {
        ...restSale,
        // Usar data_venda do frontend ou converter data para data_venda se necessário
        data_venda: sale.data_venda || data,
        user_id: user.id,
        items: sale.items.map(item => ({ ...item, user_id: user.id }))
      };
      
      console.log("[useSales] Dados preparados para envio:", preparedSale);
      await createSaleService(preparedSale);
      await fetchSalesData(); // Atualiza a lista local de vendas

      // INVALIDAR QUERIES após sucesso
      toast.info("Atualizando dados financeiros relacionados...");
      await queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] });
      await queryClient.invalidateQueries({ queryKey: ['fluxoCaixaPeriodo'] });
      await queryClient.invalidateQueries({ queryKey: ['saldoInicial'] });
      // O toast de sucesso da criação já está no service
      return true;

    } catch (err: any) {
      console.error("Erro ao criar venda (hook):", err);
      const errorMessage = err.message || 'Erro desconhecido ao criar venda.';
      setError(errorMessage);
      toast.error('Erro ao criar venda', { description: errorMessage });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSale = async (saleId: string) => {
    setLoading(true)
    setError(null);
    try {
      const { error } = await supabase.rpc('deletar_venda_e_receitas_associadas', {
        p_venda_id: saleId
      });

      if (error) throw error;

      // Não precisa chamar fetchSalesData() aqui, pois a invalidação abaixo cuidará disso indiretamente
      // toast.success("Venda excluída com sucesso!"); // O toast será movido para após a invalidação

      // INVALIDAR QUERIES após sucesso
      toast.info("Atualizando dados financeiros relacionados...");
      await queryClient.invalidateQueries({ queryKey: ['sales'] }); // Invalida a própria lista de vendas
      await queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] });
      await queryClient.invalidateQueries({ queryKey: ['fluxoCaixaPeriodo'] });
      await queryClient.invalidateQueries({ queryKey: ['saldoInicial'] });
      toast.success("Venda excluída e dados atualizados!");

    } catch (err: any) {
      console.error("Erro ao excluir venda:", err)
      const errorMessage = err.message || 'Erro desconhecido ao excluir venda.';
      setError(errorMessage);
      toast.error('Erro ao excluir venda', { description: errorMessage })
      throw err // Relança o erro
    } finally {
      setLoading(false)
    }
  }

  const updateSale = async (saleId: string, sale: SaleUpdateParams) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado.');
      
      // Se o frontend enviar 'data', renomear para 'data_venda'
      const { data, ...restSale } = sale as any;
      
      const preparedSale: SaleDataForService = {
        ...restSale,
        // Usar data_venda do frontend ou converter data para data_venda se necessário
        data_venda: sale.data_venda || data,
        user_id: user.id,
        items: sale.items.map(item => ({ ...item, user_id: user.id }))
      };
      
      console.log("[useSales] Dados preparados para atualização:", preparedSale);
      await updateSaleService(saleId, preparedSale);
      await fetchSalesData(); // Atualiza a lista local de vendas

      // INVALIDAR QUERIES após sucesso
      toast.info("Atualizando dados financeiros relacionados...");
      await queryClient.invalidateQueries({ queryKey: ['dashboardFinanceiroData'] });
      await queryClient.invalidateQueries({ queryKey: ['fluxoCaixaPeriodo'] });
      await queryClient.invalidateQueries({ queryKey: ['saldoInicial'] });
      // O toast de sucesso da atualização já está no service
      return true;

    } catch (err: any) {
      console.error("Erro ao atualizar venda (hook):", err);
      const errorMessage = err.message || 'Erro desconhecido ao atualizar venda.';
      setError(errorMessage);
      toast.error('Erro ao atualizar venda', { description: errorMessage });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Implementação completa da função getSaleById (anteriormente fetchSaleById)
  const getSaleById = useCallback(async (saleId: string) => {
    setLoadingDetail(true);
    setError(null);
    try {
      // Validar se o ID é um UUID válido
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(saleId)) {
        throw new Error(`ID inválido: ${saleId}. É necessário um UUID válido.`);
      }

      // Buscar a venda com todas as relações necessárias
      const { data, error } = await supabase
        .from('vendas')
        .select(`
          *,
          clientes:cliente_id(*),
          formas_pagamento:forma_pagamento_id(*),
          vendas_items(
            *,
            produtos:produto_id(*)
          )
        `)
        .eq('id', saleId)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Venda não encontrada');

      // Processar os dados recebidos
      const processedSale = {
        ...data,
        cliente_id: data.cliente_id || null,
        forma_pagamento_id: data.forma_pagamento_id || null,
        cliente_nome: data.clientes?.nome || data.cliente?.nome || 'Cliente Desconhecido',
        // Adicionar outros campos se necessário
      };

      setDetailedSale(processedSale);
      return processedSale;
    } catch (err: any) {
      console.error("Erro ao buscar detalhes da venda:", err);
      const errorMessage = err.message || 'Erro desconhecido ao buscar venda.';
      setError(errorMessage);
      toast.error('Erro ao buscar detalhes da venda', { description: errorMessage });
      return null;
    } finally {
      setLoadingDetail(false);
    }
  }, []);
  
  const updateParcelaStatus = async (parcelaId: string, newStatus: 'pago' | 'aguardando' | 'cancelado') => { /* ... código updateParcelaStatus existente ... */ };

  // Retorna TODAS as funções CRUD e estados relevantes
  return { 
    sales, 
    loading, 
    error,
    fetchSales: fetchSalesData, 
    createSale,
    updateSale,
    deleteSale: handleDeleteSale,
    detailedSale, 
    loadingDetail, 
    getSaleById,
    updateParcelaStatus, 
    clearSaleError
  }
}
