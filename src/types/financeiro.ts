import { Tables } from "@/integrations/supabase/types";


// Define a interface para os dados do Balanço Patrimonial
export interface BalancoPatrimonialData {
  // Data de referência para o cálculo do balanço
  dataReferencia: string;
  // Total de ativos (soma das receitas até a data)
  totalAtivos: number;
  // Total de passivos (soma das despesas até a data)
  totalPassivos: number;
  // Patrimônio líquido (ativos - passivos)
  patrimonioLiquido: number;
  // Detalhes opcionais para gráficos ou análises
  detalhes?: {
    ativosPorTipo?: { tipo: string; valor: number }[];
    passivosPorCategoria?: { categoria_id: string; categoria_nome?: string; valor: number }[];
  };
}

// Define a interface para os dados do Relatório de Resumo Financeiro
export interface ResumoFinanceiroData {
  // Data de início do período do resumo
  dataInicio: string;
  // Data de fim do período do resumo
  dataFim: string;
  // Total de receitas registradas no período
  totalReceitas: number;
  // Total de despesas pagas no período
  totalDespesas: number;
  // Saldo atual (último saldo registrado no fluxo de caixa)
  saldoAtual: number;
  // Lista das últimas receitas registradas
  ultimasReceitas: Receita[];
  // Lista das últimas despesas pagas
  ultimasDespesas: Despesa[];
}

// Estrutura dos dados para o novo Resumo do Mês
export interface ResumoMesData {
    totalVendido: number;
    custoItensVendidos: number;
    sobrouDasVendas: number; // Lucro Bruto das Vendas
    gastosGerais: number;    // Outras Despesas Operacionais
    resultadoFinal: number;  // Lucro Líquido Aproximado
}

// Estrutura para o novo histórico de saldo
export interface HistoricoSaldoItem {
  data: string; // Formato YYYY-MM-DD
  saldo: number;
}

// Estrutura para um item na lista de últimas transações
export interface UltimaTransacao {
  id: string;
  tipo: 'receita' | 'despesa';
  descricao: string;
  valor: number;
  data: string; // Manter formato ISO ou YYYY-MM-DD
  categoria_nome?: string | null; // Opcional: nome da categoria
}

// Interface principal para os dados do Dashboard Financeiro
export interface DashboardFinanceiroData {
  resumoMes: ResumoMesData;
  saldoAtualCaixa: number;
  contagemMetasAndamento: number;
  graficoReceitaDespesa: GraficoData[];
  historicoSaldoCaixa: HistoricoSaldoItem[];
  ultimasTransacoes: UltimaTransacao[];
}

// Define a interface para os dados do gráfico
export interface GraficoData {
  mes: string;        // Ex: "Mai/25"
  receitas: number;   // Receita bruta do mês
  despesas: number;   // Despesas gerais do mês
  // Poderíamos adicionar lucroBruto aqui se quiséssemos mostrar no gráfico
}

// Define a interface para as despesas agrupadas por categoria
export interface DespesaCategoriaAgrupada {
  // ID da categoria (pode ser null se houver despesas sem categoria)
  categoria_id: string | null;
  // Nome da categoria (buscado via JOIN)
  categoria_nome: string | null; // Permitir nulo caso a categoria não exista mais ou não tenha nome
  // Soma total das despesas para esta categoria no período
  total_despesa: number;
  // Quantidade de despesas nesta categoria no período
  quantidade_despesas: number;
  // Percentual do total de despesas do período (calculado no frontend)
  percentual_total?: number;
}

// Define a interface para os dados agrupados de receitas por categoria
export interface ReceitaCategoriaAgrupada {
  // ID da categoria (pode ser null se houver receitas sem categoria)
  categoria_id: string | null;
  // Nome da categoria (buscado via JOIN)
  categoria_nome: string | null; // Permitir nulo
  // Soma total das receitas para esta categoria no período
  total_receita: number;
  // Quantidade de receitas nesta categoria no período
  quantidade_receitas: number;
  // Percentual do total de receitas do período (calculado no frontend)
  percentual_total?: number;
}

// Define a interface para os dados do relatório de Lucratividade Mensal
export interface LucratividadeMensalData {
  // Mês de referência (formato YYYY-MM)
  mesReferencia: string;
  // Total de receitas registradas no mês
  totalReceitas: number;
  // Total de despesas pagas no mês
  totalDespesas: number;
  // Lucro bruto calculado (Receitas - Despesas)
  lucroBruto: number;
  // Margem de lucro bruta calculada (%)
  margemLucroBruta: number; // (Lucro Bruto / Total Receitas) * 100
}

// Tipo base para Categoria (usado em Despesa e Receita)
export type Categoria = Tables<'categorias'>;

// Tipo base para Forma de Pagamento
export type FormaPagamento = Tables<'formas_pagamento'>;

// Tipo para Despesa (baseado na tabela 'despesas')
export interface Despesa extends Tables<'despesas'> {
  // Campos adicionais para UI
  categoria_nome?: string;
  forma_pagamento_nome?: string | null;
  // Campos para relacionamentos (objetos completos)
  categorias?: { nome: string } | null;
  formas_pagamento?: { nome: string } | null;
}

// Tipo para Receita (baseado na tabela 'receitas')
export interface Receita extends Omit<Tables<'receitas'>, 'tipo'> { 
  // Sobrescreve o tipo 'text' padrão do Supabase com um tipo mais específico
  tipo: 'venda' | 'servicos' | 'alugueis' | 'comissao' | 'doacao' | 'outro';
  // Campos para recorrência
  recorrente: boolean;
  frequencia: string | null; // 'diaria', 'semanal', 'quinzenal', 'mensal', etc.
}

// Tipo para Fluxo de Caixa (baseado na tabela 'fluxo_caixa')
export type FluxoCaixa = Tables<'fluxo_caixa'>;

// Tipo para Movimento de Caixa (baseado na tabela 'movimentos_caixa')
export interface MovimentoCaixa {
  id: string;
  fluxo_caixa_id: string;
  tipo: 'entrada' | 'saida';
  descricao: string;
  valor: number;
  data: string; // Formato ISO YYYY-MM-DDT00:00:00Z
  forma_pagamento_id?: string | null; // Permitir null
  user_id: string;
  created_at: string;
  observacoes?: string;
  // Campos de ID relacionados
  categoria_id?: string | null;
  receita_id?: string | null; // Permitir null
  despesa_id?: string | null;
  venda_id?: string | null;
  pagamento_prazo_id?: string | null;
  
  // Campos opcionais para join (enriquecidos no serviço)
  categoria?: Categoria | null; 
  forma_pagamento_nome?: string | null; 
  venda_detalhes?: {
    cliente_id: string | null;
    valor_total: number | null;
    clientes: { nome: string | null } | null;
  } | null; 
  venda_itens_detalhes?: {
    quantidade: number;
    produtos: { nome: string | null } | null;
  }[] | null; 
}

// Tipo para Meta (baseado na tabela 'metas')
export type Meta = Tables<'metas'>;

// Tipo para Progresso de Meta (baseado na tabela 'progresso_meta')
export type ProgressoMeta = Tables<'progresso_meta'>;

// Tipo para Alerta (baseado na tabela 'alertas')
export type Alerta = Tables<'alertas'>;

// Tipo para Configuração de Alerta (baseado na tabela 'configuracoes_alerta')
export type ConfiguracaoAlerta = Tables<'configuracoes_alerta'>;
