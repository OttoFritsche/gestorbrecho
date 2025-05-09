import { supabase } from '@/integrations/supabase/client';

/**
 * Interface que define a estrutura de um Vendedor conforme tabela no banco de dados
 */
export interface Vendedor {
  id: string;                     // UUID (PK)
  nome: string;                   // TEXT NOT NULL
  email: string | null;           // TEXT UNIQUE
  telefone: string | null;        // TEXT
  data_contratacao: string | null; // DATE (formato ISO)
  user_id: string | null;         // UUID referência para auth.users
  created_at: string;             // TIMESTAMP WITH TIME ZONE
  updated_at: string;             // TIMESTAMP WITH TIME ZONE
  status: string;                 // TEXT NOT NULL (ativo, inativo, afastado, desligado)
  regra_comissao_id?: string | null; // UUID NULL REFERENCES public.regras_comissao(id) - Opcional no frontend
}

/**
 * @description Busca todos os vendedores
 * @returns Lista de vendedores ou null em caso de erro
 */
export const getVendedores = async (): Promise<Vendedor[]> => {
  try {
    // Realiza a busca na tabela 'vendedores'
    const { data, error } = await supabase
      .from('vendedores')
      .select('*')
      .order('nome');

    // Verifica se ocorreu erro na consulta
    if (error) {
      console.error('Erro ao buscar vendedores:', error);
      throw new Error('Não foi possível buscar os vendedores: ' + error.message);
    }
    
    // Retorna os dados dos vendedores
    return data as Vendedor[];
  } catch (error) {
    console.error('Erro ao buscar vendedores:', error);
    throw new Error('Não foi possível buscar os vendedores. Verifique sua conexão ou permissões de acesso.');
  }
};

/**
 * @description Busca todos os vendedores ativos para uso em um Select (id e nome).
 * @returns Lista de vendedores ativos ({id, nome}) ou null em caso de erro.
 */
export const getVendedoresAtivosParaSelect = async (): Promise<{ id: string; nome: string }[]> => {
  try {
    // Realiza a busca na tabela 'vendedores'
    const { data, error } = await supabase
      .from('vendedores')
      .select('id, nome')
      .eq('status', 'ativo') // Filtra por vendedores ativos
      .order('nome');

    // Verifica se ocorreu erro na consulta
    if (error) {
      console.error('Erro ao buscar vendedores ativos para select:', error);
      throw new Error('Não foi possível buscar os vendedores ativos: ' + error.message);
    }
    
    // Retorna os dados dos vendedores
    return data as { id: string; nome: string }[];
  } catch (error) {
    console.error('Erro ao buscar vendedores ativos para select:', error);
    // Lançar o erro para que o chamador possa tratar (ex: React Query onError)
    throw error;
  }
};

/**
 * @description Busca um vendedor específico pelo ID
 * @param id O ID do vendedor
 * @returns Dados do vendedor ou null em caso de erro
 */
export const getVendedorById = async (id: string): Promise<Vendedor | null> => {
  try {
    // Valida o formato do ID (UUID)
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('ID de vendedor inválido.');
    }

    // Realiza a busca na tabela 'vendedores' pelo ID fornecido
    const { data, error } = await supabase
      .from('vendedores')
      .select('*')
      .eq('id', id) // Filtra pelo ID
      .single(); // Espera um único resultado

    // Verifica se ocorreu erro na consulta
    if (error) {
      console.error(`Erro ao buscar vendedor ${id}:`, error);
      
      // Verifica se o erro é de registro não encontrado
      if (error.code === 'PGRST116') {
        throw new Error('Vendedor não encontrado.');
      }
      
      throw new Error('Não foi possível buscar o vendedor.');
    }
    
    // Retorna os dados do vendedor
    return data as Vendedor;
  } catch (error) {
    console.error(`Erro ao buscar vendedor:`, error);
    return null;
  }
};

/**
 * @description Cria um novo vendedor
 * @param data Dados do vendedor a ser criado
 * @returns O vendedor criado ou null em caso de erro
 */
