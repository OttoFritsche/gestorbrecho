import { supabase } from \'@/integrations/supabase/client\';

/**
 * Interface que define a estrutura de uma Regra de Comissão.
 */
export interface RegraComissao {
  id: string;                          // UUID (PK)
  nome: string;                        // TEXT NOT NULL
  tipo_calculo: \'porcentagem\' | \'valor_fixo\' | \'por_item\' | \'por_categoria\'; // TEXT NOT NULL
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
export type CreateRegraComissaoData = Omit<RegraComissao, \'id\' | \'created_at\' | \'updated_at\'>;

/**
 * Tipo para atualização de uma Regra de Comissão existente.
 */
export type UpdateRegraComissaoData = Partial<CreateRegraComissaoData>;

const TABLE_NAME = \'regras_comissao\';

/**
 * @description Busca todas as regras de comissão.
 * @returns {Promise<RegraComissao[]>} Lista de regras de comissão.
 * @throws {Error} Se a busca no Supabase falhar.
 */
export const getRegrasComissao = async (): Promise<RegraComissao[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(\'*\')
      .order(\'nome\');

    if (error) {
      console.error(\'Erro ao buscar regras de comissão:\', error);
      throw new Error(\'Não foi possível buscar as regras de comissão: \' + error.message);
    }
    return data as RegraComissao[];
  } catch (err) {
    console.error(\'Exceção ao buscar regras de comissão:\', err);
    throw err instanceof Error ? err : new Error(\'Erro desconhecido ao buscar regras de comissão.\');
  }
};

/**
 * @description Busca uma regra de comissão específica pelo ID.
 * @param {string} id - O ID da regra de comissão.
 * @returns {Promise<RegraComissao | null>} Dados da regra ou null se não encontrada.
 * @throws {Error} Se o ID for inválido ou a busca no Supabase falhar.
 */
export const getRegraComissaoById = async (id: string): Promise<RegraComissao | null> => {
  if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error(\'ID de regra de comissão inválido.\');
  }
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(\'*\')
      .eq(\'id\', id)
      .single();

    if (error) {
      if (error.code === \'PGRST116\') {
        return null;
      }
      console.error(\`Erro ao buscar regra de comissão ${id}:\`, error);
      throw new Error(\'Não foi possível buscar a regra de comissão: \' + error.message);
    }
    return data as RegraComissao;
  } catch (err) {
    console.error(\`Exceção ao buscar regra de comissão ${id}:\`, err);
    throw err instanceof Error ? err : new Error(\'Erro desconhecido ao buscar a regra de comissão.\');
  }
};

/**
 * @description Cria uma nova regra de comissão.
 * @param {CreateRegraComissaoData} regraData - Dados da regra a ser criada.
 * @returns {Promise<RegraComissao>} A regra de comissão criada.
 * @throws {Error} Se os dados forem inválidos ou a inserção no Supabase falhar.
 */
export const createRegraComissao = async (regraData: CreateRegraComissaoData): Promise<RegraComissao> => {
  if (!regraData || !regraData.nome || !regraData.tipo_calculo || typeof regraData.valor === \'undefined\') {
    throw new Error(\'Dados insuficientes para criar regra de comissão. Nome, tipo de cálculo e valor são obrigatórios.\');
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([regraData])
      .select()
      .single();

    if (error) {
      console.error(\'Erro ao criar regra de comissão:\', error);
      throw new Error(\'Não foi possível criar a regra de comissão: \' + error.message);
    }
    return data as RegraComissao;
  } catch (err) {
    console.error(\'Exceção ao criar regra de comissão:\', err);
    throw err instanceof Error ? err : new Error(\'Erro desconhecido ao criar a regra de comissão.\');
  }
};

/**
 * @description Atualiza uma regra de comissão existente.
 * @param {string} id - ID da regra de comissão a ser atualizada.
 * @param {UpdateRegraComissaoData} regraData - Dados a serem atualizados.
 * @returns {Promise<RegraComissao>} A regra de comissão atualizada.
 * @throws {Error} Se o ID for inválido ou a atualização no Supabase falhar.
 */
export const updateRegraComissao = async (id: string, regraData: UpdateRegraComissaoData): Promise<RegraComissao> => {
  if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error(\'ID de regra de comissão inválido.\');
  }
  if (Object.keys(regraData).length === 0) {
    throw new Error(\'Nenhum dado fornecido para atualização.\');
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        ...regraData,
        updated_at: new Date().toISOString(),
      })
      .eq(\'id\', id)
      .select()
      .single();

    if (error) {
      if (error.code === \'PGRST116\') {
        throw new Error(\`Regra de comissão com ID ${id} não encontrada para atualização.\`);
      }
      console.error(\`Erro ao atualizar regra de comissão ${id}:\`, error);
      throw new Error(\'Não foi possível atualizar a regra de comissão: \' + error.message);
    }
    return data as RegraComissao;
  } catch (err) {
    console.error(\`Exceção ao atualizar regra de comissão ${id}:\`, err);
    throw err instanceof Error ? err : new Error(\'Erro desconhecido ao atualizar a regra de comissão.\');
  }
};

/**
 * @description Deleta uma regra de comissão pelo ID.
 * @param {string} id - ID da regra de comissão a ser deletada.
 * @returns {Promise<void>}
 * @throws {Error} Se o ID for inválido ou a deleção no Supabase falhar.
 */
export const deleteRegraComissao = async (id: string): Promise<void> => {
  if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error(\'ID de regra de comissão inválido.\');
  }
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq(\'id\', id);

    if (error) {
      if (error.code === \'PGRST116\') {
         console.warn(\`Tentativa de deletar regra de comissão com ID ${id} que não foi encontrada.\`);
         return;
      }
      console.error(\`Erro ao deletar regra de comissão ${id}:\`, error);
      throw new Error(\'Não foi possível deletar a regra de comissão: \' + error.message);
    }
  } catch (err) {
    console.error(\`Exceção ao deletar regra de comissão ${id}:\`, err);
    throw err instanceof Error ? err : new Error(\'Erro desconhecido ao deletar a regra de comissão.\');
  }
}; 