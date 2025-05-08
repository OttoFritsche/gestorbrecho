import { supabase } from '@/integrations/supabase/client';
import { FormaPagamento } from '@/types/financeiro';

/**
 * Busca todas as formas de pagamento cadastradas pelo usuário logado.
 */
export const getFormasPagamento = async (): Promise<FormaPagamento[]> => {
  // Busca formas de pagamento associadas ao usuário logado
  const { data, error } = await supabase
    .from('formas_pagamento') // Nome da tabela no Supabase
    .select('*') // Seleciona todas as colunas
    .order('nome', { ascending: true }); // Ordena pelo nome

  // Verifica se ocorreu algum erro durante a consulta
  if (error) {
    // Loga o erro no console para depuração
    console.error('Erro ao buscar formas de pagamento:', error);
    // Lança o erro para ser tratado onde a função for chamada
    throw new Error('Não foi possível buscar as formas de pagamento.');
  }

  // Retorna os dados obtidos ou um array vazio se não houver dados
  return data || [];
};

// TODO: Adicionar funções para adicionar, atualizar e deletar formas de pagamento se necessário.

/**
 * Adiciona uma nova forma de pagamento.
 * @param nome O nome da nova forma de pagamento.
 * @returns A forma de pagamento criada.
 */
export const addFormaPagamento = async (nome: string): Promise<FormaPagamento> => {
  // Insere a nova forma de pagamento na tabela
  const { data, error } = await supabase
    .from('formas_pagamento')
    .insert([{ nome }]) // Insere o nome fornecido
    .select() // Retorna os dados inseridos
    .single(); // Espera um único resultado

  // Verifica erros na inserção
  if (error) {
    // Loga o erro
    console.error('Erro ao adicionar forma de pagamento:', error);
    // Lança um erro específico
    throw new Error('Não foi possível adicionar a forma de pagamento.');
  }

  // Retorna a forma de pagamento criada
  return data;
};

/**
 * Atualiza uma forma de pagamento existente.
 * @param id O ID da forma de pagamento a ser atualizada.
 * @param nome O novo nome da forma de pagamento.
 * @returns A forma de pagamento atualizada.
 */
export const updateFormaPagamento = async (id: string, nome: string): Promise<FormaPagamento> => {
  // Atualiza a forma de pagamento com o ID correspondente
  const { data, error } = await supabase
    .from('formas_pagamento')
    .update({ nome }) // Atualiza o nome
    .eq('id', id) // Onde o ID corresponde
    .select() // Retorna os dados atualizados
    .single(); // Espera um único resultado

  // Verifica erros na atualização
  if (error) {
    // Loga o erro
    console.error('Erro ao atualizar forma de pagamento:', error);
    // Lança um erro específico
    throw new Error('Não foi possível atualizar a forma de pagamento.');
  }

  // Retorna a forma de pagamento atualizada
  return data;
};

/**
 * Exclui uma forma de pagamento.
 * @param id O ID da forma de pagamento a ser excluída.
 */
export const deleteFormaPagamento = async (id: string): Promise<void> => {
  // Exclui a forma de pagamento com o ID correspondente
  const { error } = await supabase
    .from('formas_pagamento')
    .delete()
    .eq('id', id); // Onde o ID corresponde

  // Verifica erros na exclusão
  if (error) {
    // Loga o erro
    console.error('Erro ao excluir forma de pagamento:', error);
    // Lança um erro específico
    // Considerar verificar se o erro é por FK constraint (forma de pagamento em uso)
    throw new Error('Não foi possível excluir a forma de pagamento. Verifique se ela não está sendo utilizada.');
  }
}; 