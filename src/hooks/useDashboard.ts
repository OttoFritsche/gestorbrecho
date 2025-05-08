import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth } from 'date-fns';
import { FluxoCaixa } from '@/types/financeiro';

export const useDashboard = () => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);

  const fetchDashboardData = async () => {
    const [
      receitasResponse,         // Alterado: buscar da tabela receitas em vez de vendas
      expensesResponse, 
      lastCashFlowResponse, 
      cashFlowGraphDataResponse,
      metasResponse             // Novo: buscar metas cadastradas
    ] = await Promise.all([
      // Buscar receitas do mês atual
      supabase
        .from('receitas')
        .select('valor')
        .gte('data', monthStart.toISOString().split('T')[0])
        .lte('data', monthEnd.toISOString().split('T')[0]),

      // Buscar despesas pagas do mês atual
      supabase
        .from('despesas')
        .select('valor')
        .eq('pago', true)
        .gte('data', monthStart.toISOString().split('T')[0])
        .lte('data', monthEnd.toISOString().split('T')[0]),
      
      // Buscar saldo mais recente
      supabase
        .from('fluxo_caixa')
        .select('saldo_final')
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle(),

      // Buscar dados para o gráfico
      supabase
        .from('fluxo_caixa')
        .select('*')
        .order('data', { ascending: true })
        .limit(30),
        
      // Buscar metas em andamento
      supabase
        .from('metas')
        .select('*')
        .eq('status', 'andamento')
    ]);

    if (receitasResponse.error) throw receitasResponse.error;
    if (expensesResponse.error) throw expensesResponse.error;
    if (lastCashFlowResponse.error) throw lastCashFlowResponse.error;
    if (cashFlowGraphDataResponse.error) throw cashFlowGraphDataResponse.error;
    if (metasResponse.error) throw metasResponse.error;

    // Calcular receitas do mês atual (soma de todos os valores de receitas)
    const monthReceipts = receitasResponse.data?.reduce((acc, curr) => acc + Number(curr.valor), 0) ?? 0;
    
    // Calcular despesas do mês
    const monthPaidExpenses = expensesResponse.data?.reduce((acc, curr) => acc + Number(curr.valor), 0) ?? 0;
    
    // Obter saldo atual
    const currentBalance = lastCashFlowResponse.data?.saldo_final ?? 0;

    // Calcular progresso das metas apenas se existirem metas cadastradas
    let progressPercentage = 0;
    
    if (metasResponse.data && metasResponse.data.length > 0) {
      // Cálculo mais complexo poderia ser feito aqui, 
      // como média de progresso de todas as metas ou apenas metas prioritárias
      // Por agora, vamos simplificar e calcular o progresso médio
      
      const totalPercentage = metasResponse.data.reduce((acc, meta) => {
        // Verificar se o valor_alvo é maior que zero para evitar divisão por zero
        if (meta.valor_meta > 0) {
          return acc + ((meta.valor_atual / meta.valor_meta) * 100);
        }
        return acc;
      }, 0);
      
      progressPercentage = metasResponse.data.length > 0 
        ? totalPercentage / metasResponse.data.length 
        : 0;
    }

    return {
      saldoAtual: currentBalance,
      receitasMes: monthReceipts,
      despesasMes: monthPaidExpenses,
      progressoMetas: progressPercentage,
      fluxoCaixaData: cashFlowGraphDataResponse.data ?? [] as FluxoCaixa[]
    };
  };

  return useQuery({
    queryKey: ['dashboard-data'],
    queryFn: fetchDashboardData,
  });
};
