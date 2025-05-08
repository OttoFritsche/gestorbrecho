import { PostgrestError } from '@supabase/supabase-js';

/**
 * Tenta extrair uma mensagem de erro amigável de um erro do Supabase (PostgrestError).
 * Se não for um erro conhecido ou não tiver mensagem, retorna a mensagem padrão.
 * 
 * @param error O objeto de erro retornado pelo Supabase (pode ser null).
 * @param defaultMessage Uma mensagem padrão para retornar se nenhuma mensagem específica for encontrada.
 * @returns Uma string com a mensagem de erro.
 */
export const handleSupabaseError = (
  error: PostgrestError | Error | unknown | null,
  defaultMessage: string = 'Ocorreu um erro inesperado.'
): string => {
  if (!error) {
    return ''; // Retorna string vazia se não houver erro (para não exibir toast)
  }

  console.error('Supabase Error Handler received:', error); // Log do erro completo

  // Verifica se é um PostgrestError
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const pgError = error as PostgrestError;
    // Você pode adicionar lógicas aqui para tratar códigos de erro específicos do Postgres
    // Ex: if (pgError.code === '23505') return 'Erro: Registro duplicado.';
    return pgError.message || defaultMessage;
  }
  
  // Verifica se é um Error padrão do JS
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  // Fallback para outros tipos de erro
  if (typeof error === 'string') {
    return error;
  }

  // Se não for possível extrair a mensagem, retorna a padrão
  return defaultMessage;
}; 