import { supabase } from '@/integrations/supabase/client';

/**
 * Interface que define a estrutura de um registro de Comissão.
 */
export interface Comissao {
  id: string;                          // UUID (PK)
  venda_id: string;                    // UUID (FK para vendas)
  vendedor_id: string;                 // UUID (FK para vendedores)
  regra_aplicada_id: string | null;    // UUID (FK para regras_comissao)
  valor_calculado: number;             // DECIMAL NOT NULL
  data_calculo: string;                // TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
  observacoes: string | null;          // TEXT
  created_at: string;                  // TIMESTAMP WITH TIME ZONE
  updated_at: string;                  // TIMESTAMP WITH TIME ZONE
}

/**
 * Tipo para criação de um novo registro de Comissão.
 * O campo `data_calculo` pode ser opcional na criação, pois o DB tem default.
 */
export type CreateComissaoData = Omit<Comissao, 'id' | 'created_at' | 'updated_at' | 'data_calculo' > & {
    data_calculo?: string; // Permite que seja opcional na entrada da função
};

/**
 * Tipo para atualização de um registro de Comissão existente.
 * Geralmente, comissões calculadas podem não ser diretamente atualizáveis, 
 * mas incluímos para consistência. A lógica de negócio pode restringir o uso.
 */
export type UpdateComissaoData = Partial<Omit<Comissao, 'id' | 'created_at' | 'updated_at' | 'data_calculo'>>;

const TABLE_NAME = 'comissoes';

/**
 * @description Busca todos os registros de comissão.
 * @param {object} [filters] - Filtros opcionais para a busca (ex: { vendedor_id: string, venda_id: string }).
 * @returns {Promise<Comissao[]>} Lista de registros de comissão.
 * @throws {Error} Se a busca no Supabase falhar.
 */
export const getComissoes = async (filters?: { vendedor_id?: string; venda_id?: string, mes?: number, ano?: number }): Promise<Comissao[]> => {
  try {
    let query = supabase.from(TABLE_NAME).select('*');

    if (filters?.vendedor_id) {
      query = query.eq('vendedor_id', filters.vendedor_id);
    }
    if (filters?.venda_id) {
      query = query.eq('venda_id', filters.venda_id);
    }
    if (filters?.ano && filters?.mes) {
        const startDate = new Date(filters.ano, filters.mes - 1, 1).toISOString();
        const endDate = new Date(filters.ano, filters.mes, 0, 23, 59, 59, 999).toISOString();
        query = query.gte('data_calculo', startDate).lte('data_calculo', endDate);
    }

    query = query.order('data_calculo', { ascending: false });
    
    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar comissões:', error);
      throw new Error('Não foi possível buscar os registros de comissão: ' + error.message);
    }
    return data as Comissao[];
  } catch (err) {
    console.error('Exceção ao buscar comissões:', err);
    throw err instanceof Error ? err : new Error('Erro desconhecido ao buscar registros de comissão.');
  }
};

/**
 * @description Busca um registro de comissão específico pelo ID.
 * @param {string} id - O ID do registro de comissão.
 * @returns {Promise<Comissao | null>} Dados do registro ou null se não encontrado.
 * @throws {Error} Se o ID for inválido ou a busca no Supabase falhar.
 */
export const getComissaoById = async (id: string): Promise<Comissao | null> => {
  if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error('ID de comissão inválido.');
  }
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error(`Erro ao buscar comissão ${id}:`, error);
      throw new Error('Não foi possível buscar o registro de comissão: ' + error.message);
    }
    return data as Comissao;
  } catch (err) {
    console.error(`Exceção ao buscar comissão ${id}:`, err);
    throw err instanceof Error ? err : new Error('Erro desconhecido ao buscar o registro de comissão.');
  }
};

/**
 * @description Cria um novo registro de comissão.
 * @param {CreateComissaoData} comissaoData - Dados do registro a ser criado.
 * @returns {Promise<Comissao>} O registro de comissão criado.
 * @throws {Error} Se os dados forem inválidos ou a inserção no Supabase falhar.
 */
export const createComissao = async (comissaoData: CreateComissaoData): Promise<Comissao> => {
  if (!comissaoData || !comissaoData.venda_id || !comissaoData.vendedor_id || typeof comissaoData.valor_calculado === 'undefined') {
    throw new Error('Dados insuficientes para criar comissão. Venda ID, Vendedor ID e Valor Calculado são obrigatórios.');
  }

  try {
    const payload = { ...comissaoData };
    if (!payload.data_calculo) {
        payload.data_calculo = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar comissão:', error);
      throw new Error('Não foi possível criar o registro de comissão: ' + error.message);
    }
    return data as Comissao;
  } catch (err) {
    console.error('Exceção ao criar comissão:', err);
    throw err instanceof Error ? err : new Error('Erro desconhecido ao criar o registro de comissão.');
  }
};

/**
 * @description Atualiza um registro de comissão existente.
 * A atualização direta de comissões pode ser limitada pela lógica de negócios.
 * @param {string} id - ID do registro de comissão a ser atualizado.
 * @param {UpdateComissaoData} comissaoData - Dados a serem atualizados.
 * @returns {Promise<Comissao>} O registro de comissão atualizado.
 * @throws {Error} Se o ID for inválido ou a atualização no Supabase falhar.
 */
export const updateComissao = async (id: string, comissaoData: UpdateComissaoData): Promise<Comissao> => {
  if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error('ID de comissão inválido.');
  }
  if (Object.keys(comissaoData).length === 0) {
    throw new Error('Nenhum dado fornecido para atualização.');
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        ...comissaoData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new Error(`Registro de comissão com ID ${id} não encontrado para atualização.`);
      }
      console.error(`Erro ao atualizar comissão ${id}:`, error);
      throw new Error('Não foi possível atualizar o registro de comissão: ' + error.message);
    }
    return data as Comissao;
  } catch (err) {
    console.error(`Exceção ao atualizar comissão ${id}:`, err);
    throw err instanceof Error ? err : new Error('Erro desconhecido ao atualizar o registro de comissão.');
  }
};

/**
 * @description Deleta um registro de comissão pelo ID.
 * @param {string} id - ID do registro de comissão a ser deletado.
 * @returns {Promise<void>}
 * @throws {Error} Se o ID for inválido ou a deleção no Supabase falhar.
 */
export const deleteComissao = async (id: string): Promise<void> => {
  if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error('ID de comissão inválido.');
  }
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
         console.warn(`Tentativa de deletar comissão com ID ${id} que não foi encontrada.`);
         return;
      }
      console.error(`Erro ao deletar comissão ${id}:`, error);
      throw new Error('Não foi possível deletar o registro de comissão: ' + error.message);
    }
  } catch (err) {
    console.error(`Exceção ao deletar comissão ${id}:`, err);
    throw err instanceof Error ? err : new Error('Erro desconhecido ao deletar o registro de comissão.');
  }
}; 