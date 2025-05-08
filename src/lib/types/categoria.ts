// src/lib/types/categoria.ts

/**
 * Define os tipos possíveis para uma categoria, correspondendo ao ENUM no banco de dados.
 */
export const categoriaTipos = ['produto', 'despesa', 'receita', 'geral'] as const;
export type CategoriaTipo = typeof categoriaTipos[number];

/**
 * Interface que representa a estrutura de uma Categoria, 
 * baseada na tabela 'categorias' do Supabase.
 */
export interface Categoria {
  id: string; // uuid
  nome: string; // text, not null
  descricao?: string | null; // text, nullable
  tipo: CategoriaTipo; // public.categoria_tipo, not null
  cor?: string | null; // text, nullable (formato #RRGGBB)
  user_id: string; // uuid, not null
  created_at: string; // timestamp with time zone, not null
  ativa: boolean; // boolean, not null
}

/**
 * Tipo para representar os dados necessários para criar uma nova categoria.
 * Omitimos campos que são gerados automaticamente ou gerenciados pelo backend/RLS.
 */
export type NovaCategoria = Omit<Categoria, 'id' | 'user_id' | 'created_at' | 'ativa'>;

/**
 * Tipo para representar os dados ao atualizar uma categoria.
 * Todos os campos são opcionais, exceto o 'id'.
 */
export type UpdateCategoriaData = Partial<Omit<Categoria, 'id' | 'user_id' | 'created_at'>>; 