export const createVendedor = async (
  data: Omit<Vendedor, 'id' | 'created_at' | 'updated_at'>
): Promise<Vendedor | null> => {
  try {
    // Valida dados básicos
    if (!data.nome) {
      throw new Error('Nome do vendedor é obrigatório.');
    }

    // Insere os dados na tabela 'vendedores'
    const { data: newVendedor, error } = await supabase
      .from('vendedores')
      .insert([data]) // Insere um array com o objeto
      .select() // Retorna o registro inserido
      .single(); // Espera um único resultado

    // Verifica se ocorreu erro na inserção
    if (error) {
      console.error('Erro ao criar vendedor:', error);
      
      // Verifica especificamente o erro de permissão (403)
      if (error.code === 'PGRST301' || error.message?.includes('permission denied')) {
        throw new Error('Erro de permissão: Você não tem autorização para cadastrar vendedores. Verifique se você está autenticado corretamente.');
      }

      // Verifica erro de violação de chave única (email duplicado)
      if (error.code === '23505' && error.message?.includes('email')) {
        throw new Error('Email já cadastrado para outro vendedor.');
      }
      
      throw new Error('Não foi possível criar o vendedor. Verifique os dados e tente novamente.');
    }
    
    // Retorna o vendedor criado
    return newVendedor as Vendedor;
  } catch (error) {
    console.error('Erro ao criar vendedor:', error);
    return null;
  }
};

/**
 * @description Atualiza um vendedor existente
 * @param id ID do vendedor a ser atualizado
 * @param data Dados a serem atualizados
 * @returns O vendedor atualizado ou null em caso de erro
 */
export const updateVendedor = async (
  id: string, 
  data: Partial<Omit<Vendedor, 'id' | 'created_at' | 'updated_at'>>
): Promise<Vendedor | null> => {
  try {
    // Valida o formato do ID (UUID)
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('ID de vendedor inválido.');
    }

    // Atualiza o registro na tabela 'vendedores' correspondente ao ID
    const { data: updatedVendedor, error } = await supabase
      .from('vendedores')
      .update({
        ...data,
        updated_at: new Date().toISOString() // Atualiza o timestamp
      })
      .eq('id', id) // Filtra pelo ID
      .select() // Retorna o registro atualizado
      .single(); // Espera um único resultado

    // Verifica se ocorreu erro na atualização
    if (error) {
      console.error(`Erro ao atualizar vendedor ${id}:`, error);
      
      // Verifica se o erro é de registro não encontrado
      if (error.code === 'PGRST116') {
        throw new Error('Vendedor não encontrado.');
      }

      // Verifica erro de violação de chave única (email duplicado)
      if (error.code === '23505' && error.message?.includes('email')) {
        throw new Error('Email já cadastrado para outro vendedor.');
      }
      
      throw new Error('Não foi possível atualizar o vendedor.');
    }
    
    // Retorna o vendedor atualizado
    return updatedVendedor as Vendedor;
  } catch (error) {
    console.error(`Erro ao atualizar vendedor:`, error);
    return null;
  }
};

/**
 * @description Deleta um vendedor pelo ID
 * @param id ID do vendedor a ser deletado
 * @returns void ou null em caso de erro
 */
export const deleteVendedor = async (id: string): Promise<void | null> => {
  try {
    // Valida o formato do ID (UUID)
    if (!id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      throw new Error('ID de vendedor inválido.');
    }

    // Verifica se o vendedor está associado a alguma venda
    const { data: vendasVinculadas, error: erroVendas } = await supabase
      .from('vendas')
      .select('id')
      .eq('vendedor_id', id);

    if (erroVendas) {
      console.error(`Erro ao verificar vendas vinculadas:`, erroVendas);
      throw new Error('Erro ao verificar vendas vinculadas ao vendedor.');
    }

    // Apenas alerta sobre vendas vinculadas
    if (vendasVinculadas && vendasVinculadas.length > 0) {
      console.warn(`O vendedor possui ${vendasVinculadas.length} vendas associadas. A exclusão definirá vendedor_id como NULL nestas vendas.`);
    }

    // Deleta o registro da tabela 'vendedores' correspondente ao ID
    const { error } = await supabase
      .from('vendedores')
      .delete() // Executa a deleção
      .eq('id', id); // Filtra pelo ID

    // Verifica se ocorreu erro na deleção
    if (error) {
      console.error(`Erro ao deletar vendedor ${id}:`, error);
      
      // Verifica se o erro é de registro não encontrado
      if (error.code === 'PGRST116') {
        throw new Error('Vendedor não encontrado.');
      }
      
      throw new Error('Não foi possível deletar o vendedor.');
    }
  } catch (error) {
    console.error(`Erro ao deletar vendedor:`, error);
    return null;
  }
}; 