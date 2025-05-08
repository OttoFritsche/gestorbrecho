import { supabase } from '@/integrations/supabase/client';
import { addReceita } from './receitas';
import { Receita } from '@/types/financeiro';
import { addDays, addWeeks, addMonths, addYears, format, parseISO } from 'date-fns';
import { toast } from 'sonner';

/**
 * Gera a próxima receita com base em uma receita recorrente.
 * @param receitaRecorrente - A receita recorrente base
 * @param dataBase - A data de base para o cálculo (última ocorrência)
 */
export const gerarProximaReceita = async (receitaRecorrente: Receita, dataBase: string): Promise<Receita | null> => {
  // Se não for recorrente, retornar null
  if (!receitaRecorrente.recorrente || !receitaRecorrente.frequencia) {
    console.warn('Tentativa de gerar próxima receita para uma receita não recorrente ou sem frequência definida');
    return null;
  }

  // Calcular a próxima data com base na frequência
  const dataBaseObj = parseISO(dataBase);
  let proximaData: Date;

  switch(receitaRecorrente.frequencia) {
    case 'diaria':
      proximaData = addDays(dataBaseObj, 1);
      break;
    case 'semanal':
      proximaData = addWeeks(dataBaseObj, 1);
      break;
    case 'quinzenal':
      proximaData = addDays(dataBaseObj, 15);
      break;
    case 'mensal':
      proximaData = addMonths(dataBaseObj, 1);
      break;
    case 'bimestral':
      proximaData = addMonths(dataBaseObj, 2);
      break;
    case 'trimestral':
      proximaData = addMonths(dataBaseObj, 3);
      break;
    case 'semestral':
      proximaData = addMonths(dataBaseObj, 6);
      break;
    case 'anual':
      proximaData = addYears(dataBaseObj, 1);
      break;
    default:
      proximaData = addMonths(dataBaseObj, 1); // Padrão é mensal
  }

  // Criar a nova receita com os dados da recorrente
  const novaReceita = {
    descricao: receitaRecorrente.descricao,
    valor: receitaRecorrente.valor,
    data: format(proximaData, 'yyyy-MM-dd'),
    categoria_id: receitaRecorrente.categoria_id,
    tipo: receitaRecorrente.tipo,
    forma_pagamento_id: receitaRecorrente.forma_pagamento_id,
    recorrente: receitaRecorrente.recorrente,
    frequencia: receitaRecorrente.frequencia,
  };

  try {
    // Adicionar a nova receita
    return await addReceita(novaReceita);
  } catch (error) {
    console.error('Erro ao gerar próxima receita recorrente:', error);
    return null;
  }
};

/**
 * Verifica se uma receita recorrente precisa gerar nova instância
 * com base na última data e na frequência.
 * @param receita A receita recorrente a verificar
 * @param hoje A data atual para comparação (opcional, default: hoje)
 */
export const precisaGerarNovaReceita = async (
  receita: Receita,
  hoje: Date = new Date()
): Promise<boolean> => {
  if (!receita.recorrente || !receita.frequencia) {
    return false;
  }

  // Buscar a última instância desta receita recorrente
  const { data: ultimasReceitas, error } = await supabase
    .from('receitas')
    .select('*')
    .eq('descricao', receita.descricao)
    .eq('categoria_id', receita.categoria_id)
    .eq('tipo', receita.tipo)
    .eq('recorrente', true)
    .order('data', { ascending: false })
    .limit(1);

  if (error || !ultimasReceitas || ultimasReceitas.length === 0) {
    console.error('Erro ao buscar última instância da receita:', error);
    return false;
  }

  const ultimaReceita = ultimasReceitas[0];
  const ultimaData = parseISO(ultimaReceita.data);

  // Calcular quando seria a próxima data
  let proximaData: Date;

  switch (receita.frequencia) {
    case 'diaria':
      proximaData = addDays(ultimaData, 1);
      break;
    case 'semanal':
      proximaData = addWeeks(ultimaData, 1);
      break;
    case 'quinzenal':
      proximaData = addDays(ultimaData, 15);
      break;
    case 'mensal':
      proximaData = addMonths(ultimaData, 1);
      break;
    case 'bimestral':
      proximaData = addMonths(ultimaData, 2);
      break;
    case 'trimestral':
      proximaData = addMonths(ultimaData, 3);
      break;
    case 'semestral':
      proximaData = addMonths(ultimaData, 6);
      break;
    case 'anual':
      proximaData = addYears(ultimaData, 1);
      break;
    default:
      proximaData = addMonths(ultimaData, 1);
  }

  // Se hoje é igual ou posterior à próxima data prevista, precisamos gerar
  hoje.setHours(0, 0, 0, 0);
  proximaData.setHours(0, 0, 0, 0);
  
  return hoje >= proximaData;
};

/**
 * Verifica e gera todas as receitas recorrentes pendentes.
 * Esta função seria chamada por um job agendado ou na inicialização do app.
 */
export const processarReceitasRecorrentes = async (): Promise<void> => {
  const hoje = new Date();
  const { data: receitasRecorrentes, error } = await supabase
    .from('receitas')
    .select('*')
    .eq('recorrente', true)
    .order('data', { ascending: true });

  if (error) {
    console.error('Erro ao buscar receitas recorrentes:', error);
    toast.error('Não foi possível processar receitas recorrentes');
    return;
  }

  let receitasGeradas = 0;

  // Para cada receita recorrente, verificar se precisa gerar novas entradas
  for (const receita of receitasRecorrentes || []) {
    if (await precisaGerarNovaReceita(receita, hoje)) {
      // Buscar a última instância desta receita recorrente para usar como base
      const { data: ultimasReceitas, error: errorUltima } = await supabase
        .from('receitas')
        .select('*')
        .eq('descricao', receita.descricao)
        .eq('categoria_id', receita.categoria_id)
        .eq('tipo', receita.tipo)
        .eq('recorrente', true)
        .order('data', { ascending: false })
        .limit(1);

      if (errorUltima || !ultimasReceitas || ultimasReceitas.length === 0) {
        console.error('Erro ao buscar última instância da receita:', errorUltima);
        continue;
      }

      const ultimaReceita = ultimasReceitas[0];
      const novaReceita = await gerarProximaReceita(ultimaReceita, ultimaReceita.data);
      
      if (novaReceita) {
        receitasGeradas++;
      }
    }
  }

  if (receitasGeradas > 0) {
    toast.success(`${receitasGeradas} receitas recorrentes foram geradas automaticamente.`);
  }
};

/**
 * Função para verificar e gerar receitas recorrentes com base na origem.
 * @param receita A receita recorrente original
 */
export const iniciarRecorrencia = async (receita: Receita): Promise<void> => {
  if (!receita.recorrente || !receita.frequencia) {
    console.warn('Tentativa de iniciar recorrência para uma receita não recorrente');
    return;
  }

  // A receita já foi criada, então não precisamos fazer nada agora
  // As próximas instâncias serão geradas automaticamente pelo processamento
  toast.success('Receita recorrente configurada. Novas instâncias serão geradas automaticamente.');
}; 