import { supabase } from '@/integrations/supabase/client';
import { Fornecedor, fornecedorSchema, fornecedorUpdateSchema } from '@/lib/validations/fornecedorSchema';

// Tipo para opções de busca com paginação e filtros
export type GetFornecedoresOptions = {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  estado?: string;
};

/**
 * @description Busca fornecedores com paginação e filtros.
 * @param options Opções de paginação e filtro.
 * @returns Lista de fornecedores e informações de paginação.
 */
export const getFornecedores = async (options: GetFornecedoresOptions = {}) => {
  try {
    // Define valores padrão para as opções
    const pageSize = options.pageSize ?? 10;
    const rangeFrom = options.page ? (options.page - 1) * pageSize : 0;
    const rangeTo = options.page ? rangeFrom + pageSize - 1 : pageSize - 1;
    const sortBy = options.sortBy ?? 'nome_razao_social';
    const sortOrder = options.sortOrder ?? 'asc';

    // Inicia a query ao Supabase
    let query = supabase
      .from('fornecedores')
      .select('*', { count: 'exact' }) // 'exact' para obter a contagem total
      .range(rangeFrom, rangeTo); // Aplica a paginação

    // Aplica filtro por estado se fornecido
    if (options.estado) {
      query = query.eq('endereco_estado', options.estado);
    }

    // Aplica filtro de busca textual se fornecido
    if (options.searchTerm) {
      const searchPattern = `%${options.searchTerm}%`;
      query = query.or(
        `nome_razao_social.ilike.${searchPattern},` +
        `nome_fantasia.ilike.${searchPattern},` +
        `cnpj_cpf.ilike.${searchPattern},` +
        `email.ilike.${searchPattern},` +
        `contato_principal.ilike.${searchPattern}`
      );
    }

    // Aplica ordenação
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Executa a query
    const { data, error, count } = await query;

    // Verifica se ocorreu erro na consulta
    if (error) {
      console.error('Erro ao buscar fornecedores:', error);
      throw new Error('Não foi possível buscar os fornecedores.');
    }

    // Retorna os dados encontrados e a contagem total para cálculo da paginação
    return { 
      data: data as Fornecedor[], 
      count: count || 0,
      page: options.page || 1,
      pageSize,
      totalPages: count ? Math.ceil(count / pageSize) : 0
    };
  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    throw new Error('Não foi possível buscar os fornecedores. Verifique a conexão e tente novamente.');
  }
};

/**
 * @description Busca um fornecedor específico pelo ID.
 * @param id O ID do fornecedor.
 * @returns Os dados do fornecedor.
 */
export const getFornecedorById = async (id: string) => {
  try {
    // Valida o formato do ID (UUID)
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('ID de fornecedor inválido.');
    }

    // Realiza a busca na tabela 'fornecedores' pelo ID fornecido
    const { data, error } = await supabase
      .from('fornecedores')
      .select('*')
      .eq('id', id) // Filtra pelo ID
      .single(); // Espera um único resultado

    // Verifica se ocorreu erro na consulta
    if (error) {
      console.error(`Erro ao buscar fornecedor ${id}:`, error);
      
      // Verifica se o erro é de registro não encontrado
      if (error.code === 'PGRST116') {
        throw new Error('Fornecedor não encontrado.');
      }
      
      throw new Error('Não foi possível buscar o fornecedor.');
    }
    
    // Retorna os dados do fornecedor
    return data as Fornecedor;
  } catch (error) {
    console.error(`Erro ao buscar fornecedor:`, error);
    throw error instanceof Error ? error : new Error('Erro desconhecido ao buscar fornecedor.');
  }
};

/**
 * @description Cria um novo fornecedor.
 * @param fornecedorData Dados do fornecedor a ser criado.
 * @returns O fornecedor criado.
 */
export const createFornecedor = async (fornecedorData: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
  try {
    // Validação com Zod antes de enviar
    const validationResult = fornecedorSchema.omit({ 
      id: true, 
      created_at: true, 
      updated_at: true, 
      user_id: true 
    }).safeParse(fornecedorData);
    
    if (!validationResult.success) {
      console.error("Erro de validação ao criar fornecedor:", validationResult.error);
      throw new Error(validationResult.error.errors[0]?.message || "Dados inválidos para criação do fornecedor.");
    }

    // Insere os dados validados na tabela 'fornecedores'
    const { data, error } = await supabase
      .from('fornecedores')
      .insert([validationResult.data]) // Insere um array com o objeto
      .select() // Retorna o registro inserido
      .single(); // Espera um único resultado

    // Verifica se ocorreu erro na inserção
    if (error) {
      console.error('Erro ao criar fornecedor:', error);
      
      // Verifica especificamente o erro de permissão (403)
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        throw new Error('Erro de permissão: Você não tem autorização para cadastrar fornecedores. Verifique se você está autenticado corretamente.');
      }
      
      throw new Error('Não foi possível criar o fornecedor. Verifique os dados e tente novamente.');
    }
    
    // Retorna o fornecedor criado
    return data as Fornecedor;
  } catch (error) {
    console.error('Erro ao criar fornecedor:', error);
    throw error instanceof Error ? error : new Error('Erro desconhecido ao criar fornecedor.');
  }
};

