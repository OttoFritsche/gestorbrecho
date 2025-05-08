import { supabase } from \'@/integrations/supabase/client\';

/**
 * Interface que define a estrutura de uma Meta de Venda conforme tabela no banco de dados.
 */
export interface MetaVenda {
  id: string;                     // UUID (PK)
  vendedor_id: string;            // UUID (FK para vendedores)
  periodo_inicio: string;         // DATE (formato ISO, ex: 'YYYY-MM-DD')
  periodo_fim: string;            // DATE (formato ISO, ex: 'YYYY-MM-DD')
  meta_valor: number | null;      // DECIMAL
  meta_quantidade: number | null; // INTEGER
  created_at: string;             // TIMESTAMP WITH TIME ZONE (formato ISO)
  updated_at: string;             // TIMESTAMP WITH TIME ZONE (formato ISO)
}

/**
 * Tipo para criação de uma nova Meta de Venda.
 * Omitimos campos gerenciados pelo banco de dados.
 */
export type CreateMetaVendaData = Omit<MetaVenda, \'id\' | \'created_at\' | \'updated_at\'>;

/**
 * Tipo para atualização de uma Meta de Venda existente.
 * Todos os campos (exceto os gerenciados pelo banco) são opcionais.
 */
export type UpdateMetaVendaData = Partial<CreateMetaVendaData>;

const TABLE_NAME = \'metas_venda\';

/**
 * @description Busca todas as metas de venda.
 * @returns {Promise<MetaVenda[]>} Lista de metas de venda.
 * @throws {Error} Se a busca no Supabase falhar.
 */
