import { supabase } from '@/integrations/supabase/client';
import {
  ResumoFinanceiroData,
  Receita,
  Despesa,
  DespesaCategoriaAgrupada,
  ReceitaCategoriaAgrupada,
  LucratividadeMensalData
} from '@/types/financeiro';
import { format, startOfMonth, endOfMonth, subMonths, setMonth, setYear } from 'date-fns';

/**
 * Busca os dados para o relatório de resumo financeiro do mês atual ou de um mês/ano específico.
 * @param ano Ano do período desejado (opcional, padrão: ano atual)
 * @param mes Mês do período desejado (0-11, opcional, padrão: mês atual)
 */
export const getResumoFinanceiroMesAtual = async (
  ano?: number,
  mes?: number
): Promise<ResumoFinanceiroData> => {
  try {
    // Se ano e mês forem fornecidos, usa-os. Caso contrário, usa a data atual
    let dataBase = new Date();
    
    if (ano !== undefined && mes !== undefined) {
      // Mês é 0-indexed (0 = Janeiro, 11 = Dezembro)
      dataBase = setMonth(setYear(new Date(), ano), mes);
      console.log(`Buscando resumo financeiro para: ${format(dataBase, 'MMMM/yyyy')}`);
    }

    const dataInicioMes = format(startOfMonth(dataBase), 'yyyy-MM-dd');
    const dataFimMes = format(endOfMonth(dataBase), 'yyyy-MM-dd');

    // 1. Buscar Total de Receitas do Mês
    const { data: receitasData, error: receitasError } = await supabase
      .from('receitas')
      .select('valor')
      .gte('data', dataInicioMes)
      .lte('data', dataFimMes);

    if (receitasError) {
      console.error('Erro ao buscar receitas do mês:', receitasError);
      throw new Error('Erro ao buscar receitas.');
    }
    const totalReceitas = receitasData?.reduce((sum, item) => sum + item.valor, 0) ?? 0;

    // 2. Buscar Total de Despesas Pagas do Mês
    const { data: despesasData, error: despesasError } = await supabase
      .from('despesas')
      .select('valor')
      .eq('pago', true) // Apenas despesas pagas
      .gte('data', dataInicioMes) // Considera a data de pagamento/registro
      .lte('data', dataFimMes);

    if (despesasError) {
      console.error('Erro ao buscar despesas pagas do mês:', despesasError);
      throw new Error('Erro ao buscar despesas.');
    }
    const totalDespesas = despesasData?.reduce((sum, item) => sum + item.valor, 0) ?? 0;

    // 3. Buscar Saldo Atual (último saldo do fluxo de caixa)
    const { data: fluxoData, error: fluxoError } = await supabase
      .from('fluxo_caixa')
      .select('saldo_final')
      .order('data', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Não lançar erro se não houver fluxo, apenas logar e usar 0
    if (fluxoError && fluxoError.code !== 'PGRST116') {
      console.error('Erro ao buscar saldo atual:', fluxoError);
    }
    const saldoAtual = fluxoData?.saldo_final ?? 0;

    // 4. Buscar Últimas 5 Receitas
    const { data: ultimasReceitasData, error: ultimasReceitasError } = await supabase
      .from('receitas')
      .select('*')
      .gte('data', dataInicioMes) // Filtrar pelo período selecionado
      .lte('data', dataFimMes)
      .order('data', { ascending: false })
      .limit(5);

    if (ultimasReceitasError) {
      console.error('Erro ao buscar últimas receitas:', ultimasReceitasError);
      // Pode continuar sem as últimas receitas ou lançar erro
    }
    const ultimasReceitas = ultimasReceitasData || [];

    // 5. Buscar Últimas 5 Despesas Pagas
    const { data: ultimasDespesasData, error: ultimasDespesasError } = await supabase
      .from('despesas')
      .select('*')
      .eq('pago', true)
      .gte('data', dataInicioMes) // Filtrar pelo período selecionado
      .lte('data', dataFimMes)
      .order('data', { ascending: false })
      .limit(5);

    if (ultimasDespesasError) {
      console.error('Erro ao buscar últimas despesas:', ultimasDespesasError);
    }
    const ultimasDespesas = ultimasDespesasData || [];

    // Montar o objeto de retorno
    return {
      dataInicio: dataInicioMes,
      dataFim: dataFimMes,
      totalReceitas,
      totalDespesas,
      saldoAtual,
      ultimasReceitas,
      ultimasDespesas,
    };

  } catch (error) {
    console.error('Erro geral ao buscar resumo financeiro:', error);
    // Em caso de erro, retorna um objeto com valores padrão/zerados
    let dataBase = new Date();
    if (ano !== undefined && mes !== undefined) {
      dataBase = setMonth(setYear(new Date(), ano), mes);
    }
    
    return {
      dataInicio: format(startOfMonth(dataBase), 'yyyy-MM-dd'),
      dataFim: format(endOfMonth(dataBase), 'yyyy-MM-dd'),
      totalReceitas: 0,
      totalDespesas: 0,
      saldoAtual: 0,
      ultimasReceitas: [],
      ultimasDespesas: [],
    };
  }
};

/**
 * Busca e agrupa as despesas pagas por categoria dentro de um período específico.
 * @param dataInicio Data de início do período (formato YYYY-MM-DD)
 * @param dataFim Data de fim do período (formato YYYY-MM-DD)
 */
export const getDespesasPorCategoria = async (
  dataInicio: string,
  dataFim: string
): Promise<DespesaCategoriaAgrupada[]> => {
  try {
    const { data, error } = await supabase
      .from('despesas')
      .select(`
        categoria_id,
        categorias ( nome ),
        valor
      `)
      .eq('pago', true) // Considera apenas despesas pagas
      .gte('data', dataInicio) // REVERTIDO: Filtra pela data original (data)
      .lte('data', dataFim);    // REVERTIDO: Filtra pela data original (data)

    if (error) {
      console.error('Erro ao buscar despesas por categoria:', error);
      throw new Error('Erro ao buscar dados das despesas.');
    }

    // Agrupamento manual no lado do cliente (TypeScript)
    const agrupado: { [key: string]: DespesaCategoriaAgrupada } = {};

    data?.forEach((despesa) => {
      // Garante que categoria_id seja string ou 'sem_categoria'
      const idCat = despesa.categoria_id ?? 'sem_categoria';
      // Garante que categorias é um objeto ou null, e acessa nome ou usa padrão
      const nomeCat = (despesa.categorias as { nome: string } | null)?.nome ?? 'Sem Categoria';

      if (!agrupado[idCat]) {
        agrupado[idCat] = {
          categoria_id: despesa.categoria_id, // Mantém null se for o caso
          categoria_nome: nomeCat,
          total_despesa: 0,
          quantidade_despesas: 0,
        };
      }
      // Soma o valor da despesa atual ao total da categoria
      agrupado[idCat].total_despesa += despesa.valor;
      // Incrementa a contagem de despesas na categoria
      agrupado[idCat].quantidade_despesas += 1;
    });

    // Converte o objeto agrupado em um array e ordena por total decrescente
    const resultadoArray = Object.values(agrupado).sort(
      (a, b) => b.total_despesa - a.total_despesa
    );

    return resultadoArray;

  } catch (error) {
    console.error('Erro geral ao processar despesas por categoria:', error);
    // Retorna um array vazio em caso de erro
    return [];
  }
};

/**
 * Busca e agrupa as receitas por categoria dentro de um período específico.
 * @param dataInicio Data de início do período (formato YYYY-MM-DD)
 * @param dataFim Data de fim do período (formato YYYY-MM-DD)
 */
export const getReceitasPorCategoria = async (
  dataInicio: string,
  dataFim: string
): Promise<ReceitaCategoriaAgrupada[]> => {
  try {
    // Busca receitas e faz join com categorias
    const { data, error } = await supabase
      .from('receitas')
      .select(`
        categoria_id,
        categorias ( nome ),
        valor
      `)
      .gte('data', dataInicio) // Filtra pela data da receita
      .lte('data', dataFim);

    if (error) {
      console.error('Erro ao buscar receitas por categoria:', error);
      throw new Error('Erro ao buscar dados das receitas.');
    }

    // Agrupamento manual no lado do cliente (TypeScript)
    const agrupado: { [key: string]: ReceitaCategoriaAgrupada } = {};

    data?.forEach((receita) => {
      const idCat = receita.categoria_id ?? 'sem_categoria';
      const nomeCat = (receita.categorias as { nome: string } | null)?.nome ?? 'Sem Categoria';

      if (!agrupado[idCat]) {
        agrupado[idCat] = {
          categoria_id: receita.categoria_id,
          categoria_nome: nomeCat,
          total_receita: 0,
          quantidade_receitas: 0,
        };
      }
      agrupado[idCat].total_receita += receita.valor;
      agrupado[idCat].quantidade_receitas += 1;
    });

    // Converte para array e ordena por total decrescente
    const resultadoArray = Object.values(agrupado).sort(
      (a, b) => b.total_receita - a.total_receita
    );

    return resultadoArray;

  } catch (error) {
    console.error('Erro geral ao processar receitas por categoria:', error);
    return []; // Retorna array vazio em caso de erro
  }
};

/**
 * Calcula a lucratividade bruta para um mês e ano específicos.
 * @param dataInicio Data de início do mês (formato YYYY-MM-DD)
 * @param dataFim Data de fim do mês (formato YYYY-MM-DD)
 * @param mesReferencia Mês de referência (formato YYYY-MM) para retorno na interface
 */
export const getLucratividadeMensal = async (
  dataInicio: string,
  dataFim: string,
  mesReferencia: string
): Promise<LucratividadeMensalData> => {
  // Define um valor padrão em caso de erro
  const defaultData: LucratividadeMensalData = {
      mesReferencia,
      totalReceitas: 0,
      totalDespesas: 0,
      lucroBruto: 0,
      margemLucroBruta: 0,
  };

  try {
    // 1. Buscar Total de Receitas do Mês
    const { data: receitasData, error: receitasError } = await supabase
      .from('receitas')
      .select('valor', { count: 'exact' }) // Usar count só para verificar se houve erro real
      .gte('data', dataInicio)
      .lte('data', dataFim);

    if (receitasError && !receitasData) { // Lança erro apenas se não houver dados E erro
        console.error('Erro ao buscar receitas para lucratividade:', receitasError);
        throw new Error('Erro ao buscar receitas do período.');
    }
    const totalReceitas = receitasData?.reduce((sum, item) => sum + item.valor, 0) ?? 0;

    // 2. Buscar Total de Despesas Pagas do Mês
    const { data: despesasData, error: despesasError } = await supabase
      .from('despesas')
      .select('valor', { count: 'exact' })
      .eq('pago', true)
      .gte('data', dataInicio)
      .lte('data', dataFim);

     if (despesasError && !despesasData) {
         console.error('Erro ao buscar despesas para lucratividade:', despesasError);
         throw new Error('Erro ao buscar despesas do período.');
     }
    const totalDespesas = despesasData?.reduce((sum, item) => sum + item.valor, 0) ?? 0;

    // 3. Calcular Lucro e Margem
    const lucroBruto = totalReceitas - totalDespesas;
    // Evita divisão por zero se não houver receitas
    const margemLucroBruta = totalReceitas > 0 ? (lucroBruto / totalReceitas) : 0;

    return {
      mesReferencia,
      totalReceitas,
      totalDespesas,
      lucroBruto,
      margemLucroBruta,
    };

  } catch (error) {
    console.error('Erro geral ao calcular lucratividade mensal:', error);
    return defaultData; // Retorna dados zerados em caso de erro
  }
};

/**
 * Busca dados de lucratividade para os últimos N meses para comparação.
 * @param numeroMeses Número de meses anteriores a incluir (ex: 6, 12)
 */
export const getComparativoMensal = async (
  numeroMeses: number = 6 // Padrão para 6 meses
): Promise<LucratividadeMensalData[]> => {
  const hoje = new Date();
  const resultados: LucratividadeMensalData[] = [];

  // Itera do mês mais antigo para o mais recente
  for (let i = numeroMeses - 1; i >= 0; i--) {
    const dataReferencia = subMonths(hoje, i);
    const dataInicio = format(startOfMonth(dataReferencia), 'yyyy-MM-dd');
    const dataFim = format(endOfMonth(dataReferencia), 'yyyy-MM-dd');
    const mesReferencia = format(dataReferencia, 'yyyy-MM');

    try {
      // Reutiliza a lógica ou chama getLucratividadeMensal (cuidado com performance se chamar N vezes)
      // Vamos replicar a lógica aqui para evitar N chamadas separadas que podem ser lentas.

      // 1. Receitas
      const { data: receitasData, error: receitasError } = await supabase
        .from('receitas')
        .select('valor')
        .gte('data', dataInicio)
        .lte('data', dataFim);
      if (receitasError) throw new Error(`Erro receitas ${mesReferencia}: ${receitasError.message}`);
      const totalReceitas = receitasData?.reduce((sum, item) => sum + item.valor, 0) ?? 0;

      // 2. Despesas
      const { data: despesasData, error: despesasError } = await supabase
        .from('despesas')
        .select('valor')
        .eq('pago', true)
        .gte('data', dataInicio)
        .lte('data', dataFim);
       if (despesasError) throw new Error(`Erro despesas ${mesReferencia}: ${despesasError.message}`);
      const totalDespesas = despesasData?.reduce((sum, item) => sum + item.valor, 0) ?? 0;

      // 3. Cálculos
      const lucroBruto = totalReceitas - totalDespesas;
      const margemLucroBruta = totalReceitas > 0 ? (lucroBruto / totalReceitas) : 0;

      resultados.push({
        mesReferencia, // Formato YYYY-MM
        totalReceitas,
        totalDespesas,
        lucroBruto,
        margemLucroBruta,
      });

    } catch (error) {
      console.error(`Erro ao processar dados para ${mesReferencia}:`, error);
      // Adiciona um registro zerado para o mês com erro para não quebrar o gráfico/tabela
      resultados.push({
        mesReferencia,
        totalReceitas: 0,
        totalDespesas: 0,
        lucroBruto: 0,
        margemLucroBruta: 0,
      });
    }
  }

  // Retorna o array com os dados mensais
  return resultados;
};

// TODO: Adicionar outras funções de relatório aqui (ex: getLucratividade, getAnaliseCategorias, etc.) 