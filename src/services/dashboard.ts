import { supabase } from '@/integrations/supabase/client';
import { DashboardFinanceiroData, Alerta, GraficoData, UltimaTransacao } from '@/types/financeiro';
import { format, startOfMonth, endOfMonth, subMonths, getMonth, getYear, endOfDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Função auxiliar para buscar totais de um mês específico
const getMonthTotals = async (date: Date): Promise<{ totalReceitas: number; totalDespesas: number }> => {
  // Define o início do mês da data fornecida.
  const inicioMes = startOfMonth(date);
  // Define o fim do mês da data fornecida.
  const fimMes = endOfMonth(date);

  // Inicializa os totais de receitas e despesas como 0.
  let totalReceitas = 0;
  let totalDespesas = 0;

  // Tenta buscar as receitas do mês.
  try {
    // Faz a consulta ao Supabase na tabela 'receitas'.
    const { data: receitas, error: receitasError } = await supabase
      .from('receitas')
      .select('valor') // Seleciona apenas a coluna 'valor'.
      .gte('data', inicioMes.toISOString()) // Filtra registros com data maior ou igual ao início do mês.
      .lte('data', fimMes.toISOString()); // Filtra registros com data menor ou igual ao fim do mês.

    // Se houver erro na consulta de receitas.
    if (receitasError) {
      // Registra o erro no console.
      // console.error(`Erro ao buscar receitas para ${format(date, 'MM/yyyy')}:`, receitasError);
    // Se a consulta for bem-sucedida.
    } else {
      // Calcula a soma dos valores das receitas, tratando valores nulos como 0.
      totalReceitas = receitas?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;
    }
  // Captura erros inesperados durante a busca de receitas.
  } catch (error) {
    // Registra o erro inesperado no console.
    // console.error(`Erro inesperado ao buscar receitas para ${format(date, 'MM/yyyy')}:`, error);
  }

  // Tenta buscar as despesas do mês.
  try {
    // Faz a consulta ao Supabase na tabela 'despesas'.
    const { data: despesas, error: despesasError } = await supabase
      .from('despesas')
      .select('valor') // Seleciona apenas a coluna 'valor'.
      // IMPORTANTE: Considerar se deve somar apenas despesas PAGAS ('pago', true)
      // .eq('pago', true)
      .gte('data', inicioMes.toISOString()) // Filtra registros com data maior ou igual ao início do mês.
      .lte('data', fimMes.toISOString()); // Filtra registros com data menor ou igual ao fim do mês.

    // Se houver erro na consulta de despesas.
    if (despesasError) {
      // Registra o erro no console.
      // console.error(`Erro ao buscar despesas para ${format(date, 'MM/yyyy')}:`, despesasError);
    // Se a consulta for bem-sucedida.
    } else {
      // Calcula a soma dos valores das despesas, tratando valores nulos como 0.
      totalDespesas = despesas?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;
    }
  // Captura erros inesperados durante a busca de despesas.
  } catch (error) {
    // Registra o erro inesperado no console.
    // console.error(`Erro inesperado ao buscar despesas para ${format(date, 'MM/yyyy')}:`, error);
  }

  // Retorna os totais calculados.
  return { totalReceitas, totalDespesas };
};

// Função auxiliar para calcular o Custo dos Itens Vendidos (CMV) em um período
const getCustoItensVendidos = async (startDate: Date, endDate: Date): Promise<number> => {
  let custoTotal = 0;

  try {
    // 1. Buscar todos os itens vendidos no período
    const { data: itensVendidos, error: itensError } = await supabase
      .from('vendas_items')
      .select(`
        quantidade,
        produto_id,
        produtos ( preco_custo ) 
      `)
      .gte('created_at', startDate.toISOString()) // Assumindo que vendas_items tem created_at
      .lte('created_at', endDate.toISOString())
      .not('produto_id', 'is', null); // Apenas itens que são produtos cadastrados

    if (itensError) {
      console.error("Erro ao buscar itens vendidos para cálculo de CMV:", itensError);
      return 0;
    }

    if (!itensVendidos) {
      return 0;
    }

    // 2. Calcular o custo total
    custoTotal = itensVendidos.reduce((sum, item) => {
      // Acessa o preco_custo através da relação 'produtos'
      const custoUnitario = item.produtos?.preco_custo ?? 0; 
      const quantidade = item.quantidade ?? 0;
      return sum + (custoUnitario * quantidade);
    }, 0);

  } catch (error) {
    console.error("Erro inesperado ao calcular CMV:", error);
    return 0;
  }

  return custoTotal;
};

// Função auxiliar para buscar totais de um mês específico para o GRÁFICO
const getMonthChartTotals = async (date: Date): Promise<{ totalVendido: number; totalDespesasPagas: number }> => {
  const inicioMes = startOfMonth(date);
  const fimMes = endOfMonth(date);
  const inicioMesStr = format(inicioMes, 'yyyy-MM-dd');
  const fimMesStr = format(fimMes, 'yyyy-MM-dd');

  let totalVendido = 0;
  let totalDespesasPagas = 0;

  // Buscar Total Vendido (Receita Bruta das Vendas)
  try {
    const { data: vendas, error: vendasError } = await supabase
      .from('vendas') // <-- Tabela correta: vendas
      .select('valor_total')
      .gte('data_venda_local', inicioMesStr) // <-- Coluna e formato corretos
      .lte('data_venda_local', fimMesStr);    // <-- Coluna e formato corretos

    if (vendasError) {
      console.error(`Erro ao buscar vendas para gráfico (${format(date, 'MM/yyyy')}):`, vendasError);
    } else {
      totalVendido = vendas?.reduce((sum, item) => sum + (item.valor_total || 0), 0) || 0;
    }
  } catch (error) {
    console.error(`Erro inesperado ao buscar vendas para gráfico (${format(date, 'MM/yyyy')}):`, error);
  }

  // Buscar Total Despesas PAGAS
  try {
    const { data: despesas, error: despesasError } = await supabase
      .from('despesas')
      .select('valor')
      .eq('pago', true) // <-- Considerar apenas despesas pagas para o comparativo
      .gte('data', inicioMesStr) // <-- Formato correto
      .lte('data', fimMesStr);    // <-- Formato correto

    if (despesasError) {
      console.error(`Erro ao buscar despesas pagas para gráfico (${format(date, 'MM/yyyy')}):`, despesasError);
    } else {
      totalDespesasPagas = despesas?.reduce((sum, item) => sum + (item.valor || 0), 0) || 0;
    }
  } catch (error) {
    console.error(`Erro inesperado ao buscar despesas pagas para gráfico (${format(date, 'MM/yyyy')}):`, error);
  }

  return { totalVendido, totalDespesasPagas };
};

/**
 * Busca o histórico de saldo final do caixa dos últimos N dias.
 * @param dias Número de dias para buscar o histórico (padrão: 30).
 * @returns Array com data (YYYY-MM-DD) e saldo.
 */
export const getHistoricoSaldoCaixa = async (dias: number = 30): Promise<{ data: string; saldo: number }[]> => {
  try {
    const hoje = new Date();
    const dataInicioBusca = subDays(hoje, dias - 1); // Subtrai dias-1 para incluir hoje
    const dataInicioFormatada = format(dataInicioBusca, 'yyyy-MM-dd');
    const dataFimFormatada = format(hoje, 'yyyy-MM-dd'); // Até hoje

    console.log(`[getHistoricoSaldoCaixa] Buscando histórico de saldo de ${dataInicioFormatada} até ${dataFimFormatada}`);

    const { data, error } = await supabase
      .from('fluxo_caixa')
      .select('data, saldo_final')
      .gte('data', dataInicioFormatada)
      .lte('data', dataFimFormatada)
      .order('data', { ascending: true }); // Ordenar por data ascendente para o gráfico

    if (error) {
      console.error('[getHistoricoSaldoCaixa] Erro ao buscar histórico:', error);
      throw new Error('Erro ao buscar histórico de saldo do caixa.');
    }

    // Mapear para o formato esperado { data: string, saldo: number }
    const historicoFormatado = data?.map(item => ({
      data: item.data, // Manter YYYY-MM-DD
      saldo: item.saldo_final ?? 0 // Usar 0 se saldo for null
    })) ?? [];

    console.log('[getHistoricoSaldoCaixa] Histórico encontrado:', historicoFormatado.length, 'registros');
    return historicoFormatado;

  } catch (error) {
    console.error('Erro inesperado em getHistoricoSaldoCaixa:', error);
    return []; // Retornar vazio em caso de erro
  }
};

export const getDashboardFinanceiroData = async (): Promise<DashboardFinanceiroData> => {
  // Obtém a data atual.
  const hoje = new Date();
  // Define o início do mês atual.
  const inicioMesAtual = startOfMonth(hoje);
  // Define o fim do mês atual.
  const fimMesAtual = endOfMonth(hoje);

  // Inicializa as variáveis para o resumo do mês atual e saldo.
  let totalVendidoMes = 0;
  let custoItensVendidosMes = 0;
  let totalOutrasDespesasMes = 0; // Despesas gerais (excluindo custo dos itens)
  let saldoAtualCaixa = 0;
  // Inicializa a contagem de metas.
  let contagemMetasAndamento = 0;
  // Inicializa o array para os dados do gráfico dos últimos 6 meses.
  let graficoReceitaDespesa: GraficoData[] = [];
  // Inicializa o array para últimas transações.
  let ultimasTransacoes: UltimaTransacao[] = [];

  // --- Busca dados para o Resumo do Mês Atual --- 
  // Usaremos a tabela 'vendas' para o total vendido e calcularemos o CMV
  // 1. Calcular Total Vendido (Receita Bruta das Vendas)
  try {
      const { data: vendasMes, error: vendasError } = await supabase
          .from('vendas')
          .select('valor_total')
          .gte('data_venda', inicioMesAtual.toISOString())
          .lte('data_venda', fimMesAtual.toISOString());

      if (vendasError) throw vendasError;
      totalVendidoMes = vendasMes?.reduce((sum, venda) => sum + (venda.valor_total || 0), 0) || 0;
  } catch (error) {
      console.error("Erro ao buscar total de vendas do mês:", error);
  }

  // 2. Calcular Custo dos Itens Vendidos (CMV) no mês
  custoItensVendidosMes = await getCustoItensVendidos(inicioMesAtual, fimMesAtual);

  // 3. Calcular "Sobrou das Vendas" (Lucro Bruto)
  const sobrouDasVendasMes = totalVendidoMes - custoItensVendidosMes;

  // 4. Buscar Outras Despesas do Mês (excluindo compras de estoque se tratadas pelo CMV)
  // TODO: Refinar esta lógica se as compras de estoque são lançadas aqui.
  try {
      const { data: despesas, error: despesasError } = await supabase
        .from('despesas')
        .select('valor')
        // ADICIONAR FILTRO PARA EXCLUIR CATEGORIA "COMPRA DE ESTOQUE" SE ELA EXISTIR E FOR USADA
        // .not('categoria_id', 'eq', 'ID_DA_CATEGORIA_COMPRA_ESTOQUE') 
        .gte('data', inicioMesAtual.toISOString())
        .lte('data', fimMesAtual.toISOString());

      if (despesasError) throw despesasError;
      totalOutrasDespesasMes = despesas?.reduce((sum, despesa) => sum + (despesa.valor || 0), 0) || 0;
  } catch(error) {
      console.error("Erro ao buscar outras despesas do mês:", error);
  }
  
  // 5. Calcular Resultado Final (Lucro Líquido)
  const resultadoFinalMes = sobrouDasVendasMes - totalOutrasDespesasMes;

  // --- Busca Saldo Atual do Caixa --- 
  try {
    // Abordagem totalmente nova: filtrar depois de buscar os registros mais recentes
    console.log("[getSaldoAtual] Iniciando busca de saldo - Hoje é:", new Date().toISOString());
    
    // 1. Buscar alguns registros recentes sem filtro inicial
    const { data: registrosRecentes, error: fluxoError } = await supabase
      .from('fluxo_caixa')
      .select('saldo_final, data')
      .order('data', { ascending: false })
      .limit(10); // Pegar até 10 registros recentes

    if (fluxoError) {
      console.error('[getSaldoAtual] Erro na consulta:', fluxoError);
      saldoAtualCaixa = 0;
    } 
    else if (!registrosRecentes || registrosRecentes.length === 0) {
      console.log('[getSaldoAtual] Nenhum registro de fluxo_caixa encontrado');
      saldoAtualCaixa = 0;
    } 
    else {
      // 2. Filtrar manualmente os registros para encontrar o último até hoje
      console.log('[getSaldoAtual] Registros obtidos:', 
        registrosRecentes.map(r => `Data: ${r.data}, Saldo: ${r.saldo_final}`));
        
      const dataHoje = new Date();
      const hojeFormatado = dataHoje.toISOString().split('T')[0]; // 'YYYY-MM-DD'
      console.log('[getSaldoAtual] Data de hoje formatada:', hojeFormatado);
      
      // Filtra os registros até a data de hoje
      const registrosAtéHoje = registrosRecentes.filter(reg => {
        // Converter a data do registro para o formato 'YYYY-MM-DD' para comparar apenas a data
        const dataReg = typeof reg.data === 'string' ? reg.data.split('T')[0] : '';
        const resultado = dataReg <= hojeFormatado;
        console.log(`[getSaldoAtual] Comparando: ${dataReg} <= ${hojeFormatado} = ${resultado}`);
        return resultado;
      });
      
      if (registrosAtéHoje.length > 0) {
        // Pega o primeiro (mais recente) registro após o filtro
        const ultimoRegistro = registrosAtéHoje[0];
        saldoAtualCaixa = ultimoRegistro.saldo_final;
        console.log(`[getSaldoAtual] Saldo encontrado: ${saldoAtualCaixa} (Data: ${ultimoRegistro.data})`);
      } else {
        console.log('[getSaldoAtual] Nenhum registro até hoje após filtro');
        saldoAtualCaixa = 0;
      }
    }
  } catch (error) {
    console.error('[getSaldoAtual] Erro inesperado:', error);
    saldoAtualCaixa = 0;
  }

  // --- Busca Contagem de Metas em Andamento ---
  try {
    // Faz a consulta para contar metas com status 'andamento'.
    const { count, error: metasError } = await supabase
      .from('metas') // Nome da tabela de metas
      .select('*', { count: 'exact', head: true }) // Pede apenas a contagem
      .eq('status', 'andamento'); // Filtra pelo status

    // Se houver erro na consulta de metas.
    if (metasError) {
      // Registra o erro no console, mas continua com contagem 0.
      console.error('Erro ao buscar contagem de metas em andamento:', metasError);
      contagemMetasAndamento = 0;
    // Se a consulta for bem-sucedida.
    } else {
      // Atribui a contagem retornada (ou 0 se for null).
      contagemMetasAndamento = count ?? 0;
      // Log para verificar a contagem obtida
      console.log('[getDashboardFinanceiroData] contagemMetasAndamento:', contagemMetasAndamento);
    }
  // Captura erros inesperados durante a busca da contagem de metas.
  } catch (error) {
    // Registra o erro inesperado no console.
    console.error('Erro inesperado ao buscar contagem de metas:', error);
    // Mantém a contagem como 0 em caso de erro.
    contagemMetasAndamento = 0;
  }

  // --- Busca dados para o Gráfico (Últimos 6 Meses) ---
  try {
    const promisesArray = Array.from({ length: 6 }).map(async (_, i) => {
      const dataMesLoop = subMonths(hoje, 5 - i);
      const mesFormatado = format(dataMesLoop, 'MMM/yy', { locale: ptBR });
      
      // Chama a função corrigida para dados do gráfico
      const totais = await getMonthChartTotals(dataMesLoop);
      
      console.log(`[getGraficoDados] Mês ${mesFormatado}: Vendas=${totais.totalVendido}, Despesas=${totais.totalDespesasPagas}`);
      
      return {
        mes: mesFormatado,
        receitas: totais.totalVendido,
        despesas: totais.totalDespesasPagas,
      };
    });
    
    graficoReceitaDespesa = await Promise.all(promisesArray);
    console.log("[getGraficoDados] Dados completos para gráfico:", 
      graficoReceitaDespesa.map(d => `${d.mes}: R=${d.receitas}, D=${d.despesas}`).join(' | '));
  } catch (error) {
    console.error("[getGraficoDados] Erro ao gerar dados do gráfico:", error);
    graficoReceitaDespesa = [];
  }

  // --- Busca Histórico de Saldo (NOVO) ---
  let historicoSaldoCaixa: { data: string; saldo: number }[] = [];
  try {
    historicoSaldoCaixa = await getHistoricoSaldoCaixa(30); // Buscar últimos 30 dias
  } catch(error) {
    console.error("Erro ao buscar histórico de saldo para dashboard:", error);
    // Não parar o carregamento do dashboard por erro no histórico
  }

  // --- BUSCAR ÚLTIMAS TRANSAÇÕES (NOVO) ---
  try {
    const limite = 4; // Quantidade de transações a buscar (AJUSTADO PARA 4)
    console.log(`[getUltimasTransacoes] Buscando últimas ${limite} receitas e despesas...`);

    // Buscar últimas receitas
    const { data: ultimasReceitasData, error: receitasError } = await supabase
      .from('receitas')
      .select('id, descricao, valor, data, categoria_id, categorias ( nome )')
      .order('data', { ascending: false })
      .order('created_at', { ascending: false }) // Desempate por criação
      .limit(limite);

    if (receitasError) {
      console.error("[getUltimasTransacoes] Erro ao buscar receitas:", receitasError);
    }

    // Buscar últimas despesas
    const { data: ultimasDespesasData, error: despesasError } = await supabase
      .from('despesas')
      .select('id, descricao, valor, data, pago, categoria_id, categorias ( nome )') // Incluir 'pago'
      // .eq('pago', true) // Opcional: Mostrar apenas despesas pagas?
      .order('data', { ascending: false })
      .order('created_at', { ascending: false }) // Desempate por criação
      .limit(limite);

    if (despesasError) {
      console.error("[getUltimasTransacoes] Erro ao buscar despesas:", despesasError);
    }

    // Mapear receitas para o formato UltimaTransacao
    const receitasFormatadas: UltimaTransacao[] = ultimasReceitasData?.map(r => ({
      id: r.id,
      tipo: 'receita' as const,
      descricao: r.descricao || 'Receita sem descrição',
      valor: r.valor || 0,
      data: r.data, // Assume que data está no formato correto
      categoria_nome: r.categorias?.nome
    })) ?? [];

    // Mapear despesas para o formato UltimaTransacao
    const despesasFormatadas: UltimaTransacao[] = ultimasDespesasData?.map(d => ({
      id: d.id,
      tipo: 'despesa' as const,
      descricao: d.descricao || 'Despesa sem descrição',
      valor: d.valor || 0,
      data: d.data, // Assume que data está no formato correto
      categoria_nome: d.categorias?.nome
      // Adicionar indicador se não estiver paga? Ex: `descricao: d.pago ? d.descricao : \`(Não Paga) ${d.descricao}\``
    })) ?? [];

    // Combinar, ordenar por data (mais recentes primeiro) e limitar
    ultimasTransacoes = [...receitasFormatadas, ...despesasFormatadas]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()) // Ordena pela data
      .slice(0, limite); // Pega as N mais recentes no total

    console.log(`[getUltimasTransacoes] ${ultimasTransacoes.length} transações encontradas.`);

  } catch (error) {
    console.error("[getUltimasTransacoes] Erro inesperado:", error);
    ultimasTransacoes = []; // Retorna vazio em caso de erro
  }

  // --- Montagem Final do Objeto de Retorno --- 
  // Calcula o saldo do mês atual.
  const saldoMesAtual = totalVendidoMes - totalOutrasDespesasMes;

  // Retorna o objeto DashboardFinanceiroData completo.
  return {
    // Dados para o card Resumo do Mês.
    resumoMes: {
      totalVendido: totalVendidoMes,
      custoItensVendidos: custoItensVendidosMes,
      sobrouDasVendas: sobrouDasVendasMes,
      gastosGerais: totalOutrasDespesasMes,
      resultadoFinal: resultadoFinalMes,
      totalReceitas: totalVendidoMes,
      totalDespesas: totalOutrasDespesasMes,
      saldoMes: saldoMesAtual
    },
    // Saldo atual do caixa.
    saldoAtualCaixa,
    // Contagem de metas (agora buscada).
    contagemMetasAndamento,
    // Dados formatados para o gráfico de histórico.
    graficoReceitaDespesa,
    // Histórico de saldo do caixa
    historicoSaldoCaixa,
    // Últimas transações
    ultimasTransacoes,
  };
};