export const getMetasVenda = async (): Promise<MetaVenda[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(\'*\')
      .order(\'periodo_inicio\', { ascending: false });

    if (error) {
      console.error(\'Erro ao buscar metas de venda:\', error);
      throw new Error(\'Não foi possível buscar as metas de venda: \' + error.message);
    }
    return data as MetaVenda[];
  } catch (err) {
    console.error(\'Exceção ao buscar metas de venda:\', err);
    throw err instanceof Error ? err : new Error(\'Erro desconhecido ao buscar metas de venda.\');
  }
};

/**
 * @description Busca uma meta de venda específica pelo ID.
 * @param {string} id - O ID da meta de venda.
 * @returns {Promise<MetaVenda | null>} Dados da meta de venda ou null se não encontrada.
 * @throws {Error} Se o ID for inválido ou a busca no Supabase falhar (exceto \'não encontrado\').
 */
export const getMetaVendaById = async (id: string): Promise<MetaVenda | null> => {
  if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    console.error(\'ID de meta de venda inválido fornecido:\', id);
    throw new Error(\'ID de meta de venda inválido.\');
  }
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select(\'*\')
      .eq(\'id\', id)
      .single();

    if (error) {
      if (error.code === \'PGRST116\') { // Erro específico do PostgREST para "não encontrado"
        console.warn(\`Meta de venda com ID ${id} não encontrada.\`);
        return null;
      }
      console.error(\`Erro ao buscar meta de venda ${id}:\`, error);
      throw new Error(\'Não foi possível buscar a meta de venda: \' + error.message);
    }
    return data as MetaVenda;
  } catch (err) {
    console.error(\`Exceção ao buscar meta de venda ${id}:\`, err);
    // Se o erro já foi tratado e é um "não encontrado", não relança.
    if (err instanceof Error && err.message.includes(\'não encontrada\')) return null;
    throw err instanceof Error ? err : new Error(\'Erro desconhecido ao buscar a meta de venda.\');
  }
};

/**
 * @description Cria uma nova meta de venda.
 * @param {CreateMetaVendaData} metaData - Dados da meta de venda a ser criada.
 * @returns {Promise<MetaVenda>} A meta de venda criada.
 * @throws {Error} Se os dados forem inválidos ou a inserção no Supabase falhar.
 */
export const createMetaVenda = async (metaData: CreateMetaVendaData): Promise<MetaVenda> => {
  if (!metaData || !metaData.vendedor_id || !metaData.periodo_inicio || !metaData.periodo_fim) {
    throw new Error(\'Dados insuficientes para criar meta de venda. Vendedor ID, período início e fim são obrigatórios.\');
  }
  if (metaData.meta_valor === null && metaData.meta_quantidade === null) {
    throw new Error(\'Pelo menos um valor de meta (meta_valor ou meta_quantidade) deve ser fornecido.\');
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([metaData])
      .select()
      .single();

    if (error) {
      console.error(\'Erro ao criar meta de venda:\', error);
      throw new Error(\'Não foi possível criar a meta de venda: \' + error.message);
    }
    return data as MetaVenda;
  } catch (err) {
    console.error(\'Exceção ao criar meta de venda:\', err);
    throw err instanceof Error ? err : new Error(\'Erro desconhecido ao criar a meta de venda.\');
  }
};

/**
 * @description Atualiza uma meta de venda existente.
 * @param {string} id - ID da meta de venda a ser atualizada.
 * @param {UpdateMetaVendaData} metaData - Dados a serem atualizados.
 * @returns {Promise<MetaVenda>} A meta de venda atualizada.
 * @throws {Error} Se o ID for inválido, dados inválidos ou a atualização no Supabase falhar.
 */
export const updateMetaVenda = async (id: string, metaData: UpdateMetaVendaData): Promise<MetaVenda> => {
  if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error(\'ID de meta de venda inválido.\');
  }
  if (Object.keys(metaData).length === 0) {
    throw new Error(\'Nenhum dado fornecido para atualização.\');
  }
  // Validação de pelo menos uma meta, caso ambos sejam fornecidos e um seja null
  if (metaData.hasOwnProperty(\'meta_valor\') && metaData.hasOwnProperty(\'meta_quantidade\') && metaData.meta_valor === null && metaData.meta_quantidade === null) {
     // Se o usuário está tentando definir ambos como null, busca o valor atual para manter a constraint
    const currentMeta = await getMetaVendaById(id);
    if (currentMeta && (currentMeta.meta_valor !== null || currentMeta.meta_quantidade !== null)) {
        // Se o usuário não forneceu explicitamente um valor para manter a constraint, podemos lançar erro ou ajustar.
        // Por simplicidade, vamos lançar erro aqui.
        if (metaData.meta_valor === null && metaData.meta_quantidade === null) {
             throw new Error(\'Ao atualizar, não é possível definir meta_valor e meta_quantidade como nulos simultaneamente se a meta já tiver um valor.\');
        }
    }
  }


  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({
        ...metaData,
        updated_at: new Date().toISOString(), // Garante atualização do timestamp
      })
      .eq(\'id\', id)
      .select()
      .single();

    if (error) {
      if (error.code === \'PGRST116\') {
        throw new Error(\`Meta de venda com ID ${id} não encontrada para atualização.\`);
      }
      console.error(\`Erro ao atualizar meta de venda ${id}:\`, error);
      throw new Error(\'Não foi possível atualizar a meta de venda: \' + error.message);
    }
    return data as MetaVenda;
  } catch (err) {
    console.error(\`Exceção ao atualizar meta de venda ${id}:\`, err);
    throw err instanceof Error ? err : new Error(\'Erro desconhecido ao atualizar a meta de venda.\');
  }
};

/**
 * @description Deleta uma meta de venda pelo ID.
 * @param {string} id - ID da meta de venda a ser deletada.
 * @returns {Promise<void>}
 * @throws {Error} Se o ID for inválido ou a deleção no Supabase falhar.
 */
export const deleteMetaVenda = async (id: string): Promise<void> => {
  if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    throw new Error(\'ID de meta de venda inválido.\');
  }
  try {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq(\'id\', id);

    if (error) {
      if (error.code === \'PGRST116\') { // Checa se o erro é por "não encontrado", pode ser interpretado como sucesso na deleção.
         console.warn(\`Tentativa de deletar meta de venda com ID ${id} que não foi encontrada.\`);
         return; // Operação idempotente
      }
      console.error(\`Erro ao deletar meta de venda ${id}:\`, error);
      throw new Error(\'Não foi possível deletar a meta de venda: \' + error.message);
    }
  } catch (err) {
    console.error(\`Exceção ao deletar meta de venda ${id}:\`, err);
    throw err instanceof Error ? err : new Error(\'Erro desconhecido ao deletar a meta de venda.\');
  }
}; 