import { supabase } from '@/integrations/supabase/client';
import { Categoria, CategoriaTipo, NovaCategoria, UpdateCategoriaData } from '@/lib/types/categoria';
import { handleSupabaseError } from '@/lib/utils/supabase-error-handler';

const TABLE_NAME = 'categorias';

/**
 * Busca categorias do Supabase, permitindo filtros.
 * @param tipo - Filtra por um tipo específico de categoria (opcional).
 * @param apenasAtivas - Se true, retorna apenas categorias com 'ativa = true' (opcional, padrão true).
 * @returns Uma promessa que resolve para um array de Categorias.
 * @throws Lança um erro se a consulta ao Supabase falhar.
 */
export const getCategorias = async (
  tipo?: CategoriaTipo,
  apenasAtivas: boolean = true
): Promise<Categoria[]> => {
  // Inicia a consulta selecionando todas as colunas
  let query = supabase.from(TABLE_NAME).select('*');

  // Aplica filtro por tipo, se fornecido
  if (tipo) {
    query = query.eq('tipo', tipo);
  }

  // Aplica filtro por ativa, se solicitado (padrão é true)
  if (apenasAtivas) {
    query = query.eq('ativa', true);
  }

  // Ordena por tipo e depois por nome para consistência
  query = query.order('tipo').order('nome');

  // Executa a consulta
  const { data, error } = await query;

  // Trata erros potenciais do Supabase
  handleSupabaseError(error, 'Erro ao buscar categorias');

  // Retorna os dados ou um array vazio se data for null
  return data || [];
};


/**
 * Busca uma única categoria pelo seu ID.
 * @param id - O ID da categoria a ser buscada.
 * @returns Uma promessa que resolve para a Categoria encontrada ou null se não encontrada.
 * @throws Lança um erro se a consulta ao Supabase falhar.
 */
export const getCategoriaById = async (id: string): Promise<Categoria | null> => {
    // Seleciona todas as colunas da tabela onde o id corresponde ao fornecido
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single(); // Espera um único resultado ou null
  
    // Trata erros potenciais do Supabase
    handleSupabaseError(error, `Erro ao buscar categoria com ID ${id}`);
  
    // Retorna os dados da categoria encontrada ou null
    return data;
  };


/**
 * Cria uma nova categoria no Supabase.
 * @param novaCategoria - Objeto contendo os dados da nova categoria (validados pelo schema Zod).
 * @returns Uma promessa que resolve para a Categoria recém-criada.
 * @throws Lança um erro se a inserção no Supabase falhar.
 */
export const createCategoria = async (novaCategoria: NovaCategoria): Promise<Categoria> => {
  // Insere os dados da nova categoria na tabela
  // O user_id será adicionado automaticamente pela RLS ou trigger, dependendo da configuração
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(novaCategoria)
    .select() // Retorna o objeto inserido
    .single(); // Espera um único resultado

  // Trata erros potenciais do Supabase
  handleSupabaseError(error, 'Erro ao criar nova categoria');

  // Verifica se data não é null (embora handleSupabaseError deva ter lançado erro antes se fosse o caso)
  if (!data) {
    throw new Error('Não foi possível criar a categoria, dados retornados são nulos.');
  }
  
  // Retorna a categoria criada
  return data;
};

/**
 * Atualiza uma categoria existente no Supabase.
 * @param id - O ID da categoria a ser atualizada.
 * @param updateData - Objeto contendo os campos a serem atualizados.
 * @returns Uma promessa que resolve para a Categoria atualizada.
 * @throws Lança um erro se a atualização no Supabase falhar.
 */
export const updateCategoria = async (id: string, updateData: UpdateCategoriaData): Promise<Categoria> => {
  // Atualiza a categoria correspondente ao ID com os novos dados
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update(updateData)
    .eq('id', id) // Garante que apenas a categoria correta seja atualizada
    .select() // Retorna o objeto atualizado
    .single(); // Espera um único resultado

  // Trata erros potenciais do Supabase
  handleSupabaseError(error, `Erro ao atualizar categoria com ID ${id}`);

   // Verifica se data não é null
   if (!data) {
    throw new Error(`Não foi possível atualizar a categoria ${id}, dados retornados são nulos.`);
  }

  // Retorna a categoria atualizada
  return data;
};

/**
 * Realiza o "soft delete" de uma categoria, marcando-a como inativa.
 * @param id - O ID da categoria a ser desativada.
 * @returns Uma promessa que resolve para a Categoria atualizada (agora inativa).
 * @throws Lança um erro se a atualização no Supabase falhar.
 */
export const deleteCategoria = async (id: string): Promise<Categoria> => {
  // Atualiza a coluna 'ativa' para false na categoria correspondente ao ID
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .update({ ativa: false }) // Define ativa como false
    .eq('id', id) // Garante que apenas a categoria correta seja desativada
    .select() // Retorna o objeto atualizado
    .single(); // Espera um único resultado

  // Trata erros potenciais do Supabase
  handleSupabaseError(error, `Erro ao desativar categoria com ID ${id}`);

  // Verifica se data não é null
  if (!data) {
   throw new Error(`Não foi possível desativar a categoria ${id}, dados retornados são nulos.`);
 }

  // Retorna a categoria atualizada (agora inativa)
  return data;
};

