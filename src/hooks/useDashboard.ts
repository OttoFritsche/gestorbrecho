import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, addDays, format } from 'date-fns';
import { FluxoCaixa } from '@/types/financeiro';

export const useDashboard = () => {
  const today = new Date();
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  
  // Para buscar dados do dia atual
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);
  
  // Para alertas de vencimentos próximos (próximos 7 dias)
  const proximos7Dias = addDays(today, 7);
  
  // Formatar datas para consulta SQL
  const todayFormatted = format(today, 'yyyy-MM-dd');

  const fetchDashboardData = async () => {
    console.log('Buscando dados do dashboard para a data:', todayFormatted);
    
    const [
      saldoResponse,           // Saldo atual
      vendasHojeResponse,      // Vendas do dia atual
      metasResponse,           // Metas em andamento
      estoqueBaixoResponse,    // Itens com estoque baixo
      contasPagarResponse,     // Contas a pagar nos próximos dias
    ] = await Promise.all([
      // Buscar saldo mais recente
      supabase
        .from('fluxo_caixa')
        .select('saldo_final')
        .order('data', { ascending: false })
        .limit(1)
        .maybeSingle(),
        
      // Buscar vendas realizadas hoje
      // Corrigido: usar status 'pago' em vez de 'concluida' e utilizar TO_CHAR para comparar datas
      supabase.rpc('get_vendas_hoje', { data_hoje: todayFormatted })
        .then(response => {
          if (response.error) {
            console.error('Erro ao buscar vendas via RPC:', response.error);
            // Fallback - usar método regular
            return supabase
              .from('vendas')
              .select('id, valor_total, status')
              .eq('status', 'pago')
              .filter('data_venda', 'gte', todayFormatted)
              .filter('data_venda', 'lt', format(addDays(today, 1), 'yyyy-MM-dd'));
          }
          return response;
        }),
      
      // Buscar metas em andamento
      supabase
        .from('metas')
        .select('*')
        .eq('status', 'andamento'),
        
      // Buscar produtos com estoque baixo
      // Corrigido: usar uma abordagem mais simples para identificar produtos com estoque baixo
      supabase
        .from('produtos')
        .select('id, nome, quantidade, categoria_id')
        .eq('status', 'disponivel')
        .lte('quantidade', 2),
        
      // Buscar contas a pagar nos próximos 7 dias
      // Note: Estamos pulando a consulta de parcelas que estava dando 404
      supabase
        .from('despesas')
        .select('id, valor, data_vencimento, descricao')
        .eq('pago', false)
        .gte('data_vencimento', format(today, 'yyyy-MM-dd'))
        .lte('data_vencimento', format(proximos7Dias, 'yyyy-MM-dd')),
    ]);

    if (saldoResponse.error) throw saldoResponse.error;
    if (vendasHojeResponse.error) throw vendasHojeResponse.error;
    if (metasResponse.error) throw metasResponse.error;
    if (estoqueBaixoResponse.error) throw estoqueBaixoResponse.error;
    if (contasPagarResponse.error) throw contasPagarResponse.error;

    // Obter saldo atual
    const saldoAtual = saldoResponse.data?.saldo_final ?? 0;

    // Calcular total de vendas do dia
    console.log('Vendas de hoje:', vendasHojeResponse.data);
    const vendasHoje = {
      valorTotal: vendasHojeResponse.data?.reduce((acc, venda) => acc + Number(venda.valor_total), 0) ?? 0,
      quantidade: vendasHojeResponse.data?.length ?? 0
    };
    
    // Calcular progresso das metas
    let progressoMetas = 0;
    if (metasResponse.data && metasResponse.data.length > 0) {
      const totalPercentage = metasResponse.data.reduce((acc, meta) => {
        if (meta.valor_meta > 0) {
          return acc + ((meta.valor_atual / meta.valor_meta) * 100);
        }
        return acc;
      }, 0);
      
      progressoMetas = metasResponse.data.length > 0 
        ? totalPercentage / metasResponse.data.length 
        : 0;
    }

    // Dados para alertas
    const estoqueAlerta = {
      itens: estoqueBaixoResponse.data ?? [],
      quantidade: estoqueBaixoResponse.data?.length ?? 0
    };

    const alertas = {
      // Como a tabela 'parcelas' não existe ou não está acessível,
      // estamos fornecendo dados vazios para parcelasReceber
      parcelasReceber: {
        itens: [],
        quantidade: 0,
        valorTotal: 0
      },
      contasPagar: {
        itens: contasPagarResponse.data ?? [],
        quantidade: contasPagarResponse.data?.length ?? 0,
        valorTotal: contasPagarResponse.data?.reduce((acc, despesa) => acc + Number(despesa.valor), 0) ?? 0
      },
      estoqueBaixo: estoqueAlerta
    };

    return {
      saldoAtual,
      vendasHoje,
      progressoMetas,
      alertas
    };
  };

  return useQuery({
    queryKey: ['dashboard-operacional', todayFormatted],
    queryFn: fetchDashboardData,
    staleTime: 1000 * 60 * 5, // 5 minutos
    // Tratamento de erro para evitar tentativas infinitas de busca
    retry: false,
  });
};
