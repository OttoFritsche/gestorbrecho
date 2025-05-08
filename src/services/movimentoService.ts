import { supabase } from '@/integrations/supabase/client';
import { MovimentoCaixa } from '@/types/financeiro';
import { format, parseISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/constants';

/**
 * Cria um novo movimento de caixa no fuso horário do Brasil.
 * Esta função garante que as datas sejam salvas com o fuso horário correto.
 */
export const criarMovimentoCaixa = async (movimento: Omit<MovimentoCaixa, 'id' | 'created_at'>) => {
  try {
    // Garantir que a data está no formato YYYY-MM-DD do Brasil
    let dataFormatada = movimento.data;
    
    if (dataFormatada.includes('T')) {
      // Se é uma string ISO completa, converte para o fuso do Brasil primeiro
      const dataObj = parseISO(dataFormatada);
      const dataBrasil = utcToZonedTime(dataObj, TIMEZONE);
      dataFormatada = format(dataBrasil, 'yyyy-MM-dd');
    }
    
    const movimentoComDataBrasil = {
      ...movimento,
      data: dataFormatada
    };
    
    console.log(`[criarMovimentoCaixa] Criando movimento com data BR: ${dataFormatada}`);
    
    const { data, error } = await supabase
      .from('movimentos_caixa')
      .insert(movimentoComDataBrasil)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[criarMovimentoCaixa] Erro:', error);
    throw error;
  }
}

/**
 * Busca movimentos de caixa por período no fuso horário do Brasil.
 */
export const buscarMovimentosPorPeriodo = async (dataInicio: string, dataFim: string) => {
  try {
    // Converter as datas para o formato YYYY-MM-DD
    let dataInicioFormatada = dataInicio;
    let dataFimFormatada = dataFim;
    
    if (dataInicio.includes('T')) {
      const dataInicioObj = parseISO(dataInicio);
      const dataInicioBrasil = utcToZonedTime(dataInicioObj, TIMEZONE);
      dataInicioFormatada = format(dataInicioBrasil, 'yyyy-MM-dd');
    }
    
    if (dataFim.includes('T')) {
      const dataFimObj = parseISO(dataFim);
      const dataFimBrasil = utcToZonedTime(dataFimObj, TIMEZONE);
      dataFimFormatada = format(dataFimBrasil, 'yyyy-MM-dd');
    }
    
    console.log(`[buscarMovimentosPorPeriodo] Buscando movimentos no período BR: ${dataInicioFormatada} a ${dataFimFormatada}`);
    
    const { data, error } = await supabase
      .from('movimentos_caixa')
      .select('*')
      .gte('data', dataInicioFormatada)
      .lte('data', dataFimFormatada)
      .order('data', { ascending: true });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[buscarMovimentosPorPeriodo] Erro:', error);
    throw error;
  }
}

/**
 * Utilitário para converter uma data UTC para o formato YYYY-MM-DD no fuso do Brasil.
 */
export const converterParaDataBrasil = (dataUTC: string | Date): string => {
  const dataObj = typeof dataUTC === 'string' ? parseISO(dataUTC) : dataUTC;
  const dataBrasil = utcToZonedTime(dataObj, TIMEZONE);
  return format(dataBrasil, 'yyyy-MM-dd');
}

/**
 * Utilitário para converter uma data do Brasil para UTC.
 */
export const converterParaUTC = (dataBrasil: string): string => {
  // Adiciona meio-dia para evitar problemas de fuso
  const dataHora = dataBrasil.includes('T') ? dataBrasil : `${dataBrasil}T12:00:00`;
  const dataObj = parseISO(dataHora);
  return dataObj.toISOString();
} 