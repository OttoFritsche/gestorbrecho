import { supabase } from '@/integrations/supabase/client';
import { Receita, MovimentoCaixa } from '@/types/financeiro'; // Importa o tipo Receita e MovimentoCaixa
import { toast } from 'sonner'; // Para avisos
import { TIMEZONE } from '@/lib/constants';
import { format } from 'date-fns';

/**
 * Formata a data local atual para formato YYYY-MM-DD considerando o fuso horário local.
 * Esta função garante que a data seja sempre a do usuário, não UTC.
 */
const obterDataLocalFormatada = (): string => {
  const hoje = new Date();
  const dataLocalFormatada = format(hoje, 'yyyy-MM-dd');
  console.log(`Data local formatada: ${dataLocalFormatada}`);
  return dataLocalFormatada;
};

/**
 * Busca todas as receitas do usuário logado.
 * TODO: Adicionar filtros e paginação.
 */
export const getReceitas = async (): Promise<Receita[]> => {
  // Busca receitas associadas ao usuário logado
  const { data, error } = await supabase
    .from('receitas') // Nome da tabela
    .select('*') // Seleciona todas as colunas
    .order('data', { ascending: false }); // Ordena pela data

  // Verifica erros
  if (error) {
    console.error('Erro ao buscar receitas:', error);
    throw new Error('Não foi possível buscar as receitas.');
  }
  // Retorna os dados
  return data || [];
};

/**
 * Busca uma receita específica pelo ID.
 * @param id - ID da receita a buscar.
 */
export const getReceitaById = async (id: string): Promise<Receita | null> => {
  // Busca a receita pelo ID
  const { data, error } = await supabase
    .from('receitas')
    .select('*')
    .eq('id', id)
    .single();

  // Verifica erros
  if (error) {
    console.error('Erro ao buscar receita por ID:', error);
    throw new Error('Não foi possível buscar a receita solicitada.');
  }
  
  // Retorna os dados ou null se não encontrado
  return data;
};

/**
 * Adiciona uma nova receita e, se for do tipo 'outro', um movimento de caixa.
 * @param receitaData - Dados da nova receita.
 */
export const addReceita = async (receitaData: Omit<Receita, 'id' | 'created_at' | 'user_id'>): Promise<Receita> => {
  // 1. Insere a nova receita
  const { data: novaReceita, error: insertError } = await supabase
    .from('receitas')
    .insert([{ ...receitaData }])
    .select()
    .single();

  if (insertError || !novaReceita) {
    console.error('Erro ao adicionar receita:', insertError);
    throw new Error('Não foi possível adicionar a receita.');
  }

  // 2. Se a receita for do tipo 'outro', inserir movimento de caixa (entrada)
  // Receitas do tipo 'venda' devem ter seu movimento gerado pela própria venda.
  if (novaReceita.tipo === 'outro') {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Obter a data atual em formato YYYY-MM-DD respeitando o fuso horário local
      const dataMovimento = obterDataLocalFormatada();
      console.log(`Criando movimento de caixa na data LOCAL: ${dataMovimento}`);
      
      const movimentoData: Omit<MovimentoCaixa, 'id' | 'created_at'> = {
        user_id: user.id,
        data: dataMovimento, // Data LOCAL formatada como YYYY-MM-DD
        tipo: 'entrada', // Receita é uma entrada
        valor: novaReceita.valor,
        descricao: `Receita: ${novaReceita.descricao}`,
        receita_id: novaReceita.id, // Link para a receita
        despesa_id: null,
        venda_id: null,
      };

      const { error: movimentoError } = await supabase
        .from('movimentos_caixa')
        .insert([movimentoData]);

      if (movimentoError) {
        console.error('Erro ao adicionar movimento de caixa para receita:', movimentoError);
        toast.warning('Receita adicionada, mas erro ao registrar movimento no caixa.');
      }
    }
  }

  return novaReceita;
};

/**
 * Atualiza uma receita e ajusta o movimento de caixa se o tipo/valor mudar.
 * @param id - ID da receita a ser atualizada.
 * @param updates - Campos a serem atualizados.
 */
