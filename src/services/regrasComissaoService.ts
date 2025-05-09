import { supabase } from '@/integrations/supabase/client';
import { RegraComissao, RegraComissaoInput } from '@/types/comissao';
import { format } from 'date-fns';

/**
 * Interface que define a estrutura de uma Regra de Comissão.
 */
export interface RegraComissao {
  id: string;                          // UUID (PK)
  nome: string;                        // TEXT NOT NULL
  tipo_calculo: 'porcentagem' | 'valor_fixo' | 'por_item' | 'por_categoria'; // TEXT NOT NULL
  valor: number;                       // DECIMAL NOT NULL
  criterio_aplicacao: Record<string, any> | null; // JSONB
  periodo_vigencia_inicio: string | null; // DATE (formato ISO)
  periodo_vigencia_fim: string | null;    // DATE (formato ISO)
  ativa: boolean;                      // BOOLEAN NOT NULL DEFAULT TRUE
  created_at: string;                  // TIMESTAMP WITH TIME ZONE
  updated_at: string;                  // TIMESTAMP WITH TIME ZONE
}

/**
 * Tipo para criação de uma nova Regra de Comissão.
 */
export type CreateRegraComissaoData = Omit<RegraComissao, 'id' | 'created_at' | 'updated_at'>;

/**
 * Tipo para atualização de uma Regra de Comissão existente.
 */
export type UpdateRegraComissaoData = Partial<CreateRegraComissaoData>;

// Função auxiliar para formatar dados antes de enviar ao Supabase
const formatDataForSupabase = (data: Partial<RegraComissaoInput>) => {
  const formattedData = { ...data };
  // Formata datas (se existirem) para YYYY-MM-DD ou null
  if (data.periodo_vigencia_inicio) {
    formattedData.periodo_vigencia_inicio = format(new Date(data.periodo_vigencia_inicio), 'yyyy-MM-dd');
  } else {
    formattedData.periodo_vigencia_inicio = null;
  }
  if (data.periodo_vigencia_fim) {
    formattedData.periodo_vigencia_fim = format(new Date(data.periodo_vigencia_fim), 'yyyy-MM-dd');
  } else {
    formattedData.periodo_vigencia_fim = null;
  }
  return formattedData;
};

/**
 * @description Busca todas as regras de comissão.
 * @returns {Promise<RegraComissao[]>} Lista de regras de comissão.
 * @throws {Error} Se a busca no Supabase falhar.
 */
export const getRegrasComissao = async (): Promise<RegraComissao[]> => {
  const { data, error } = await supabase
    .from('regras_comissao')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao buscar regras de comissão:', error);
    throw new Error('Falha ao buscar regras de comissão.');
  }
  return data || [];
};

/**
 * @description Busca uma regra de comissão específica pelo ID.
 * @param {string} id - O ID da regra de comissão.
 * @returns {Promise<RegraComissao | null>} Dados da regra ou null se não encontrada.
 * @throws {Error} Se o ID for inválido ou a busca no Supabase falhar.
 */
export const getRegraComissaoById = async (id: string): Promise<RegraComissao | null> => {
  if (!id) return null;
  const { data, error } = await supabase
    .from('regras_comissao')
    .select('*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Erro ao buscar regra de comissão ${id}:`, error);
    if (error.code === 'PGRST116') {
      throw new Error('Regra de comissão não encontrada.');
    }
    throw new Error('Falha ao buscar a regra de comissão.');
  }
  return data;
};

/**
 * @description Cria uma nova regra de comissão.
 * @param {CreateRegraComissaoData} regraData - Dados da regra a ser criada.
 * @returns {Promise<RegraComissao>} A regra de comissão criada.
 * @throws {Error} Se os dados forem inválidos ou a inserção no Supabase falhar.
 */
export const createRegraComissao = async (inputData: RegraComissaoInput): Promise<RegraComissao> => {
  const formattedData = formatDataForSupabase(inputData);
  const { data, error } = await supabase
    .from('regras_comissao')
    .insert(formattedData)
    .select()
    .single();

  if (error || !data) {
    console.error('Erro ao criar regra de comissão:', error);
    throw new Error('Falha ao criar nova regra de comissão.');
  }
  return data;
};

/**
 * @description Atualiza uma regra de comissão existente.
 * @param {string} id - ID da regra de comissão a ser atualizada.
 * @param {UpdateRegraComissaoData} regraData - Dados a serem atualizados.
 * @returns {Promise<RegraComissao>} A regra de comissão atualizada.
 * @throws {Error} Se o ID for inválido ou a atualização no Supabase falhar.
 */
export const updateRegraComissao = async (id: string, inputData: Partial<RegraComissaoInput>): Promise<RegraComissao> => {
  const formattedData = formatDataForSupabase(inputData);
  const { data, error } = await supabase
    .from('regras_comissao')
    .update({
      ...formattedData,
      updated_at: new Date().toISOString() // Garante atualização do timestamp
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error(`Erro ao atualizar regra de comissão ${id}:`, error);
    if (error?.code === 'PGRST116') {
      throw new Error('Regra de comissão não encontrada para atualização.');
    }
    throw new Error('Falha ao atualizar regra de comissão.');
  }
  return data;
};

/**
 * @description Atualiza o status (ativo/inativo) de uma regra de comissão.
 * @param {string} id - ID da regra de comissão a ser atualizada.
 * @param {boolean} ativa - Novo status da regra de comissão.
 * @returns {Promise<RegraComissao>} A regra de comissão atualizada.
 * @throws {Error} Se o ID for inválido ou a atualização no Supabase falhar.
 */
export const setRegraComissaoStatus = async (id: string, ativa: boolean): Promise<RegraComissao> => {
  const { data, error } = await supabase
    .from('regras_comissao')
    .update({ ativa, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error(`Erro ao ${ativa ? 'ativar' : 'desativar'} regra ${id}:`, error);
    if (error?.code === 'PGRST116') {
      throw new Error('Regra de comissão não encontrada.');
    }
    throw new Error('Falha ao alterar status da regra de comissão.');
  }
  return data;
};

/**
 * @description Deleta uma regra de comissão pelo ID.
 * @param {string} id - ID da regra de comissão a ser deletada.
 * @returns {Promise<void>}
 * @throws {Error} Se o ID for inválido ou a deleção no Supabase falhar.
 */
export const deleteRegraComissao = async (id: string): Promise<void> => {
  if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error('ID de regra de comissão inválido.');
  }
  try {
    const { error } = await supabase
      .from('regras_comissao')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
         console.warn(`Tentativa de deletar regra de comissão com ID ${id} que não foi encontrada.`);
         return;
      }
      console.error(`Erro ao deletar regra de comissão ${id}:`, error);
      throw new Error('Não foi possível deletar a regra de comissão: ' + error.message);
    }
  } catch (err) {
    console.error(`Exceção ao deletar regra de comissão ${id}:`, err);
    throw err instanceof Error ? err : new Error('Erro desconhecido ao deletar a regra de comissão.');
  }
}; 