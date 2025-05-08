// Importa o cliente Supabase (assumindo que já existe)
import supabase from '@/integrations/supabase';
// Importa o tipo Venda (assumindo que já existe)
import { Venda } from '@/types/vendas'; // Ajuste o caminho se necessário

/**
 * Exclui uma venda e suas receitas associadas chamando uma função de banco de dados.
 * @param {string} id - O ID da venda a ser excluída.
 * @returns {Promise<void>} - Uma promessa que resolve quando a exclusão é concluída.
 * @throws {Error} - Lança um erro se a chamada RPC falhar.
 */
export const deleteVenda = async (id: string): Promise<void> => {
  // Chama a função PostgreSQL 'deletar_venda_e_receitas_associadas' via RPC
  // Passa o ID da venda como parâmetro nomeado 'p_venda_id'
  const { error } = await supabase.rpc('deletar_venda_e_receitas_associadas', {
    p_venda_id: id,
  });

  // Verifica se ocorreu um erro durante a execução da função RPC
  if (error) {
    // Loga o erro no console para depuração
    console.error('Erro ao chamar RPC deleteVenda:', error);
    // Lança um erro informando a falha na execução da função do banco de dados
    throw new Error(`Falha ao excluir venda e receitas associadas: ${error.message}`);
  }

  // Se chegou aqui, a função RPC foi executada com sucesso.
}; 