export const updateReceita = async (id: string, updates: Partial<Omit<Receita, 'id' | 'created_at' | 'user_id'>>): Promise<Receita> => {
  // 1. Obter estado atual da receita
  const { data: receitaAtual, error: fetchError } = await supabase
    .from('receitas')
    .select('tipo, valor, descricao, user_id')
    .eq('id', id)
    .single();

  if (fetchError || !receitaAtual) {
    console.error("Erro ao buscar receita antes de atualizar: ", fetchError);
    throw new Error("Não foi possível encontrar a receita para atualizar.");
  }

  // 2. Atualizar a receita
  const { data: receitaAtualizada, error: updateError } = await supabase
    .from('receitas')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateError || !receitaAtualizada) {
    console.error('Erro ao atualizar receita:', updateError);
    throw new Error('Não foi possível atualizar a receita.');
  }

  // 3. Ajustar movimento de caixa se necessário (apenas para tipo 'outro')
  const tipoMudou = updates.tipo && receitaAtual.tipo !== updates.tipo;
  const valorMudou = updates.valor && receitaAtual.valor !== updates.valor;

  const eraOutro = receitaAtual.tipo === 'outro';
  const ehOutro = receitaAtualizada.tipo === 'outro';

  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    if (eraOutro && !ehOutro) { // Era 'outro' e deixou de ser -> Remover movimento
      console.log(`Receita ${id} deixou de ser tipo 'outro'. Tentando remover movimento.`);
      const { error: deleteMovimentoError } = await supabase.from('movimentos_caixa').delete().eq('receita_id', id);
      if (deleteMovimentoError) {
        console.error('Erro ao DELETAR movimento ao mudar tipo de receita:', deleteMovimentoError);
        toast.warning('Receita atualizada, mas erro ao remover movimento do caixa.');
      }
    } else if (!eraOutro && ehOutro) { // Não era 'outro' e passou a ser -> Adicionar movimento
      console.log(`Receita ${id} passou a ser tipo 'outro'. Tentando adicionar movimento.`);
      
      // Obter a data atual em formato YYYY-MM-DD respeitando o fuso horário local
      const dataMovimento = obterDataLocalFormatada();
      console.log(`Criando movimento de caixa na data LOCAL: ${dataMovimento}`);
      
      const movimentoData: Omit<MovimentoCaixa, 'id' | 'created_at'> = { 
        user_id: user.id, 
        data: dataMovimento, // Data LOCAL formatada como YYYY-MM-DD
        tipo: 'entrada', 
        valor: receitaAtualizada.valor, 
        descricao: `Receita: ${receitaAtualizada.descricao}`, 
        receita_id: receitaAtualizada.id, 
        despesa_id: null, 
        venda_id: null 
      };
      
      const { error: addMovimentoError } = await supabase.from('movimentos_caixa').insert([movimentoData]);
      if (addMovimentoError) {
        console.error('Erro ao ADICIONAR movimento ao mudar tipo de receita:', addMovimentoError);
        toast.warning('Receita atualizada, mas erro ao adicionar movimento no caixa.');
      }
    } else if (ehOutro && valorMudou) { // Continua 'outro' mas valor mudou -> Atualizar movimento? Ou deletar/criar?
      // TODO: Idealmente atualizar o movimento existente.
      // Por simplicidade, deletar e recriar (pode gerar 2 triggers, atenção!)
      // Ou apenas avisar por enquanto.
      console.warn(`Valor da receita tipo 'outro' ${id} mudou. Movimento não atualizado automaticamente.`);
      toast.info('Valor da receita alterado. O registro no caixa pode precisar de ajuste manual.');
    }
  }

  return receitaAtualizada;
};

/**
 * Exclui uma receita.
 * @param id - ID da receita a ser excluída.
 */
export const deleteReceita = async (id: string): Promise<void> => {
  // Exclui a receita com o ID correspondente
  const { error } = await supabase
    .from('receitas')
    .delete() // Operação de exclusão
    .eq('id', id); // Onde o ID corresponde

  // Verifica erros
  if (error) {
    console.error('Erro ao excluir receita:', error);
    throw new Error('Não foi possível excluir a receita.');
  }
};

/**
 * Busca categorias de receita.
 * TODO: Mover para um serviço de categorias se necessário.
 */
export const getCategoriasReceita = async (): Promise<{ id: string; nome: string }[]> => {
  // Busca categorias do tipo 'receita'
  const { data, error } = await supabase
    .from('categorias') // Tabela de categorias
    .select('id, nome') // Seleciona ID e nome
    .eq('tipo', 'receita') // Filtra por tipo 'receita'
    .order('nome'); // Ordena pelo nome

  // Verifica erros
  if (error) {
    console.error('Erro ao buscar categorias de receita:', error);
    throw new Error('Não foi possível buscar as categorias de receita.');
  }
  // Retorna os dados
  return data || [];
};

/**
 * Busca formas de pagamento.
 * TODO: Mover para um serviço compartilhado ou de vendas.
 */
export const getFormasPagamento = async (): Promise<{ id: string; nome: string }[]> => {
  // Busca todas as formas de pagamento
  const { data, error } = await supabase
    .from('formas_pagamento') // Tabela de formas de pagamento
    .select('id, nome') // Seleciona ID e nome
    .order('nome'); // Ordena pelo nome

  // Verifica erros
  if (error) {
    console.error('Erro ao buscar formas de pagamento:', error);
    throw new Error('Não foi possível buscar as formas de pagamento.');
  }
  // Retorna os dados
  return data || [];
}; 