/**
 * @description Atualiza um fornecedor existente.
 * @param id O ID do fornecedor a ser atualizado.
 * @param updatedData Dados a serem atualizados.
 * @returns O fornecedor atualizado.
 */
export const updateFornecedor = async (id: string, updatedData: Partial<Omit<Fornecedor, 'id' | 'created_at' | 'updated_at' | 'user_id'>>) => {
  try {
    // Valida o formato do ID (UUID)
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('ID de fornecedor inválido.');
    }

    // Validação parcial com Zod
    const validationResult = fornecedorUpdateSchema.omit({ 
      id: true, 
      created_at: true, 
      updated_at: true, 
      user_id: true 
    }).safeParse(updatedData);
    
    if (!validationResult.success) {
      console.error("Erro de validação ao atualizar fornecedor:", validationResult.error);
      throw new Error(validationResult.error.errors[0]?.message || "Dados inválidos para atualização do fornecedor.");
    }

    // Atualiza o registro na tabela 'fornecedores' correspondente ao ID
    const { data, error } = await supabase
      .from('fornecedores')
      .update({
        ...validationResult.data,
        updated_at: new Date().toISOString() // Atualiza o timestamp
      })
      .eq('id', id) // Filtra pelo ID
      .select() // Retorna o registro atualizado
      .single(); // Espera um único resultado

    // Verifica se ocorreu erro na atualização
    if (error) {
      console.error(`Erro ao atualizar fornecedor ${id}:`, error);
      
      // Verifica se o erro é de registro não encontrado
      if (error.code === 'PGRST116') {
        throw new Error('Fornecedor não encontrado.');
      }
      
      throw new Error('Não foi possível atualizar o fornecedor.');
    }
    
    // Retorna o fornecedor atualizado
    return data as Fornecedor;
  } catch (error) {
    console.error(`Erro ao atualizar fornecedor:`, error);
    throw error instanceof Error ? error : new Error('Erro desconhecido ao atualizar fornecedor.');
  }
};

/**
 * @description Deleta um fornecedor.
 * @param id O ID do fornecedor a ser deletado.
 * @returns Objeto indicando sucesso da operação.
 */
export const deleteFornecedor = async (id: string) => {
  try {
    // Valida o formato do ID (UUID)
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('ID de fornecedor inválido.');
    }

    // Verifica se o fornecedor é referenciado em algum produto
    const { data: produtosVinculados, error: erroProdutos } = await supabase
      .from('produtos')
      .select('id')
      .eq('fornecedor_id', id);

    if (erroProdutos) {
      console.error(`Erro ao verificar produtos vinculados:`, erroProdutos);
      throw new Error('Erro ao verificar produtos vinculados ao fornecedor.');
    }

    // Se houver produtos vinculados, impede a exclusão
    if (produtosVinculados && produtosVinculados.length > 0) {
      throw new Error(`Não é possível excluir este fornecedor pois existem ${produtosVinculados.length} produtos vinculados a ele.`);
    }

    // Deleta o registro da tabela 'fornecedores' correspondente ao ID
    const { error } = await supabase
      .from('fornecedores')
      .delete() // Executa a deleção
      .eq('id', id); // Filtra pelo ID

    // Verifica se ocorreu erro na deleção
    if (error) {
      console.error(`Erro ao deletar fornecedor ${id}:`, error);
      
      // Verifica se o erro é de registro não encontrado
      if (error.code === 'PGRST116') {
        throw new Error('Fornecedor não encontrado.');
      }
      
      throw new Error('Não foi possível deletar o fornecedor.');
    }

    // Retorna sucesso
    return { success: true, message: 'Fornecedor excluído com sucesso.' };
  } catch (error) {
    console.error(`Erro ao deletar fornecedor:`, error);
    throw error instanceof Error ? error : new Error('Erro desconhecido ao deletar fornecedor.');
  }
};

/**
 * @description Obter lista de estados para filtros.
 * @returns Lista única de estados dos fornecedores cadastrados.
 */
export const getEstadosFornecedores = async () => {
  try {
    // Busca todos os valores únicos da coluna endereco_estado
    const { data, error } = await supabase
      .from('fornecedores')
      .select('endereco_estado')
      .not('endereco_estado', 'is', null) // Exclui valores nulos
      .order('endereco_estado');

    if (error) {
      console.error('Erro ao buscar estados dos fornecedores:', error);
      throw new Error('Não foi possível obter a lista de estados.');
    }

    // Filtra valores únicos (em caso de duplicatas)
    const estados = [...new Set(data.map(item => item.endereco_estado))];
    
    return estados;
  } catch (error) {
    console.error('Erro ao buscar estados dos fornecedores:', error);
    throw new Error('Não foi possível obter a lista de estados.');
  }
}; 