/**
 * Garante que a categoria padrão "Outras Despesas" exista para o usuário logado.
 * Verifica se existe e cria caso contrário.
 * É seguro chamar múltiplas vezes.
 * @returns Uma promessa que resolve para a Categoria "Outras Despesas" (existente ou recém-criada).
 * @throws Lança um erro se a verificação ou criação falhar.
 */
export const ensureOutrasDespesasExists = async (): Promise<Categoria> => {
  const nomeCategoriaPadrao = 'Outras Despesas';
  const tipoCategoria = 'despesa';

  // 1. Tenta buscar a categoria existente (case-insensitive)
  const { data: existentes, error: fetchError } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .ilike('nome', nomeCategoriaPadrao) // Busca case-insensitive
    .eq('tipo', tipoCategoria)
    // Assume que RLS garante que só busque do usuário logado
    .limit(1);

  // Tratar erro na busca (exceto se for Pgrst116 - 0 rows, que é normal)
  if (fetchError && fetchError.code !== 'PGRST116') {
    handleSupabaseError(fetchError, 'Erro ao verificar existência da categoria "Outras Despesas"');
  }

  // 2. Se encontrou, retorna a existente
  if (existentes && existentes.length > 0) {
    console.log('Categoria "Outras Despesas" já existe.');
    return existentes[0] as Categoria; // Faz type assertion seguro aqui
  }

  // 3. Se não encontrou, cria a nova categoria
  console.log('Categoria "Outras Despesas" não encontrada. Criando...');
  try {
    const novaCategoriaData: NovaCategoria = {
      nome: nomeCategoriaPadrao,
      tipo: tipoCategoria,
      descricao: 'Categoria para despesas diversas ou não classificadas.',
      cor: '#808080', // Cinza
      ativa: true,
      // user_id será adicionado pelo valor padrão ou RLS/trigger
    };
    const categoriaCriada = await createCategoria(novaCategoriaData);
    console.log('Categoria "Outras Despesas" criada com sucesso.');
    return categoriaCriada;
  } catch (createError) {
    // Log específico para falha na criação
    console.error('Erro ao tentar criar a categoria "Outras Despesas":', createError);
    // Re-lança o erro para ser tratado pelo chamador
    throw createError; 
  }
};

/**
 * Garante que categorias padrão de receita existam para o usuário.
 * Verifica se existem e cria caso contrário.
 * @returns Uma promessa que resolve para um array de categorias padrão de receita.
 * @throws Lança um erro se a verificação ou criação falhar.
 */
export const ensureReceitasCategoriesExist = async (): Promise<Categoria[]> => {
  // Lista de categorias padrão de receita
  const categoriasPadrao = [
    {
      nome: 'Vendas',
      tipo: 'receita' as CategoriaTipo,
      descricao: 'Receitas provenientes de vendas de produtos ou mercadorias.',
      cor: '#4CAF50' // Verde
    },
    {
      nome: 'Serviços',
      tipo: 'receita' as CategoriaTipo,
      descricao: 'Receitas provenientes de prestação de serviços.',
      cor: '#2196F3' // Azul
    },
    {
      nome: 'Aluguéis',
      tipo: 'receita' as CategoriaTipo,
      descricao: 'Receitas provenientes de locação de imóveis, espaços ou equipamentos.',
      cor: '#FFC107' // Amarelo
    },
    {
      nome: 'Comissões',
      tipo: 'receita' as CategoriaTipo,
      descricao: 'Receitas provenientes de comissões sobre vendas ou serviços.',
      cor: '#9C27B0' // Roxo
    },
    {
      nome: 'Outras Receitas',
      tipo: 'receita' as CategoriaTipo,
      descricao: 'Receitas diversas ou não classificadas nas demais categorias.',
      cor: '#607D8B' // Cinza azulado
    }
  ];

  const categoriasExistentes: Categoria[] = [];
  const categoriasParaCriar = [...categoriasPadrao];

  // Verifica quais categorias já existem
  for (const categoria of categoriasPadrao) {
    try {
      const { data: existentes } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('tipo', 'receita')
        .ilike('nome', categoria.nome)
        .limit(1);

      if (existentes && existentes.length > 0) {
        categoriasExistentes.push(existentes[0] as Categoria);
        // Remove da lista de categorias para criar
        const index = categoriasParaCriar.findIndex(c => c.nome === categoria.nome);
        if (index !== -1) {
          categoriasParaCriar.splice(index, 1);
        }
      }
    } catch (error) {
      console.error(`Erro ao verificar existência da categoria "${categoria.nome}":`, error);
    }
  }

  // Cria as categorias que não existem
  for (const categoria of categoriasParaCriar) {
    try {
      const novaCategoriaData: NovaCategoria = {
        nome: categoria.nome,
        tipo: categoria.tipo,
        descricao: categoria.descricao,
        cor: categoria.cor,
        ativa: true
      };
      
      const categoriaCriada = await createCategoria(novaCategoriaData);
      categoriasExistentes.push(categoriaCriada);
      console.log(`Categoria "${categoria.nome}" criada com sucesso.`);
    } catch (createError) {
      console.error(`Erro ao tentar criar a categoria "${categoria.nome}":`, createError);
    }
  }

  return categoriasExistentes;
}; 